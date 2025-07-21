---
title: "Analyze Requirements"
description: "Start workflow by analyzing requirements, understanding the codebase, and planning test strategy"
---

# 🔍 ANALYSIS PHASE: Test-Driven Requirements Analysis

**Current Phase**: Analysis
**Next Phase**: Planning
**TDD Focus**: Test-first thinking from the beginning

## Instructions

I'm now in ANALYSIS mode with TDD at the center. My task is to:

1. **Understand the user's request** - What exactly needs to be done?
2. **Analyze the codebase** - What's the current state and relevant files?
3. **Identify dependencies** - What systems, files, or components are involved?
4. **Assess complexity** - Is this a simple task or complex multi-step process?
5. **Plan test strategy** - How will this be tested? What behaviors need verification?
6. **Identify testable units** - What components can be tested in isolation?
7. **Consider test structure** - What test patterns and tools are needed?

## Analysis Checklist

### Requirements Analysis
- [ ] **Requirements clarity** - Do I understand what needs to be done?
- [ ] **Scope definition** - Is the scope clear and bounded?
- [ ] **Acceptance criteria** - What constitutes successful completion?
- [ ] **User scenarios** - How will users interact with this feature?

### Codebase Analysis
- [ ] **Codebase understanding** - Have I identified relevant files and patterns?
- [ ] **Dependencies identified** - Do I know what systems are involved?
- [ ] **Complexity assessment** - Is this simple or complex?
- [ ] **Existing tests** - What tests already exist in related areas?

### Test Strategy Analysis
- [ ] **Testable behaviors** - What specific behaviors need verification?
- [ ] **Test boundaries** - What are the units of testing?
- [ ] **Test dependencies** - What mocking or stubbing is needed?
- [ ] **Test structure** - What test patterns fit this feature?
- [ ] **Coverage expectations** - What level of coverage is needed?
- [ ] **Test tools** - What testing frameworks and utilities are available?

## Test-Driven Analysis Process

### 1. Requirements & Behavior Analysis
- Identify user stories and acceptance criteria
- Define expected behaviors and outcomes
- Identify edge cases and error scenarios
- Determine success metrics and validation criteria

### 2. Testability Assessment
- Evaluate code structure for testability
- Identify components that can be tested in isolation
- Plan dependency injection and mocking strategies
- Consider test data requirements and setup

### 3. Test Strategy Planning
- Choose appropriate testing levels (unit, integration, e2e)
- Plan test structure and organization
- Identify test utilities and helpers needed
- Consider test performance and maintainability

## What I Will Do

1. Use search tools (Grep, Glob, Task) to understand the codebase
2. Read relevant files to understand current implementation
3. Analyze existing test patterns and frameworks
4. Identify testable behaviors and boundaries
5. Plan test strategy and approach
6. Ask clarifying questions if requirements are unclear
7. Identify potential challenges or dependencies
8. Assess testability of proposed changes

## What I Won't Do

- Make any code changes
- Write any tests yet
- Create execution plans yet
- Start implementation
- Make assumptions about unclear requirements
- Skip test strategy planning

## Analysis Report Format

```
🔍 ANALYSIS COMPLETE

Requirements:
✅ User request understood: [description]
✅ Acceptance criteria defined: [criteria]
✅ Scope boundaries identified: [scope]

Codebase:
✅ Relevant files identified: [N] files
✅ Dependencies mapped: [list]
✅ Complexity assessed: [simple/medium/complex]
✅ Existing tests analyzed: [current test coverage]

Test Strategy:
✅ Testable behaviors identified: [list key behaviors]
✅ Test boundaries defined: [unit boundaries]
✅ Test dependencies planned: [mocking strategy]
✅ Test structure designed: [test organization]
✅ Coverage expectations: [target coverage]

Next: Use `/plan` to create detailed TDD execution plan
```

## Success Criteria

- Requirements clearly understood and documented
- Codebase structure and dependencies identified
- Test strategy planned and documented
- Testable behaviors and boundaries defined
- Ready to proceed with detailed TDD planning

## Next Steps

Once analysis is complete, use `/plan` to create a detailed test-driven execution plan.

!echo "📋 Workflow State: ANALYSIS phase activated - TDD-focused analysis"