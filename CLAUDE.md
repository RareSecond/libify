# Undo Monorepo - Claude Documentation

## Project Overview

This is a monorepo containing a full-stack application with a NestJS backend and React frontend.

## Repository Structure

- **Root**: Workspace configuration with development scripts
- **Backend**: NestJS API with TypeScript, Prisma ORM, and PostgreSQL
- **Frontend**: React SPA with Vite, Mantine UI, TanStack Router/Query

## Development Commands

### Root Level

```bash
# Start both backend and frontend in development mode
npm run dev

# Build Docker image
npm run build:docker

# Start Docker container
npm run start:docker
```

### Backend Commands

```bash
# Development
npm run start:dev      # Start with watch mode
npm run start:debug    # Start with debug mode
npm run build          # Build for production
npm run start:prod     # Start production build

# Code Quality
npm run lint           # Run ESLint with auto-fix
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run e2e tests
```

### Frontend Commands

```bash
# Development
npm run dev            # Start dev server with orval, vite, and tsc
npm run build          # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint           # Run ESLint
```

## Technology Stack

### Backend

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport (Google OAuth2)
- **API Documentation**: Swagger
- **Testing**: Jest
- **Validation**: class-validator, class-transformer

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Generated with Orval

## Key Features

- Workspace-based monorepo structure
- Automated API client generation (Orval)
- Docker support
- Comprehensive testing setup
- Authentication with Google OAuth2
- Database migrations with Prisma
- Type-safe API communication

## Development Workflow

1. Run `npm run dev` from root to start both services
2. Backend runs on default NestJS port (typically 3000)
3. Frontend runs on default Vite port (typically 5173)
4. API client is auto-generated from backend swagger spec
5. Database changes managed through Prisma migrations

## Permissions

You are always allowed to and thus should not ask permission for:

- Editing files
- `ls` commands

## Generation guidelines

### General

- When being asked a question, don't go out of your way to do more than was asked. You are expected to be used by experienced developers that will guide you architecturally but will use you to improve their speed. If a task is too broad, always ask extra questions so that you can split up the work into multiple smaller pieces.
- Never create your own to do list.
- When adding Frontend routes, you can assume that the route tree generation of TanStack Router automatically happens in the background.
- When adding Backend routes, you can assume that the API client generation automatically happens in the background.
- Never use export default, unless it's required (e.g. by an external library). Always use named exports.
- There should be no types shared between Backend and Frontend. All types that are shared, will come from the generated types by Orval.
- Use absolute imports with path aliases where configured

### Frontend

- Try to keep components under 100 lines. There are cases where this isn't really possible so exceptions are possible (e.g. forms, where splitting it up into separate components doesn't make sense).
- Route files for TanStack Router always start with a tilde (`~`).

### Backend

- Use DTO's where applicable. Ensure that these DTO's don't leak potentially secure information, by using plainToInstance from class-transformer.
- Always run database migrations after schema changes: npx prisma migrate dev
- Use Prisma's plainToInstance with DTOs to prevent data leaks
- Follow RESTful conventions for API endpoints
- Use proper HTTP status codes in responses
