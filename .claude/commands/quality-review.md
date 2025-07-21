---
title: "Quality Review"
description: "Comprehensive quality verification with TDD practices and coverage analysis"
---

# 🔍 QUALITY REVIEW: TDD-Focused Quality Assurance

**Current Phase**: Quality Assurance
**Previous Phase**: Implementation
**Next Phase**: Documentation
**TDD Focus**: Verify test-driven development practices and coverage

## Instructions

I'm now in QUALITY REVIEW mode with TDD verification at the center. This is MANDATORY after implementation. I must:

1. **Verify TDD practices** - Ensure test-first approach was followed
2. **Run comprehensive tests** - Execute all test suites
3. **Analyze test coverage** - Check coverage metrics and quality
4. **Run TypeScript compilation** - Verify no type errors
5. **Run ESLint** - Check for linting errors and warnings
6. **Run Prettier** - Verify code formatting
7. **Review all changes** - Comprehensive change examination
8. **Check git status** - Identify ALL modified files (including side effects)
9. **Verify TDD cycle compliance** - Ensure Red-Green-Refactor was followed
10. **Fix any issues** - All quality checks must pass

## TDD Verification Commands

Run these commands to verify TDD practices:

```bash
# TDD Coverage Analysis
npm run test:cov          # Comprehensive test coverage
npm run test:cov:report   # HTML coverage report

# Test Execution
npm run test              # All unit tests
npm run test:watch        # Watch mode for development
npm run test:e2e          # End-to-end tests (if applicable)
```

## Quality Commands

Run these commands in parallel for efficiency:

```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint check
npm run prettier:check # Prettier formatting
git status --porcelain # All modified files
git diff --name-only   # Scope of changes
```

## TDD Quality Review Checklist

### TDD Practice Verification
- [ ] **Test-first approach**: ✅ All production code has corresponding tests
- [ ] **Red-Green-Refactor**: ✅ TDD cycle properly followed
- [ ] **Test coverage**: ✅ Minimum 90% coverage achieved
- [ ] **Test quality**: ✅ Tests verify behavior, not just coverage
- [ ] **Failing tests first**: ✅ Tests were written before implementation
- [ ] **Minimal implementation**: ✅ No over-engineering detected
- [ ] **Refactoring performed**: ✅ Code quality improved after GREEN phase

### Test Coverage Analysis
- [ ] **Line coverage**: ✅ 90%+ lines covered
- [ ] **Branch coverage**: ✅ 85%+ branches covered
- [ ] **Function coverage**: ✅ 95%+ functions covered
- [ ] **Critical paths**: ✅ All important code paths tested
- [ ] **Edge cases**: ✅ Boundary conditions tested
- [ ] **Error handling**: ✅ Error scenarios tested

### Code Quality Verification
- [ ] **TypeScript compilation**: ✅ No errors
- [ ] **ESLint**: ✅ No errors or warnings
- [ ] **Prettier**: ✅ Formatting correct
- [ ] **Tests executed**: ✅ All tests pass
- [ ] **All files reviewed**: ✅ Every modification examined
- [ ] **Requirements satisfied**: ✅ Original request fully addressed
- [ ] **Code quality maintained**: ✅ Follows project conventions
- [ ] **Git status**: ✅ All modified files identified
- [ ] **Side effects**: ✅ Generated files, build artifacts checked
- [ ] **Issues resolved**: ✅ All quality problems fixed

## Success Report Format

```
✅ TDD QUALITY REVIEW COMPLETE

TDD Practice Verification:
✅ Test-first approach: All production code has corresponding tests
✅ Red-Green-Refactor: TDD cycle properly followed
✅ Test quality: Tests verify behavior, not just coverage
✅ Failing tests first: Tests written before implementation
✅ Minimal implementation: No over-engineering detected
✅ Refactoring performed: Code quality improved after GREEN phase

Test Coverage Analysis:
✅ Line coverage: [X]% (target: 90%+)
✅ Branch coverage: [X]% (target: 85%+)
✅ Function coverage: [X]% (target: 95%+)
✅ Critical paths: All important code paths tested
✅ Edge cases: Boundary conditions tested
✅ Error handling: Error scenarios tested

Code Quality:
✅ TypeScript compilation: No errors (npm run typecheck)
✅ ESLint: No errors or warnings (npm run lint)
✅ Prettier: Formatting applied (npm run prettier:check)

Testing Results:
✅ Unit Tests: [X] passed, [Y] total
✅ Integration Tests: [X] passed, [Y] total (if applicable)
✅ E2E Tests: [X] passed, [Y] total (if applicable)
✅ Test Coverage: [X]% overall coverage

Change Review:
✅ Requirements Status: All requirements fully implemented
✅ Code Quality: Follows project conventions
✅ Security: No security issues identified
✅ Performance: Impact acceptable
✅ TDD Compliance: Test-driven development properly followed

Files Modified: [N] ([X] test files, [Y] implementation files)
✅ Git status: [N] modified files identified
  - [file1] - [test file description]
  - [file2] - [implementation file description]
  - [file3] - [auto-generated/side effect]

Overall Assessment: ✅ APPROVED FOR DOCUMENTATION
TDD Assessment: ✅ EXCELLENT TDD PRACTICES FOLLOWED
```

## Failure Response Format

```
❌ TDD QUALITY REVIEW FAILED

TDD Practice Issues:
❌ Test-first approach: [X] files with production code before tests
❌ Test coverage: [X]% coverage (below 90% target)
❌ Test quality: [Y] tests only check coverage, not behavior
❌ TDD cycle: Evidence of code-first development detected

Code Quality Issues:
❌ TypeScript: [X] errors found
❌ ESLint: [Y] errors, [Z] warnings
✅ Prettier: Formatting OK

Testing Issues:
❌ Unit Tests: [X] failed, [Y] total
❌ Coverage: [X]% (below minimum thresholds)
❌ Critical paths: [Z] important paths not tested

Change Review Issues:
❌ TDD Compliance: Red-Green-Refactor cycle not followed
❌ Test Quality: Tests don't verify actual behavior

✅ Git status: [N] files identified

Fixing TDD and quality issues before proceeding...
```

## TDD Verification Process

### 1. Test-First Verification
- Check git history for test commits before implementation
- Verify test files exist for all production code
- Ensure tests fail before implementation

### 2. Coverage Analysis
- Run comprehensive coverage analysis
- Check line, branch, and function coverage
- Verify coverage quality vs. quantity

### 3. TDD Cycle Compliance
- Verify Red-Green-Refactor pattern was followed
- Check for minimal implementations
- Ensure refactoring was performed

## What I Will Do

1. Verify TDD practices were followed throughout implementation
2. Run comprehensive test coverage analysis
3. Check that tests were written before production code
4. Verify Red-Green-Refactor cycle compliance
5. Run all quality checks in parallel
6. Execute all relevant tests
7. Review every modified file thoroughly
8. Verify requirements are fully met
9. Check for code quality and conventions
10. Identify ALL modified files (including side effects)
11. Fix any TDD or quality issues immediately
12. Provide comprehensive TDD quality review report
13. Only proceed when all checks pass

## What I Won't Do

- Skip TDD practice verification
- Ignore test coverage requirements
- Proceed with insufficient test coverage
- Skip quality verification
- Ignore warnings or errors
- Proceed with failing checks or tests
- Skip reviewing any changes
- Miss generated or side-effect files
- Approve changes with problems
- Make assumptions about TDD compliance

## TDD Success Criteria

- All production code has corresponding tests
- Tests were written before implementation
- Red-Green-Refactor cycle was followed
- Test coverage meets minimum thresholds (90%+)
- Tests verify behavior, not just coverage
- Code quality standards are met
- All tests pass

## Available Commands for TDD Verification

- **`/test-coverage`** - Comprehensive coverage analysis
- **`/tdd-cycle`** - Verify TDD cycle compliance
- **Standard quality commands** - TypeScript, ESLint, Prettier

## Next Steps

When all TDD practices are verified and quality checks pass, use `/doc-update` to update documentation with TDD insights.

!echo "📋 Workflow State: TDD QUALITY REVIEW phase activated"