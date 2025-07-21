---
title: "Refactor"
description: "Improve code quality while keeping tests passing (REFACTOR phase)"
---

# 🔵 REFACTOR: Improve Code Quality (REFACTOR Phase)

**Current Phase**: Implementation (TDD - REFACTOR)
**Purpose**: Improve code quality while maintaining all tests passing

## Instructions

I'm in the REFACTOR phase of TDD. I must improve code quality while keeping ALL tests passing. This means:

1. **Improve without breaking** - All tests must remain green
2. **Remove duplication** - Eliminate code duplication
3. **Enhance readability** - Make code more understandable
4. **Optimize structure** - Improve code organization and design
5. **Maintain behavior** - External behavior must remain unchanged

## Refactor Process

### 1. Analyze Current Code
- [ ] **Code smells** - Identify areas needing improvement
- [ ] **Duplication** - Find repeated code patterns
- [ ] **Readability** - Assess code clarity and understanding
- [ ] **Structure** - Evaluate code organization
- [ ] **Performance** - Consider optimization opportunities

### 2. Plan Refactoring
- [ ] **Small steps** - Plan incremental changes
- [ ] **Test safety** - Ensure each step maintains test success
- [ ] **Priority order** - Address most important issues first
- [ ] **Risk assessment** - Identify potential breaking changes

### 3. Execute Refactoring
- [ ] **One change at a time** - Make small, focused changes
- [ ] **Test after each change** - Verify tests still pass
- [ ] **Commit frequently** - Version control each improvement
- [ ] **Rollback if needed** - Revert if tests break

## Refactoring Commands

```bash
# Run tests continuously during refactoring
npm run test:watch

# Run all tests after each refactoring step
npm run test

# Type checking to catch issues early
npm run typecheck

# Linting to maintain code quality
npm run lint
```

## Refactor Checklist

- [ ] **Code smells identified** - Areas for improvement noted
- [ ] **Refactoring plan** - Step-by-step improvement strategy
- [ ] **Tests passing** - All tests green before starting
- [ ] **Incremental changes** - Small, focused improvements
- [ ] **Tests still passing** - All tests green after each step
- [ ] **Code improved** - Measurable quality improvements
- [ ] **Changes committed** - Each improvement committed

## Refactor Report Format

```
🔵 REFACTOR COMPLETE

Refactoring Summary:
✅ Code smells addressed: [number] issues
✅ Duplication removed: [description]
✅ Readability improved: [description]
✅ Structure enhanced: [description]

Changes Made:
- [Change 1] - [description and reason]
- [Change 2] - [description and reason]
- [Change 3] - [description and reason]

Quality Metrics:
✅ All tests pass: [X] passed, [Y] total
✅ No regressions: All existing functionality preserved
✅ Code coverage: [X]% (maintained/improved)
✅ Linting: No new issues introduced

Files Modified:
- [file1] - [type of refactoring]
- [file2] - [type of refactoring]

All refactoring steps committed to version control

Next: Continue with `/tdd-cycle` or `/task-next`
```

## Common Refactoring Patterns

### 1. **Extract Method**
```javascript
// Before - long method
function processOrder(order) {
  // validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  
  // calculate total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  
  // apply discount
  if (order.customerType === 'premium') {
    total *= 0.9;
  }
  
  return total;
}

// After - extracted methods
function processOrder(order) {
  validateOrder(order);
  const total = calculateTotal(order.items);
  return applyDiscount(total, order.customerType);
}

function validateOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
}

function calculateTotal(items) {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function applyDiscount(total, customerType) {
  return customerType === 'premium' ? total * 0.9 : total;
}
```

### 2. **Remove Duplication**
```javascript
// Before - duplicated logic
function formatUserName(user) {
  return user.firstName + ' ' + user.lastName;
}

function formatCustomerName(customer) {
  return customer.firstName + ' ' + customer.lastName;
}

// After - shared utility
function formatFullName(person) {
  return person.firstName + ' ' + person.lastName;
}

function formatUserName(user) {
  return formatFullName(user);
}

function formatCustomerName(customer) {
  return formatFullName(customer);
}
```

### 3. **Improve Readability**
```javascript
// Before - unclear variable names
function calc(x, y, z) {
  return x * y * z;
}

// After - descriptive names
function calculateVolume(length, width, height) {
  return length * width * height;
}
```

## Refactoring Safety Rules

### 1. **Always Keep Tests Green**
- Run tests after every small change
- Never commit broken tests
- Rollback if tests break

### 2. **Small Steps**
- Make one change at a time
- Commit frequently
- Easy to rollback if needed

### 3. **Preserve Behavior**
- External behavior must remain the same
- Only internal structure changes
- Tests should not need modification

## What I Will Do

1. Analyze current code for improvement opportunities
2. Plan refactoring in small, safe steps
3. Execute refactoring incrementally
4. Run tests after each change
5. Commit each improvement separately
6. Ensure all tests remain green throughout
7. Document improvements made

## What I Won't Do

- Make large, risky changes
- Change external behavior
- Skip testing between changes
- Commit broken tests
- Optimize prematurely
- Add new features during refactoring

## Success Criteria

- All tests remain green throughout process
- Code quality is measurably improved
- No regressions introduced
- Changes are well-documented
- Each improvement is committed separately

## Next Steps

After refactoring is complete, continue with next `/tdd-cycle` or use `/task-next` if feature is complete.

!echo "📋 Workflow State: REFACTOR - REFACTOR phase complete"