---
name: "Refactor"
description: "Improve code quality while maintaining functionality"
---

# 🔨 REFACTOR: Code Quality Improvement

**Purpose**: Improve code quality while maintaining all functionality
**Previous**: `implement.md`
**Next**: `cq-fix.md`

## Instructions

I'm refactoring code to improve quality. My task is to:

1. **Verify code works** - Ensure current functionality
2. **Identify improvements** - Find code to refactor
3. **Refactor carefully** - Improve while maintaining functionality
4. **Verify nothing breaks** - Check that everything still works
5. **Commit refactoring** - Save improvements

## Refactoring Targets

### Code Smells to Fix

#### Duplication
```typescript
// Before: Duplicated logic
if (user.role === 'ADMIN') {
  // admin logic
}
// ... elsewhere ...
if (user.role === 'ADMIN') {
  // same admin logic
}

// After: Extracted method
private isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}
```

#### Long Methods
```typescript
// Before: Long method doing too much
async processRequest(data: Data) {
  // validation logic (10 lines)
  // transformation logic (15 lines)
  // persistence logic (10 lines)
  // notification logic (8 lines)
}

// After: Extracted focused methods
async processRequest(data: Data) {
  const validated = await this.validate(data);
  const transformed = this.transform(validated);
  const saved = await this.persist(transformed);
  await this.notify(saved);
  return saved;
}
```

#### Complex Conditionals
```typescript
// Before: Complex condition
if (user && user.isActive && user.subscription && user.subscription.status === 'active' && !user.subscription.expired) {
  // logic
}

// After: Extracted with meaningful name
private hasActiveSubscription(user: User): boolean {
  return user?.isActive && 
         user.subscription?.status === 'active' && 
         !user.subscription?.expired;
}
```

### Patterns to Apply

#### Extract Constants
```typescript
// Before: Magic numbers/strings
if (items.length > 100) { }
return status === 'pending';

// After: Named constants
const MAX_ITEMS = 100;
const PENDING_STATUS = 'pending';

if (items.length > MAX_ITEMS) { }
return status === PENDING_STATUS;
```

#### Extract Types
```typescript
// Before: Inline type definitions
function process(data: { id: string; name: string; items: Array<{ id: string; value: number }> }) { }

// After: Named types
interface ProcessData {
  id: string;
  name: string;
  items: ProcessItem[];
}

interface ProcessItem {
  id: string;
  value: number;
}

function process(data: ProcessData) { }
```

#### Consolidate Imports
```typescript
// Before: Multiple imports from same module
import { ServiceA } from './services';
import { ServiceB } from './services';
import { ServiceC } from './services';

// After: Single import
import { ServiceA, ServiceB, ServiceC } from './services';
```

### Performance Improvements

#### Optimize Database Queries
```typescript
// Before: N+1 query problem
const users = await this.user.findMany();
for (const user of users) {
  user.posts = await this.post.findMany({ where: { userId: user.id } });
}

// After: Single query with include
const users = await this.user.findMany({
  include: { posts: true }
});
```

#### Memoization
```typescript
// Before: Repeated calculations
function getExpensiveValue(input: string) {
  return performExpensiveCalculation(input);
}

// After: Cached results
const cache = new Map<string, Result>();

function getExpensiveValue(input: string) {
  if (!cache.has(input)) {
    cache.set(input, performExpensiveCalculation(input));
  }
  return cache.get(input);
}
```

## Verification During Refactor

```bash
# From monorepo root
cd .

# Verify TypeScript compilation
npm run typecheck

# Or check specific workspaces
npm run typecheck -w backend
npm run typecheck -w frontend

# Run the application
npm run dev

# Check for linting issues
npm run lint

# Format code
npm run prettier:fix
```

## Refactoring Principles

### DO:
- Maintain functionality
- Improve readability
- Reduce complexity
- Extract reusable code
- Follow SOLID principles
- Add helpful comments

### DON'T:
- Change behavior
- Add new features
- Break existing code
- Over-abstract
- Refactor everything at once

## Common Refactorings

1. **Extract Method** - Pull out code into focused functions
2. **Extract Variable** - Name complex expressions
3. **Inline Variable** - Remove unnecessary variables
4. **Extract Type** - Create interfaces for complex types
5. **Rename** - Use more descriptive names
6. **Move** - Organize code in proper modules
7. **Simplify** - Reduce conditional complexity

## Commit Message

```bash
git add .
git commit -m "refactor: improve [area] code quality

- Extract [methods/types/constants]
- Simplify [complex logic]
- Optimize [performance area]
- Improve [readability/maintainability]"
```

## Success Criteria

- Code still works correctly ✅
- Code is more readable
- Reduced duplication
- Better organization
- Following patterns consistently

## Output Format

```
🔨 REFACTORING COMPLETE

Improvements made:
- [Refactoring 1]
- [Refactoring 2]
- [Refactoring 3]

Code quality improvements:
- Readability: Improved
- Complexity: Reduced
- Duplication: Eliminated

Status: Still working ✅

Refactoring committed ✅
Ready for final checks with: cq-fix.md
```

## What I Will Do

1. Identify code smells
2. Apply refactoring patterns
3. Verify functionality preserved
4. Improve code organization
5. Commit improvements

## What I Won't Do

- Change functionality
- Add new features
- Break existing code
- Over-complicate
- Refactor without purpose

## Next Phase

After refactoring, use `cq-fix.md` to run final code quality checks.