---
title: "Execute Implementation Tasks"
description: "Execute approved tasks using Test Driven Development cycles"
---

# 🚀 IMPLEMENTATION PHASE: TDD-Driven Task Execution

**Current Phase**: Implementation
**Previous Phase**: Scope Verification
**Next Phase**: Quality Assurance
**TDD Focus**: Red-Green-Refactor cycles for all implementation

## Instructions

I'm now in IMPLEMENTATION mode with TDD at the center. I must:

1. **Execute ONE task at a time** - Never work on multiple tasks simultaneously
2. **Follow TDD cycles** - Red-Green-Refactor for every implementation
3. **Test-first approach** - Write failing tests before any production code
4. **Update TodoWrite** - Mark tasks as in_progress and completed
5. **Stay focused** - No scope creep or additional features

## TDD Implementation Rules

- **MANDATORY**: Use TodoWrite to track task progress
- **MANDATORY**: Mark current task as "in_progress" before starting
- **MANDATORY**: Follow Red-Green-Refactor cycle for all code changes
- **MANDATORY**: Write failing test before any production code
- **MANDATORY**: Check in with developer after every 2-3 TDD cycles using `/checkin`
- **MANDATORY**: Complete current task fully before moving to next
- **MANDATORY**: Mark task as "completed" immediately after finishing
- **MANDATORY**: Wait for explicit permission before continuing to next task

## TDD Task Execution Flow

1. **Mark current task as "in_progress"** in TodoWrite
2. **Break task into TDD cycles** - Identify testable behaviors
3. **Execute TDD cycles** - Use `/tdd-cycle` for each behavior:
   - 🔴 RED: Write failing test (`/test-first`)
   - 🟢 GREEN: Minimal implementation (`/make-green`)
   - 🔵 REFACTOR: Improve code quality (`/refactor`)
4. **Check-in after 2-3 cycles** - Use `/checkin` to pause and get approval
5. **Verify task completion** - All behaviors tested and implemented
6. **Mark task as "completed"** in TodoWrite
7. **Use `/task-next`** to move to next task

## Implementation Strategies

### 1. Task Decomposition
Break each task into small, testable behaviors:
```
Task: "Add user authentication"
TDD Cycles:
- Cycle 1: User login with valid credentials
- Cycle 2: User login with invalid credentials
- Cycle 3: User logout functionality
- Cycle 4: Session management
```

### 2. TDD Cycle Selection
Choose appropriate TDD approach:
- **`/tdd-cycle`** - Complete Red-Green-Refactor cycle
- **`/test-first`** - Write failing test only
- **`/make-green`** - Implement minimal code
- **`/refactor`** - Improve code quality

### 3. Test-First Mindset
Always start with the test:
```
1. What behavior am I implementing?
2. How do I test this behavior?
3. What should the test expect?
4. Write the failing test
5. Make it pass with minimal code
6. Refactor for quality
```

## Implementation Checklist

### Task Management
- [ ] **Current task identified** - Know exactly what I'm working on
- [ ] **Task marked in_progress** - TodoWrite updated
- [ ] **Task broken into TDD cycles** - Testable behaviors identified

### TDD Cycle Execution
- [ ] **Failing test written** - Test-first approach followed
- [ ] **Minimal implementation** - Just enough code to pass test
- [ ] **Code refactored** - Quality improvements made
- [ ] **All tests passing** - No regressions introduced

### Progress Management
- [ ] **Regular check-ins** - Use `/checkin` after 2-3 TDD cycles
- [ ] **Task completed fully** - All behaviors tested and implemented
- [ ] **Task marked completed** - TodoWrite updated
- [ ] **Permission requested** - Wait for approval before next task

## TDD Implementation Report Format

```
🚀 TDD IMPLEMENTATION PROGRESS

Current Task: [task description]
TDD Cycles Completed: [X] of [Y]

Latest TDD Cycle:
🔴 RED: [failing test description]
🟢 GREEN: [minimal implementation]
🔵 REFACTOR: [code improvements]

Test Results:
✅ All tests passing: [X] passed, [Y] total
✅ Coverage maintained: [X]%
✅ No regressions: All existing tests pass

Files Modified:
- [file1] - [test file]
- [file2] - [implementation file]

Next: Continue with next TDD cycle or `/checkin`
```

## What I Will Do

1. Focus on one task at a time
2. Break task into small, testable behaviors
3. Execute TDD cycles for each behavior
4. Write failing tests before any production code
5. Implement minimal code to pass tests
6. Refactor for code quality
7. Update TodoWrite for each task transition
8. Check in with developer after every 2-3 TDD cycles
9. Complete tasks fully before moving on
10. Ask for permission before continuing

## What I Won't Do

- Work on multiple tasks simultaneously
- Write production code before failing tests
- Skip TDD cycles or phases
- Add features not in the approved plan
- Skip task completion verification
- Move to next task without permission
- Make assumptions about scope changes
- Rush through refactoring phase

## TDD Success Criteria

- All production code has corresponding tests
- Tests are written before implementation
- Code follows Red-Green-Refactor cycle
- All tests pass after each cycle
- Code quality is maintained through refactoring
- No regressions introduced

## Available TDD Commands

- **`/tdd-cycle`** - Complete Red-Green-Refactor cycle
- **`/test-first`** - Write failing test (RED phase)
- **`/make-green`** - Minimal implementation (GREEN phase)
- **`/refactor`** - Code quality improvements (REFACTOR phase)
- **`/test-coverage`** - Analyze test coverage
- **`/checkin`** - Progress review with developer
- **`/task-next`** - Move to next approved task

## Next Steps

After all tasks are complete, use `/quality-review` to verify TDD practices and code quality.

!echo "📋 Workflow State: IMPLEMENTATION phase activated - TDD-driven execution"