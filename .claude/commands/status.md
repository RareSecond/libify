---
title: "Workflow Status"
description: "Show current workflow phase, task progress, and available actions"
---

# 📍 WORKFLOW STATUS: Current Phase & Task Progress

**Purpose**: Display current workflow phase, task progress, and available actions

## Instructions

I'm showing the current workflow status. This command displays:

1. **Current phase** - Which phase of the workflow I'm in
2. **Current task** - What specific task I'm working on from TodoWrite
3. **Progress summary** - Overall workflow progress and task completion
4. **Available actions** - What commands are appropriate now
5. **Next steps** - What should happen next

## Status Display Format

```
📍 CURRENT WORKFLOW STATUS

Phase: [Current Phase]
Current Task: [Description of current task]
Task Status: [pending/in_progress/completed]

Progress Overview:
✅ Completed: [X] tasks
🔄 In Progress: [Y] tasks  
⏳ Pending: [Z] tasks

Recent Completions:
- [Task 1]
- [Task 2]

Workflow Phases:
- Analysis: ✅ Complete / 🔄 In Progress / ⏳ Pending
- Implementation: ✅ Complete / 🔄 In Progress / ⏳ Pending
- Quality Assurance: ✅ Complete / 🔄 In Progress / ⏳ Pending
- Documentation: ✅ Complete / 🔄 In Progress / ⏳ Pending

Available Commands:
- /[appropriate-command] - [Description]
- /[appropriate-command] - [Description]

Next Steps:
- [What should happen next]

Blockers/Issues:
- [Any problems or dependencies]
```

## Workflow Phases

1. **Analysis**: Understanding requirements and codebase
2. **Implementation**: Executing approved tasks
3. **Quality Assurance**: Code quality verification and testing
4. **Documentation**: Documentation updates and commit preparation

## Phase-Specific Available Commands

**Analysis Phase**:
- `/analyze` - Start analysis
- `/plan` - Create execution plan
- `/scope` - Verify scope and get approval

**Implementation Phase**:
- `/implement` - Execute tasks
- `/checkin` - Pause for developer review
- `/task-next` - Move to next task

**Quality Assurance Phase**:
- `/quality-review` - Run comprehensive quality verification, testing, and change review

**Documentation Phase**:
- `/doc-update` - Update documentation
- `/commit-prep` - Prepare commit message

**Utility Commands** (Available in any phase):
- `/reset-workflow` - Reset to analysis phase
- `/help-workflow` - Show workflow guide

## Status Checklist

- [ ] **Current phase identified** - Know which workflow phase I'm in
- [ ] **Current task identified** - Know what I'm working on
- [ ] **Progress quantified** - Clear count of completed/pending tasks
- [ ] **Blockers identified** - Any issues highlighted
- [ ] **Available commands listed** - Show appropriate next commands
- [ ] **Next actions clear** - What should happen next

## What I Will Do

1. Check current workflow state
2. Review TodoWrite for current task status
3. Identify current phase and task
4. Show progress across all phases and tasks
5. List appropriate available commands
6. Highlight any blockers or issues
7. Suggest next steps

## What I Won't Do

- Change workflow state or task status
- Make assumptions about progress
- Skip showing any relevant information
- Provide incorrect phase information
- Change task status without completing work
- Proceed without clearing blockers

## Next Steps

Use the suggested commands based on current phase and task status.

!echo "📋 Workflow State: STATUS DISPLAY - Current phase and task information"