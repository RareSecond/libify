---
title: "Developer Check-in During Implementation"
description: "Pause implementation for developer review and approval"
---

# 🔄 IMPLEMENTATION CHECK-IN: Progress Review

**Current Phase**: Implementation (Check-in)
**Purpose**: Get developer approval to continue implementation

## Instructions

I'm pausing implementation for a check-in. I must:

1. **Summarize what I've done** - Show files changed and modifications made
2. **Report current progress** - What's working and what's left to do
3. **Identify any issues** - Problems encountered or decisions needed
4. **Wait for approval** - Get explicit permission to continue

## Check-in Rules

- **MANDATORY**: Pause after every 2-3 files changed
- **MANDATORY**: Show git diff of all changes made so far
- **MANDATORY**: Explain the reasoning behind changes
- **MANDATORY**: Wait for explicit "continue" approval
- **MANDATORY**: Report any blockers or concerns

## Check-in Report Format

### Files Changed
- List all files modified since last check-in
- Brief description of what was changed in each file

### Progress Summary
- What has been completed
- What is currently in progress
- What remains to be done

### Issues/Decisions
- Any problems encountered
- Design decisions made
- Questions that need developer input

### Next Steps
- What I plan to do next
- Estimated remaining work

## What I Will Do

1. Show comprehensive summary of changes made
2. Explain reasoning and approach taken
3. Highlight any concerns or decisions made
4. Wait for explicit approval to continue
5. Address any feedback before proceeding

## What I Won't Do

- Continue implementation without approval
- Hide problems or concerns
- Make major decisions without input
- Skip showing git diff of changes

## Developer Actions

The developer should:
- Review the changes made so far
- Provide feedback on approach
- Approve continuation or request modifications
- Answer any questions or provide guidance

## Continuation Commands

After check-in approval:
- Use `/implement` to continue with current task
- Use `/task-next` if current task is complete
- Use `/quality-check` if all implementation is done

!echo "🔄 Implementation paused for developer check-in"