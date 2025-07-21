---
title: "TDD Cycle"
description: "Complete Red-Green-Refactor cycle for Test Driven Development"
---

# 🔄 TDD CYCLE: Red-Green-Refactor

**Current Phase**: Implementation (TDD)
**Purpose**: Execute one complete Test Driven Development cycle

## Instructions

I'm executing a complete TDD cycle. This is the CORE of test-driven development. I must:

1. **RED** - Write a failing test first
2. **GREEN** - Write minimal code to make the test pass
3. **REFACTOR** - Improve code while keeping tests passing
4. **VERIFY** - Ensure all tests still pass after refactor

## TDD Cycle Process

### 🔴 RED Phase
1. **Write failing test** - Test should fail for the right reason
2. **Run test** - Confirm it fails as expected
3. **Commit failing test** - Version control the test

### 🟢 GREEN Phase
1. **Write minimal code** - Just enough to make test pass
2. **Run test** - Confirm it passes
3. **Run all tests** - Ensure no regressions
4. **Commit working code** - Version control the implementation

### 🔵 REFACTOR Phase
1. **Improve code quality** - Clean up, optimize, remove duplication
2. **Run all tests** - Ensure tests still pass
3. **Commit refactored code** - Version control the improvements

## TDD Cycle Commands

```bash
# RED Phase
npm run test -- --testNamePattern="<specific-test>" # Run specific failing test
npm run test:watch # Watch mode for continuous feedback

# GREEN Phase  
npm run test -- --testNamePattern="<specific-test>" # Verify test passes
npm run test # Run all tests to check for regressions

# REFACTOR Phase
npm run test # Ensure all tests still pass
npm run test:cov # Check coverage after refactor
```

## TDD Cycle Checklist

- [ ] **RED**: ✅ Failing test written and verified
- [ ] **GREEN**: ✅ Minimal code written to pass test
- [ ] **REFACTOR**: ✅ Code improved while maintaining test success
- [ ] **VERIFY**: ✅ All tests pass after complete cycle
- [ ] **COMMIT**: ✅ Changes committed with proper TDD message

## Cycle Report Format

```
🔄 TDD CYCLE COMPLETE

🔴 RED Phase:
✅ Failing test written: [test description]
✅ Test fails for correct reason: [failure message]
✅ Committed failing test

🟢 GREEN Phase:
✅ Minimal implementation: [implementation description]
✅ Target test passes
✅ All tests pass: [X] passed, [Y] total
✅ Committed working code

🔵 REFACTOR Phase:
✅ Code improvements: [refactoring description]
✅ All tests still pass: [X] passed, [Y] total
✅ Committed refactored code

Test Coverage: [X]% (target: >90%)
Files Modified: [N] files
Cycle Duration: [X] minutes

Next: Continue with `/tdd-cycle` or `/task-next`
```

## TDD Principles Enforced

1. **Test First** - No production code without failing test
2. **Minimal Implementation** - Write just enough code to pass
3. **Continuous Refactoring** - Always improve code quality
4. **All Tests Pass** - Never break existing functionality
5. **Fast Feedback** - Quick cycles for rapid iteration

## What I Will Do

1. Write a failing test that describes desired behavior
2. Run test to confirm it fails for right reason
3. Write minimal code to make test pass
4. Run all tests to ensure no regressions
5. Refactor code to improve quality
6. Verify all tests still pass
7. Commit each phase with descriptive messages
8. Report complete cycle status

## What I Won't Do

- Write production code before failing test
- Write more code than needed to pass test
- Skip refactoring phase
- Break existing tests
- Commit without running tests
- Rush through any phase

## Success Criteria

- Test fails initially for correct reason
- Minimal code makes test pass
- All tests pass after implementation
- Code is improved during refactor
- All tests still pass after refactor
- Proper commits for each phase

## Next Steps

Continue with next `/tdd-cycle` or use `/task-next` when feature complete.

!echo "📋 Workflow State: TDD CYCLE - Red-Green-Refactor in progress"