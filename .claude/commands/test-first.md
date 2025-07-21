---
title: "Test First"
description: "Write failing test before implementation (RED phase)"
---

# 🔴 TEST FIRST: Write Failing Test (RED Phase)

**Current Phase**: Implementation (TDD - RED)
**Purpose**: Write failing test before any implementation

## Instructions

I'm in the RED phase of TDD. I must write a failing test BEFORE any production code. This test will:

1. **Define behavior** - Clearly specify what the code should do
2. **Fail for right reason** - Fail because functionality doesn't exist yet
3. **Guide implementation** - Provide clear target for GREEN phase
4. **Document intent** - Serve as living documentation

## Test-First Process

### 1. Understand Requirements
- [ ] **Feature behavior** - What should the code do?
- [ ] **Input/output** - What are the expected inputs and outputs?
- [ ] **Edge cases** - What are the boundary conditions?
- [ ] **Error scenarios** - How should errors be handled?

### 2. Write Failing Test
- [ ] **Test name** - Clear, descriptive test name
- [ ] **Arrange** - Set up test data and dependencies
- [ ] **Act** - Call the code under test
- [ ] **Assert** - Verify expected behavior
- [ ] **Fail verification** - Run test to confirm it fails

### 3. Verify Test Quality
- [ ] **Fails for right reason** - Correct failure message
- [ ] **Single responsibility** - Test one behavior
- [ ] **Readable** - Clear intent and expectations
- [ ] **Maintainable** - Easy to update when behavior changes

## Test Commands

```bash
# Write and run specific test
npm run test -- --testNamePattern="<test-name>" # Run specific test
npm run test:watch # Watch mode for continuous feedback

# Backend tests
npm run test # Unit tests
npm run test:e2e # E2E tests (if applicable)

# Frontend tests (if applicable)
npm run test # Frontend test suite
```

## Test-First Checklist

- [ ] **Requirements understood** - Clear behavior specification
- [ ] **Test written** - Comprehensive test covering behavior
- [ ] **Test runs** - Test executes without syntax errors
- [ ] **Test fails** - Fails because functionality doesn't exist
- [ ] **Failure reason correct** - Fails for expected reason
- [ ] **Test committed** - Failing test committed to version control

## Test Report Format

```
🔴 TEST FIRST COMPLETE

Test Details:
✅ Test name: [descriptive test name]
✅ Feature: [feature being tested]
✅ Behavior: [expected behavior description]

Test Structure:
✅ Arrange: [test setup description]
✅ Act: [action being tested]
✅ Assert: [expected outcome]

Verification:
✅ Test runs without syntax errors
✅ Test fails for correct reason: [failure message]
✅ Failure indicates missing functionality
✅ Test committed to version control

Next: Use `/make-green` to implement minimal code
```

## Test Quality Guidelines

### Good Test Characteristics
- **Descriptive name** - Intent clear from name
- **Single behavior** - Tests one specific behavior
- **Independent** - Doesn't depend on other tests
- **Repeatable** - Same result every time
- **Fast** - Runs quickly for rapid feedback

### Test Structure (AAA Pattern)
```javascript
// Arrange - Set up test data
const input = createTestInput();
const expected = createExpectedOutput();

// Act - Execute the code under test
const result = functionUnderTest(input);

// Assert - Verify expected behavior
expect(result).toEqual(expected);
```

## What I Will Do

1. Analyze requirements for current feature
2. Identify specific behavior to test
3. Write comprehensive failing test
4. Run test to verify it fails correctly
5. Ensure test failure indicates missing functionality
6. Commit failing test with descriptive message
7. Provide detailed test report

## What I Won't Do

- Write any production code
- Write passing tests
- Skip test execution
- Write vague or unclear tests
- Test multiple behaviors in one test
- Commit without verifying test failure

## Success Criteria

- Test clearly describes expected behavior
- Test fails for the right reason
- Failure message indicates missing functionality
- Test is well-structured and maintainable
- Test is committed to version control

## Next Steps

After failing test is written and committed, use `/make-green` to implement minimal code to pass the test.

!echo "📋 Workflow State: TEST FIRST - RED phase complete"