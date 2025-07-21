---
title: "Test Coverage"
description: "Analyze and report test coverage metrics"
---

# 📊 TEST COVERAGE: Coverage Analysis & Reporting

**Current Phase**: Quality Assurance (TDD)
**Purpose**: Analyze test coverage and ensure adequate testing

## Instructions

I'm analyzing test coverage to ensure the codebase is adequately tested. Coverage analysis includes:

1. **Quantitative metrics** - Line, branch, function, and statement coverage
2. **Qualitative assessment** - Meaningful tests vs. coverage theater
3. **Gap identification** - Areas lacking test coverage
4. **Improvement recommendations** - Specific actions to improve coverage

## Coverage Analysis Process

### 1. Generate Coverage Reports
- [ ] **Run coverage tools** - Generate comprehensive coverage data
- [ ] **Backend coverage** - API, services, business logic coverage
- [ ] **Frontend coverage** - Component, utility, integration coverage
- [ ] **Overall metrics** - Project-wide coverage statistics

### 2. Analyze Coverage Quality
- [ ] **Critical paths** - Ensure important code paths are tested
- [ ] **Edge cases** - Verify boundary conditions are covered
- [ ] **Error handling** - Check error scenarios are tested
- [ ] **Integration points** - Ensure component interactions are tested

### 3. Identify Gaps
- [ ] **Uncovered lines** - Code without any test coverage
- [ ] **Untested branches** - Conditional logic not exercised
- [ ] **Missing scenarios** - Important use cases not tested
- [ ] **Weak areas** - Low coverage in critical components

## Coverage Commands

```bash
# Backend coverage
npm run test:cov          # Unit test coverage
npm run test:e2e:cov      # E2E test coverage (if available)

# Frontend coverage
npm run test:cov          # Frontend test coverage

# Coverage reporting
npm run test:cov:report   # Generate HTML coverage report
npm run test:cov:lcov     # Generate LCOV format for CI
```

## Coverage Checklist

- [ ] **Coverage generated** - All coverage reports created
- [ ] **Metrics analyzed** - Coverage percentages reviewed
- [ ] **Quality assessed** - Meaningful tests vs. coverage theater
- [ ] **Gaps identified** - Areas needing more tests
- [ ] **Recommendations made** - Specific improvement actions
- [ ] **Thresholds checked** - Minimum coverage requirements met

## Coverage Report Format

```
📊 TEST COVERAGE ANALYSIS

Overall Coverage:
✅ Lines: [X]% ([Y]/[Z] lines covered)
✅ Branches: [X]% ([Y]/[Z] branches covered)
✅ Functions: [X]% ([Y]/[Z] functions covered)
✅ Statements: [X]% ([Y]/[Z] statements covered)

Backend Coverage:
✅ Controllers: [X]%
✅ Services: [X]%
✅ Utilities: [X]%
✅ DTOs: [X]%

Frontend Coverage:
✅ Components: [X]%
✅ Hooks: [X]%
✅ Utilities: [X]%
✅ Pages: [X]%

Coverage Quality Assessment:
✅ Critical paths covered: [X]/[Y] paths
✅ Edge cases tested: [X]/[Y] scenarios
✅ Error handling: [X]/[Y] error cases
✅ Integration points: [X]/[Y] interactions

Coverage Gaps:
❌ Uncovered files: [N] files
❌ Low coverage areas: [list critical areas below threshold]
❌ Missing tests: [list specific scenarios]

Recommendations:
- [Specific action 1]
- [Specific action 2]
- [Specific action 3]

Coverage Status: ✅ MEETS REQUIREMENTS / ❌ NEEDS IMPROVEMENT
```

## Coverage Thresholds

### Minimum Requirements
- **Overall Coverage**: 90%+
- **Critical Business Logic**: 95%+
- **Public APIs**: 100%
- **Error Handling**: 90%+
- **Integration Points**: 85%+

### Coverage Types
- **Line Coverage**: Percentage of executed lines
- **Branch Coverage**: Percentage of executed branches
- **Function Coverage**: Percentage of called functions
- **Statement Coverage**: Percentage of executed statements

## Coverage Quality Guidelines

### 1. **Meaningful Tests**
```javascript
// Good - tests actual behavior
test('should calculate total price with tax', () => {
  const order = { items: [{ price: 100, quantity: 2 }] };
  const result = calculateTotal(order, { taxRate: 0.1 });
  expect(result).toBe(220);
});

// Bad - only increases coverage without testing behavior
test('should call calculateTotal', () => {
  const order = { items: [] };
  calculateTotal(order, {});
  // No assertions - coverage theater
});
```

### 2. **Edge Case Testing**
```javascript
// Test boundary conditions
test('should handle empty cart', () => {
  const result = calculateTotal({ items: [] }, {});
  expect(result).toBe(0);
});

test('should handle maximum quantity', () => {
  const order = { items: [{ price: 1, quantity: Number.MAX_SAFE_INTEGER }] };
  expect(() => calculateTotal(order, {})).toThrow();
});
```

### 3. **Error Scenario Testing**
```javascript
// Test error conditions
test('should throw error for invalid tax rate', () => {
  const order = { items: [{ price: 100, quantity: 1 }] };
  expect(() => calculateTotal(order, { taxRate: -1 })).toThrow('Invalid tax rate');
});
```

## Coverage Improvement Strategies

### 1. **Identify Critical Gaps**
- Focus on business-critical code first
- Prioritize public APIs and interfaces
- Address error handling paths

### 2. **Write Targeted Tests**
- Create tests for specific uncovered lines
- Add tests for missing branches
- Test edge cases and error scenarios

### 3. **Refactor for Testability**
- Extract complex logic into pure functions
- Reduce dependencies and coupling
- Use dependency injection for better mocking

## What I Will Do

1. Generate comprehensive coverage reports
2. Analyze coverage metrics for all components
3. Assess coverage quality vs. quantity
4. Identify specific gaps and missing scenarios
5. Provide actionable recommendations
6. Check against minimum coverage thresholds
7. Generate detailed coverage analysis report

## What I Won't Do

- Focus only on coverage percentages
- Ignore coverage quality
- Skip critical gap analysis
- Make assumptions about test effectiveness
- Recommend coverage theater practices

## Success Criteria

- Coverage reports generated and analyzed
- Quality vs. quantity assessment completed
- Specific gaps identified
- Actionable recommendations provided
- Minimum thresholds verified

## Next Steps

Use coverage analysis to inform test writing priorities and ensure adequate test coverage before proceeding with development.

!echo "📋 Workflow State: TEST COVERAGE - Coverage analysis complete"