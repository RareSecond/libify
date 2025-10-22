---
name: "Implement"
description: "Implement features based on requirements from GitHub issue"
---

# 🚀 IMPLEMENT: Feature Implementation

**Purpose**: Implement features directly based on requirements
**Previous**: `read-issue.md`
**Next**: `refactor.md` (optional)

## Instructions

I'm implementing features from the GitHub issue. My task is to:

1. **Review requirements** - From the issue summary
2. **Write implementation** - Complete, functional code
3. **Test manually** - Verify functionality works in browser
4. **Commit implementation** - Save the working code

⚠️ **IMPORTANT**: Do NOT run typechecks, linting, or code quality tools during implementation. Those are handled separately in `cq-fix.md`.

## Implementation Strategy

### Complete Code Principle
Write fully functional code that meets requirements:
- Implement all features
- Handle error cases
- Follow existing patterns
- Consider edge cases

### Backend Implementation Patterns

```typescript
// Service implementation
@Injectable()
export class ServiceName {
  private readonly entity: PrismaClient["entity"];
  
  constructor(
    database: DatabaseService,
    private readonly logger: LoggerService,
  ) {
    this.entity = database.entity;
  }

  async methodName(dto: CreateDto): Promise<Result> {
    // Complete implementation
    this.logger.log('Operation started', { dto });
    
    // Validate input
    if (!dto.requiredField) {
      throw new BadRequestException('Required field missing');
    }
    
    const result = await this.entity.create({
      data: dto
    });
    
    return result;
  }
}
```

### Frontend Implementation Patterns

```typescript
// Component implementation
export function ComponentName({ props }: Props) {
  // Complete implementation with error handling
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      await props.onAction();
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div>
      <h1>{props.title}</h1>
      {error && <div className="error">{error}</div>}
      <button onClick={handleAction}>
        Action
      </button>
    </div>
  );
}
```

### Common Patterns

#### DTO Validation
```typescript
// Always use CUID with @IsString()
export class CreateDto {
  @IsString()
  id: string;  // NOT @IsUUID()
  
  @IsString()
  @MinLength(3)
  name: string;
}
```

#### Error Handling
```typescript
try {
  const result = await this.operation();
  this.logger.log('Success', { result });
  return result;
} catch (error) {
  this.logger.error('Failed', error.stack);
  throw new BadRequestException('Operation failed');
}
```

#### Database Operations
```typescript
// Use transactions for related operations
await this.prisma.$transaction(async (tx) => {
  const parent = await tx.parent.create({ data });
  const child = await tx.child.create({ 
    data: { parentId: parent.id }
  });
  return { parent, child };
});
```

## Running Code

```bash
# From monorepo root
cd .

# Start development servers
npm run dev

# Or run backend/frontend separately
npm run dev -w backend
npm run dev -w frontend

# Test functionality manually in browser
# Backend: http://127.0.0.1:3000/api
# Frontend: http://127.0.0.1:6543
```

## Focus Areas

### DO:
- Implement all requirements
- Use existing patterns
- Handle errors properly
- Log operations
- Follow type safety
- Consider edge cases

### DON'T:
- Run typechecks or linting (save for cq-fix.md)
- Fix code quality issues (save for cq-fix.md)
- Skip requirements
- Ignore error handling
- Break existing features
- Over-engineer solutions
- Add unrelated features

## Commit Message

```bash
git add .
git commit -m "feat: implement [feature]

- Add [component/service]
- Handle [requirement]
- Process [operation]

Closes #[issue-number]"
```

## Success Criteria

- All requirements implemented ✅
- Code works correctly
- Error cases handled
- Following existing patterns
- Implementation committed

## Output Format

```
🚀 IMPLEMENTATION COMPLETE

Features implemented:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Status: Working ✅
Files modified: [N] files

Implementation committed ✅
Optional: Use refactor.md to improve code quality
```

## What I Will Do

1. Review requirements from issue
2. Implement complete features
3. Handle error cases
4. Follow existing patterns
5. Test functionality manually
6. Commit implementation

## What I Won't Do

- Run typechecks or linting commands
- Fix code quality issues (that's for cq-fix.md)
- Skip requirements
- Ignore error handling
- Break existing code
- Over-engineer solutions
- Add unrelated features

## Next Phase

After implementation is complete, optionally use `refactor.md` to improve code quality.