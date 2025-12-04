import { InjectQueue } from "@nestjs/bullmq";
import { Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Queue, QueueEvents } from "bullmq";
import { parse as parseCookie } from "cookie";
import { Server, Socket } from "socket.io";

interface JobProgressData {
  current?: number;
  errors?: string[];
  estimatedTimeRemaining?: number;
  itemsPerSecond?: number;
  message?: string;
  percentage?: number;
  phase?: string;
  total?: number;
}

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^https?:\/\/(?:[\w-]+\.)*codictive\.be$/,
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
  },
  namespace: "/sync",
})
export class SyncProgressGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy,
    OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private activeConnections = new Map<string, Set<string>>(); // jobId -> Set<socketId>
  private readonly logger = new Logger(SyncProgressGateway.name);
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue("sync") private syncQueue: Queue,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT from cookie
      const cookies = client.handshake.headers.cookie;
      if (!cookies) {
        this.logger.warn(`Connection rejected: No cookies provided`);
        client.disconnect();
        return;
      }

      const parsedCookies = parseCookie(cookies);
      const token = parsedCookies.jwt;

      if (!token) {
        this.logger.warn(`Connection rejected: No JWT token in cookies`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user ID to socket for later use
      client.data.userId = String(payload.sub);

      this.logger.log(
        `Client connected: ${client.id} (user: ${client.data.userId})`,
      );
    } catch (error) {
      this.logger.warn(
        `Connection rejected: Invalid JWT token - ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from all active connections
    for (const [jobId, clients] of this.activeConnections.entries()) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.activeConnections.delete(jobId);
      }
    }
  }

  @SubscribeMessage("subscribe")
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    const { jobId } = data;
    const userId = client.data.userId;

    this.logger.log(
      `Subscribe request from client ${client.id} (user: ${userId}) for job ${jobId}`,
    );

    if (!jobId) {
      client.emit("error", { message: "jobId is required" });
      return;
    }

    if (!userId) {
      this.logger.warn(
        `Subscribe rejected: Client ${client.id} not authenticated`,
      );
      client.emit("error", { message: "Authentication required" });
      return;
    }

    // Get job and verify ownership
    try {
      const job = await this.syncQueue.getJob(jobId);

      if (!job) {
        this.logger.warn(`Subscribe rejected: Job ${jobId} not found`);
        client.emit("error", { message: "Job not found" });
        return;
      }

      // Verify job ownership
      if (job.data.userId !== userId) {
        this.logger.warn(
          `Subscribe rejected: User ${userId} does not own job ${jobId} (owned by ${job.data.userId})`,
        );
        client.emit("error", {
          message: "Unauthorized: You do not own this job",
        });
        return;
      }

      // Authorization passed - add client to room
      client.join(`sync-${jobId}`);

      // Track connection
      if (!this.activeConnections.has(jobId)) {
        this.activeConnections.set(jobId, new Set());
      }
      this.activeConnections.get(jobId)?.add(client.id);

      this.logger.log(
        `Client ${client.id} (user: ${userId}) subscribed to job ${jobId}, room: sync-${jobId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error during subscribe for job ${jobId}: ${error.message}`,
      );
      client.emit("error", { message: "Failed to subscribe to job" });
      return;
    }

    // Send current job status immediately
    try {
      const job = await this.syncQueue.getJob(jobId);

      if (!job) {
        client.emit("error", { message: "Job not found" });
        return;
      }

      const state = await job.getState();
      const progress = job.progress as JobProgressData;

      client.emit("status", {
        error: state === "failed" ? job.failedReason : undefined,
        jobId: job.id,
        progress,
        result: state === "completed" ? job.returnvalue : undefined,
        state,
      });

      // If job is already in terminal state, unsubscribe
      if (state === "completed" || state === "failed") {
        this.logger.log(
          `Job ${jobId} already in terminal state: ${state}, unsubscribing client`,
        );
        client.leave(`sync-${jobId}`);
        this.activeConnections.get(jobId)?.delete(client.id);
      }
    } catch (error) {
      this.logger.error(`Error fetching job ${jobId}`, error);
      client.emit("error", { message: "Failed to fetch job status" });
    }
  }

  @SubscribeMessage("unsubscribe")
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    const { jobId } = data;

    if (!jobId) {
      return;
    }

    client.leave(`sync-${jobId}`);
    this.activeConnections.get(jobId)?.delete(client.id);

    if (this.activeConnections.get(jobId)?.size === 0) {
      this.activeConnections.delete(jobId);
    }

    this.logger.log(`Client ${client.id} unsubscribed from job ${jobId}`);
  }

  async onModuleDestroy() {
    // Clean up QueueEvents connection
    await this.queueEvents.close();
    this.logger.log("QueueEvents closed");
  }

  async onModuleInit() {
    // Initialize QueueEvents to listen for job events
    this.queueEvents = new QueueEvents("sync", {
      connection: this.syncQueue.opts.connection,
    });

    // Listen to BullMQ events (no polling!)
    this.queueEvents.on("progress", this.handleProgress.bind(this));
    this.queueEvents.on("completed", this.handleCompleted.bind(this));
    this.queueEvents.on("failed", this.handleFailed.bind(this));

    this.logger.log("QueueEvents initialized for sync progress");
  }

  private async handleCompleted({
    jobId,
    returnvalue,
  }: {
    jobId: string;
    returnvalue: unknown;
  }) {
    this.logger.log(`Job ${jobId} completed`);

    // Only emit if server is available (not in worker process)
    if (!this.server) {
      return;
    }

    // Push completion to all clients
    this.server
      .to(`sync-${jobId}`)
      .emit("completed", { jobId, result: returnvalue, state: "completed" });

    // Clean up connections for this job
    this.activeConnections.delete(jobId);
  }

  private async handleFailed({
    failedReason,
    jobId,
  }: {
    failedReason: string;
    jobId: string;
  }) {
    this.logger.error(`Job ${jobId} failed: ${failedReason}`);

    // Only emit if server is available (not in worker process)
    if (!this.server) {
      return;
    }

    // Push failure to all clients
    this.server
      .to(`sync-${jobId}`)
      .emit("failed", { error: failedReason, jobId, state: "failed" });

    // Clean up connections for this job
    this.activeConnections.delete(jobId);
  }

  private async handleProgress({
    data,
    jobId,
  }: {
    data: JobProgressData;
    jobId: string;
  }) {
    this.logger.log(`Progress update for job ${jobId}:`, JSON.stringify(data));

    // Only emit if server is available (not in worker process)
    if (!this.server) {
      this.logger.warn("Server not available (worker process)");
      return;
    }

    const payload = { jobId, progress: data, state: "active" };

    this.logger.log(
      `Emitting progress to room sync-${jobId}:`,
      JSON.stringify(payload),
    );

    // Push to all clients subscribed to this job
    this.server.to(`sync-${jobId}`).emit("progress", payload);
  }
}
