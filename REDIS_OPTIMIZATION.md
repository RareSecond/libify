# Redis Command Explosion - Root Cause Analysis & Solutions

## Problem Summary
During playlist import, Redis command usage skyrocketed and continued increasing even after the import finished, leading to excessive costs from the external Redis provider.

## Root Cause Analysis

### 1. Aggressive SSE Polling (`library.controller.ts:468-514`)
- **Current behavior**: Every SSE connection polls Redis every 500ms
- **Redis commands per poll**: At least 2 (`getJob` + `getState`)
- **Result**: 4+ Redis commands per second per connection

### 2. Zombie Connections
The server-side `setInterval` only stops when:
- ✅ Job completes/fails
- ✅ Client properly calls `eventSource.close()`
- ❌ **NOT when**: Client crashes, network drops, browser force-closes, or connection hangs

**Impact**: Disconnected clients leave intervals running forever, continuously polling Redis.

### 3. Multiple Concurrent Connections
Each of these actions creates additional polling intervals:
- Page refresh during sync
- Opening multiple tabs
- Network reconnections
- Stale connections from crashes

This multiplies Redis usage exponentially.

### 4. Why Commands Continued After Completion
After import finished, the system likely had:
- Zombie connections from page refreshes/crashes still polling
- Multiple browser tabs/sessions each with their own intervals
- No server-side timeout to kill stale connections
- Completed jobs kept for 1 hour (`removeOnComplete.age: 3600`), allowing continued polling

## Solutions

### Immediate Fixes (Implement Now)

#### 1. Add Server-Side Timeout to SSE
```typescript
@Sse('sync/:jobId/progress')
syncProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
  return new Observable((subscriber) => {
    const MAX_DURATION = 30 * 60 * 1000; // 30 minutes max
    const startTime = Date.now();

    const checkProgress = async () => {
      // Kill connection after max duration
      if (Date.now() - startTime > MAX_DURATION) {
        subscriber.next({
          data: JSON.stringify({ error: 'Connection timeout' }),
        } as MessageEvent);
        subscriber.complete();
        return;
      }

      try {
        const job = await this.syncQueue.getJob(jobId);
        if (!job) {
          subscriber.next({
            data: JSON.stringify({ error: 'Job not found' }),
          } as MessageEvent);
          subscriber.complete();
          return;
        }

        const state = await job.getState();
        const progress = job.progress;

        subscriber.next({
          data: JSON.stringify({
            error: state === 'failed' ? job.failedReason : undefined,
            jobId: job.id,
            progress,
            result: state === 'completed' ? job.returnvalue : undefined,
            state,
          }),
        } as MessageEvent);

        // Immediately stop polling on terminal states
        if (state === 'completed' || state === 'failed') {
          subscriber.complete();
          clearInterval(intervalId); // Stop immediately
        }
      } catch (error) {
        subscriber.error(error);
      }
    };

    // Check immediately
    checkProgress();

    // Then check every 2000ms (increased from 500ms)
    const intervalId = setInterval(checkProgress, 2000);

    // Cleanup on unsubscribe
    return () => {
      clearInterval(intervalId);
    };
  });
}
```

#### 2. Increase Polling Interval
- Change from 500ms → 2000ms
- Reduces Redis commands by 75% while maintaining responsiveness

#### 3. Reduce Job Retention
```typescript
// In queue.module.ts
removeOnComplete: {
  age: 300,  // Reduce from 3600 (1 hour) to 300 (5 minutes)
  count: 10, // Keep last 10 completed jobs
}
```

### Long-Term Solutions

#### 1. WebSocket-Based Push (Recommended)
Replace polling with event-driven updates:

```typescript
// Use BullMQ events to push updates
@WebSocketGateway()
export class SyncProgressGateway {
  constructor(@InjectQueue('sync') private syncQueue: Queue) {
    this.syncQueue.on('progress', (job, progress) => {
      this.server.to(`sync-${job.id}`).emit('progress', progress);
    });

    this.syncQueue.on('completed', (job) => {
      this.server.to(`sync-${job.id}`).emit('completed', job.returnvalue);
    });
  }
}
```

#### 2. Client-Side Polling with TanStack Query
Replace SSE with controlled client-side polling:

```typescript
// Better control, automatic cleanup, built-in caching
const { data: jobStatus } = useQuery({
  queryKey: ['sync-progress', jobId],
  queryFn: () => fetch(`/library/sync/${jobId}`).then(r => r.json()),
  refetchInterval: (data) => {
    if (!data) return false;
    if (data.state === 'active') return 2000;
    if (data.state === 'waiting') return 5000;
    return false; // Stop polling when completed/failed
  },
  enabled: !!jobId,
});
```

#### 3. Connection Tracking & Rate Limiting
```typescript
@Injectable()
export class ConnectionTracker {
  private activeConnections = new Map<string, Set<string>>();

  canConnect(userId: string, connectionId: string): boolean {
    const userConnections = this.activeConnections.get(userId) || new Set();

    // Limit to 2 concurrent connections per user
    if (userConnections.size >= 2) {
      return false;
    }

    userConnections.add(connectionId);
    this.activeConnections.set(userId, userConnections);
    return true;
  }

  disconnect(userId: string, connectionId: string): void {
    const userConnections = this.activeConnections.get(userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.activeConnections.delete(userId);
      }
    }
  }
}
```

#### 4. Exponential Backoff for Progress Checks
```typescript
class AdaptivePolling {
  private checkCount = 0;
  private lastState?: string;

  getInterval(state: string): number {
    // Reset counter on state change
    if (state !== this.lastState) {
      this.checkCount = 0;
      this.lastState = state;
    }

    this.checkCount++;

    // Active jobs: frequent updates
    if (state === 'active') {
      if (this.checkCount < 10) return 500;
      if (this.checkCount < 50) return 1000;
      return 2000;
    }

    // Waiting jobs: less frequent
    if (state === 'waiting') {
      return Math.min(10000, 2000 * Math.pow(1.5, this.checkCount));
    }

    // Terminal states: stop after a few checks
    if (state === 'completed' || state === 'failed') {
      if (this.checkCount > 3) return -1; // Stop polling
      return 5000;
    }

    return 2000; // Default
  }
}
```

## Monitoring & Prevention

### 1. Add Redis Command Metrics
```typescript
@Injectable()
export class RedisMetrics {
  private commandCount = 0;
  private lastReset = Date.now();

  increment(): void {
    this.commandCount++;

    // Alert if excessive
    const elapsed = Date.now() - this.lastReset;
    const commandsPerSecond = this.commandCount / (elapsed / 1000);

    if (commandsPerSecond > 100) {
      this.logger.warn(`High Redis usage: ${commandsPerSecond} commands/sec`);
    }

    // Reset every minute
    if (elapsed > 60000) {
      this.commandCount = 0;
      this.lastReset = Date.now();
    }
  }
}
```

### 2. Connection Lifecycle Logging
```typescript
// Log all SSE connections
this.logger.log(`SSE connection opened: user=${userId}, job=${jobId}`);
// On cleanup
this.logger.log(`SSE connection closed: user=${userId}, job=${jobId}, duration=${duration}ms`);
```

### 3. Health Check for Zombie Connections
```typescript
@Cron('*/5 * * * *') // Every 5 minutes
async cleanupZombieConnections() {
  const activeJobs = await this.syncQueue.getActive();
  const completedJobs = await this.syncQueue.getCompleted();

  // Log if we have SSE connections for completed jobs
  // Implementation depends on connection tracking
}
```

## Implementation Priority

1. **Critical (Do immediately)**:
   - Increase polling interval from 500ms → 2000ms
   - Add server-side timeout (30 minutes max)
   - Stop polling immediately on terminal states

2. **High (Within a week)**:
   - Reduce job retention to 5 minutes
   - Add connection tracking and limits
   - Implement monitoring/alerting

3. **Medium (Next sprint)**:
   - Switch to WebSocket-based push notifications
   - Or implement client-side polling with TanStack Query
   - Add exponential backoff

4. **Low (Future improvement)**:
   - Comprehensive metrics dashboard
   - Auto-scaling based on Redis usage
   - Cost optimization analysis

## Cost Estimation

With immediate fixes:
- Current: 4+ commands/second/connection
- After: 0.5 commands/second/connection
- **Reduction: 87.5%**

With long-term solutions (WebSocket):
- Only commands when progress actually changes
- **Reduction: 95-99%**

## Testing Checklist

- [ ] Test with multiple concurrent syncs
- [ ] Test browser refresh during sync
- [ ] Test network disconnection scenarios
- [ ] Test with multiple browser tabs
- [ ] Monitor Redis commands during 30-minute sync
- [ ] Verify cleanup after job completion
- [ ] Test timeout behavior
- [ ] Load test with 10+ concurrent users