---
name: "Create Issues"
description: "Create Notion epic and tasks from approved analysis plan"
---

# 📝 CREATE ISSUES: Notion Epic & Task Creation

**Purpose**: Create structured Notion epic and tasks after analysis approval
**Previous**: `analysis-expert.md`
**Next**: `read-issue.md` (to implement first task)

## Instructions

After the user approves the analysis plan, I'll create Notion items with:

1. **Parent epic** - Main feature tracking in Epics database
2. **Child tasks** - Individual implementable slices in Board database
3. **Clear structure** - Each task self-contained and linked to epic

## Notion Database IDs

**Epics Database**: `7091b5e5-b480-42af-84e2-95a214557d89` (data source ID)
**Board Database**: `285c75ff-810b-8082-b003-000b1bf6b491` (data source ID)

## Epic Creation Template

Use `mcp__notion__notion-create-pages` with:

```json
{
  "parent": {"type": "data_source_id", "data_source_id": "7091b5e5-b480-42af-84e2-95a214557d89"},
  "pages": [{
    "properties": {
      "Epic name": "[Feature]: User-facing feature name",
      "Description": "Brief one-line summary of the feature",
      "Status": "Planning",
      "Priority": "High|Medium|Low",
      "Owner": "[User ID if known]"
    },
    "content": "## User Story\nAs a [role], I want to [action] so that [benefit]\n\n## Context\n[Why this feature matters and background]\n\n## Success Criteria\n- [ ] All slices completed\n- [ ] Users can [main goal]\n- [ ] No regressions in existing functionality\n\n## Implementation Plan\n[Brief overview of the approach]"
  }]
}
```

## Task Creation Template

After creating the epic, use `mcp__notion__notion-create-pages` to create tasks:

```json
{
  "parent": {"type": "data_source_id", "data_source_id": "285c75ff-810b-8082-b003-000b1bf6b491"},
  "pages": [{
    "properties": {
      "Task name": "Slice 1: Specific user capability",
      "Epic": "[\"Epic page URL from step 1\"]",
      "Description": "Brief one-line description of what this task accomplishes",
      "Status": "Not started",
      "Effort level": "Small|Medium|Large",
      "Priority": "High|Medium|Low",
      "Task type": "[\"💬 Feature request\"]"
    },
    "content": "## User Value\nAfter this PR, users can:\n- [Primary capability]\n- [Secondary benefit]\n\n## Implementation Checklist\n\n### Backend Tasks\n- [ ] Add [specific endpoint/service]\n- [ ] Update [specific model/schema]\n- [ ] Add validation for [fields]\n\n### Frontend Tasks\n- [ ] Create [component name]\n- [ ] Add [user interaction]\n- [ ] Connect to [API endpoint]\n\n### Database (if needed)\n- [ ] Add migration for [change]\n- [ ] Update seed data\n\n## Files to Modify\n- `backend/src/[module]/[file].ts` - [what to add]\n- `frontend/src/[path]/[component].tsx` - [what to add]\n\n## Testing Instructions\n1. Start dev server: `npm run dev`\n2. Navigate to [page/route]\n3. [Action to perform]\n4. Expected: [result]\n\n## Definition of Done\n- [ ] Code implemented\n- [ ] Manually tested\n- [ ] No console errors\n- [ ] Works as described"
  }]
}
```

## Implementation Process

### Step 1: Create Parent Epic

```javascript
// Create epic with full context in page body
const epicResult = await mcp__notion__notion-create-pages({
  parent: {type: "data_source_id", data_source_id: "7091b5e5-b480-42af-84e2-95a214557d89"},
  pages: [{
    properties: {
      "Epic name": "[Feature]: Feature Name",
      "Description": "Brief summary",
      "Status": "Planning",
      "Priority": "High"
    },
    content: "## User Story\n...\n\n## Context\n...\n\n## Success Criteria\n..."
  }]
});

// Save epic URL for linking
const epicUrl = epicResult.pages[0].url;
const epicId = epicResult.pages[0].id;
```

### Step 2: Create Child Tasks

```javascript
// Create each slice as a task with content in page body
for (const slice of slices) {
  await mcp__notion__notion-create-pages({
    parent: {type: "data_source_id", data_source_id: "285c75ff-810b-8082-b003-000b1bf6b491"},
    pages: [{
      properties: {
        "Task name": slice.title,
        "Epic": `["${epicUrl}"]`, // Link to parent epic
        "Description": slice.summary, // One-line summary
        "Status": "Not started",
        "Effort level": slice.effort,
        "Priority": slice.priority,
        "Task type": "[\"💬 Feature request\"]"
      },
      content: slice.detailedContent // Full implementation details
    }]
  });
}
```

### Step 3: Automatic Linking

- Tasks automatically link to epic via Epic property
- Epic automatically shows tasks via backlink (Tasks property)
- No manual linking needed!

## Task Property Guidelines

### Status
- "Not started" - Default for new tasks
- "In progress" - When work begins
- "Done" - When complete

### Effort Level
- "Small" - 1 hour or less
- "Medium" - 1-2 hours
- "Large" - 2-3 hours (avoid if possible)

### Priority
- "High" - Critical path, blocks other work
- "Medium" - Important but not blocking
- "Low" - Nice to have

### Task Type
- `["💬 Feature request"]` - New functionality
- `["🐞 Bug"]` - Fix existing issue
- `["💅 Polish"]` - UI/UX improvements
- `["💬 Feature request", "🐞 Bug"]` - Multiple types

## Output Format

```
📝 NOTION EPIC & TASKS CREATED

Epic: EPIC-X - [Feature Name]
└── Task 1: DEV-X - [User capability] (~X hours)
└── Task 2: DEV-Y - [Enhanced capability] (~X hours)
└── Task 3: DEV-Z - [Complete feature] (~X hours)

Total Estimate: ~[Y] hours
First value delivered: ~[X] hours

View Epic: [Notion URL]
View Board: [Notion URL]

Ready to implement! Use read-issue.md with task DEV-X to start.
```

## What I Will Do

1. Create parent epic with full context in page body
2. Create child tasks linked to epic with detailed content
3. Set appropriate properties (status, effort, priority)
4. Use Description property for brief summaries only
5. Put detailed checklists and instructions in page content
6. Provide task order for implementation

## What I Won't Do

- Create tasks without approval
- Skip the analysis phase
- Create technical-only tasks
- Make tasks too large (>3 hours)
- Cram everything into Description property
- Forget user value in page content

## Success Criteria

- Epic created with clear goals ✅
- Each task is implementable ✅
- All tasks properly linked to epic ✅
- Clear estimates on each task ✅
- User value clearly stated ✅
