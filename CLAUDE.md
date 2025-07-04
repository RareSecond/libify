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