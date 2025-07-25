# Analyze for Kysely Improvements

Analyze the files changed in the current git branch to identify Prisma queries that would benefit from being converted to Kysely.

## Instructions:

1. First, get the list of changed files in the current branch compared to main/master
2. For each TypeScript file in the backend, analyze Prisma usage
3. Identify queries that should use Kysely based on these criteria:

### Should use Kysely if the query has:
- Nested includes deeper than 2 levels
- Multiple joins (include with multiple relations)
- Aggregations (count, sum, avg, etc.) with groupBy
- Raw SQL queries ($queryRaw, $executeRaw)
- Dynamic query building (conditional where clauses)
- Bulk operations on many records
- Complex filtering with OR conditions
- Performance issues noted in comments

### Should stay with Prisma if:
- Simple findUnique, findFirst, create, update, delete
- Single-level includes
- Basic where conditions
- Simple counts without grouping

## Output Format:

For each file with potential improvements:
1. File path
2. Line number(s)
3. Current Prisma query
4. Reason for Kysely recommendation
5. Example of how it could be written with Kysely

Focus on actionable improvements that would have real performance benefits.