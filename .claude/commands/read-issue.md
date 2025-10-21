---
name: "Read Issue"
description: "Fetch Notion task and prepare context for implementation"
---

# 📖 READ ISSUE: Parse and Prepare

**Purpose**: Read Notion task, extract requirements, and set up TodoWrite list
**Next Command**: `implement.md`

## Instructions

I'm reading a Notion task to prepare for implementation. My task is to:

1. **Fetch the task** - Get all task details from Notion
2. **Parse structure** - Identify specific work items
3. **Create todo list** - Set up tracking for implementation
4. **Prepare context** - Summarize for next phase

## Workflow Process

### 1. Fetch Notion Task

```javascript
// Get task details by URL or ID
const task = await mcp__notion__notion-fetch({
  id: "task-url-or-id"
});

// Task contains:
// - Task name (title)
// - Description (implementation details)
// - Status, Priority, Effort level
// - Epic (parent epic link)
// - Task type
```

### 2. Parse Task Structure

Extract from the task:
- **Scope**: Overall work description from Description field
- **Specific Tasks**: Implementation items from checklist
- **Acceptance Criteria**: Definition of Done section
- **Technical Details**: Files to modify, approach
- **Epic Context**: Parent epic for broader context

### 3. Create Todo List

Use TodoWrite to create a structured task list from the Description field:

```
For each checklist item in the task description:
- [ ] Implement [feature/component]
- [ ] Handle [edge cases]
- [ ] Update [documentation] (if needed)
```

### 4. Fetch Parent Epic (Optional)

If task is linked to an epic, fetch epic for broader context:

```javascript
// Get epic details for context
const epic = await mcp__notion__notion-fetch({
  id: "epic-url-from-task"
});
```

## Task Description Format

Tasks created via `create-issues.md` follow this structure:

```markdown
## User Value
After this PR, users can:
- [Primary capability]
- [Secondary benefit]

## Implementation Checklist

### Backend Tasks
- [ ] Add [specific endpoint/service]
- [ ] Update [specific model/schema]

### Frontend Tasks
- [ ] Create [component name]
- [ ] Connect to [API endpoint]

### Database (if needed)
- [ ] Add migration for [change]

## Files to Modify
- `backend/src/[module]/[file].ts` - [what to add]
- `frontend/src/[path]/[component].tsx` - [what to add]

## Testing Instructions
1. [Step to test]
2. [Expected result]

## Definition of Done
- [ ] Code implemented
- [ ] Manually tested
- [ ] No console errors
```

### 5. Prepare Summary

Create a concise summary for the next phase:

```markdown
## Task DEV-X: [title]

### Tasks to Implement:
1. [Task 1 description]
2. [Task 2 description]

### Files to Modify:
- path/to/file1.ts
- path/to/file2.ts

### Key Requirements:
- [Critical requirement 1]
- [Critical requirement 2]

### Testing:
- [How to verify it works]
```

## Success Criteria

- Task fully understood
- All tasks extracted to TodoWrite
- Clear summary prepared
- Ready for implementation phase

## Output Format

```
📖 TASK ANALYSIS COMPLETE

Task: DEV-X - [title]
Epic: EPIC-Y - [epic name]
Tasks identified: [N] items
Todo list created: [N] items

Summary:
[Brief overview of what needs to be done]

Files to modify:
- [file paths]

Ready to implement with: implement.md
```

## Example Usage

```bash
# User provides task
/read-issue https://notion.so/task-url

# Or with task ID
/read-issue DEV-123
```

## What I Will Do

1. Fetch Notion task details
2. Parse Description field for checklist items
3. Extract files to modify
4. Create comprehensive todo list
5. Fetch epic context if available
6. Prepare implementation summary

## What I Won't Do

- Start implementation yet
- Skip any requirements
- Make assumptions without clarity
- Ignore epic context
- Modify task status

## Next Phase

After reading the task, use `implement.md` to begin implementation.
