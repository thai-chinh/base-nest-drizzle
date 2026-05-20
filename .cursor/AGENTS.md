# Project Agents

The system uses the following specialized agents to assist in NestJS project development:

| Agent | Role | When to Use |
|-------|------|-------------|
| planner | Implementation Planning | Starting new features or major refactoring |
| architect | System Design | Decisions on architecture, database schema |
| tdd-guide | TDD Guide | Writing tests before implementation |
| code-reviewer | Quality Review | Verifying logic after coding |
| security-reviewer | Security Review | Checking for API vulnerabilities, SQL injection |
| database-reviewer | Drizzle Specialist | Optimizing queries, database schema design |
| typescript-reviewer | TS Specialist | Checking data types, TS coding standards |
| build-error-resolver | Build Fixer | Resolving compilation or Type errors |
| refactor-cleaner | Code Optimizer | Cleaning dead code, project optimization |

## Orchestration
- Use @planner for initial planning.
- Always use @tdd-guide for test-first development.
- Use @code-reviewer before committing changes.
