---
title: "Make Green"
description: "Write minimal code to pass failing test (GREEN phase)"
---

# 🟢 MAKE GREEN: Minimal Implementation (GREEN Phase)

**Current Phase**: Implementation (TDD - GREEN)
**Purpose**: Write minimal code to make failing test pass

## Instructions

I'm in the GREEN phase of TDD. I must write the MINIMAL code needed to make the failing test pass. This means:

1. **Minimal implementation** - Just enough code to pass the test
2. **No premature optimization** - Focus on making test pass, not perfect code
3. **No extra features** - Only implement what the test requires
4. **Quick feedback** - Get to working state as fast as possible

## Make Green Process

### 1. Review Failing Test
- [ ] **Test requirements** - What behavior does test expect?
- [ ] **Failure message** - What specifically is missing?
- [ ] **Input/output** - What are the expected parameters and returns?
- [ ] **Edge cases** - Are there specific conditions to handle?

### 2. Write Minimal Code
- [ ] **Simplest solution** - Most straightforward implementation
- [ ] **Just enough** - Don't implement more than test requires
- [ ] **No abstractions** - Avoid premature abstractions
- [ ] **Hardcode if needed** - It's okay to hardcode initially

### 3. Verify Green State
- [ ] **Target test passes** - The failing test now passes
- [ ] **No regressions** - All existing tests still pass
- [ ] **Clean implementation** - Code compiles without errors
- [ ] **Commit working code** - Version control the implementation

## Implementation Commands

```bash
# Run specific test to verify it passes
npm run test -- --testNamePattern="<test-name>"

# Run all tests to check for regressions
npm run test

# Watch mode for continuous feedback
npm run test:watch

# Type checking (if applicable)
npm run typecheck
```

## Make Green Checklist

- [ ] **Failing test identified** - Clear understanding of what needs to pass
- [ ] **Minimal code written** - Simplest implementation that works
- [ ] **Target test passes** - Previously failing test now passes
- [ ] **No regressions** - All existing tests still pass
- [ ] **Code compiles** - No syntax or type errors
- [ ] **Implementation committed** - Working code committed to version control

## Green Report Format

```
🟢 MAKE GREEN COMPLETE

Implementation Details:
✅ Target test: [test name]
✅ Minimal code: [brief description of implementation]
✅ Approach: [implementation strategy]

Test Results:
✅ Target test passes: [test name]
✅ All tests pass: [X] passed, [Y] total
✅ No regressions detected
✅ Code compiles successfully

Files Modified:
- [file1] - [type of change]
- [file2] - [type of change]

Implementation committed to version control

Next: Use `/refactor` to improve code quality
```

## Minimal Implementation Principles

### 1. **Fake It Till You Make It**
```javascript
// If test expects specific return value, hardcode it first
function calculateTotal(items) {
  return 42; // Hardcoded to pass test, will refactor later
}
```

### 2. **Obvious Implementation**
```javascript
// If implementation is obvious, write it directly
function add(a, b) {
  return a + b; // Simple and obvious
}
```

### 3. **Triangulation**
```javascript
// When multiple tests exist, find the general solution
function multiply(a, b) {
  if (a === 0 || b === 0) return 0;
  return a * b; // General solution after multiple tests
}
```

## What I Will Do

1. Review the failing test to understand requirements
2. Write the simplest code that makes test pass
3. Avoid premature optimization or abstractions
4. Run target test to verify it passes
5. Run all tests to check for regressions
6. Commit working implementation with descriptive message
7. Provide detailed implementation report

## What I Won't Do

- Write more code than needed to pass test
- Add features not required by test
- Optimize prematurely
- Add complex abstractions
- Skip regression testing
- Commit without verifying all tests pass

## Success Criteria

- Previously failing test now passes
- All existing tests still pass
- Code is minimal and focused
- Implementation is committed to version control
- No regressions introduced

## Common Patterns

### Start Simple
```javascript
// First implementation - hardcoded
function isEven(n) {
  return true; // Makes first test pass
}

// After more tests - general solution
function isEven(n) {
  return n % 2 === 0;
}
```

### Handle Edge Cases Incrementally
```javascript
// Initial implementation
function divide(a, b) {
  return a / b;
}

// After error handling test
function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
```

## Next Steps

After test passes and implementation is committed, use `/refactor` to improve code quality while maintaining test success.

!echo "📋 Workflow State: MAKE GREEN - GREEN phase complete"