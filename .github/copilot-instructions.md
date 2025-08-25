# GitHub Copilot Instructions for llm-rpg Repository

## Repository Overview

This is **llm-rpg**, a TypeScript monorepo that provides an RPG system with LLM-powered narrative generation and character memory. It consolidates three main components:
- **Backend**: Fastify-based API server with Neo4j/Redis storage and Ollama LLM integration  
- **Admin Dashboard**: React+Vite administrative interface for managing characters, memories, and game state
- **Story Frontend**: React+Vite user-facing interface for RPG gameplay

**Project Size**: ~8 packages, ~736 npm dependencies, TypeScript codebase (~50k+ lines)
**Runtime**: Node.js 20+, requires Neo4j database, optional Redis and Ollama
**Package Manager**: pnpm (required - do not use npm or yarn)
**Namespace**: All packages use `@rpg/*` scope

## Build System & Dependencies

### Initial Setup (ALWAYS follow this exact sequence)
```bash
# 1. Install pnpm globally if not available
npm install -g pnpm

# 2. Install dependencies (MUST use --no-frozen-lockfile initially)  
pnpm install --no-frozen-lockfile

# 3. Approve native dependency builds (select all with 'a', then 'y')
pnpm approve-builds
# Select: esbuild, faiss-node (press 'a' to toggle all, then Enter, then 'y')
```

**Critical**: Always use `pnpm install --no-frozen-lockfile` on first install due to lockfile being out of sync. Standard `pnpm install` will fail with frozen lockfile errors.

### Core Build Commands
```bash
# Type check all packages
pnpm typecheck                    # Fast, always run first

# Build all packages (dependencies in correct order)
pnpm build:all                    # ~2-3 minutes

# Individual package builds
pnpm build:admin                  # Admin dashboard only
pnpm build:backend               # Backend only

# Static embedding (production-ready)
pnpm build:embed                 # Builds admin+backend+copies static files
```

### Development Servers
```bash
# All services (requires Neo4j running)
pnpm dev                         # Runs backend + admin + frontend concurrently

# Individual services
pnpm dev:backend                 # Port 3001 (API)
pnpm dev:admin                   # Port 5173 (Admin dashboard)  
pnpm dev:frontend               # Port 5174 (Story frontend)
```

**KNOWN ISSUE**: `pnpm dev:backend` currently fails due to @fastify/compress version compatibility issue with Fastify 4.x. The error is:
```
FastifyError: fastify-plugin: @fastify/compress - expected '5.x' fastify version, '4.29.1' is installed
```
**Workaround**: Use `pnpm build:backend && node packages/backend/dist/index.js` or fix dependency versions.

### Testing
```bash
# Backend tests (uses Vitest) - 3 tests for static admin embedding
cd packages/backend && pnpm test    

# Affect package tests (uses Vitest) - 4 tests for affective system updates
cd packages/affect && pnpm test

# Individual package testing  
pnpm --filter @rpg/backend test
pnpm --filter @rpg/affect test
```

**Note**: Limited test coverage. Backend and affect packages have working test suites. Context-modifier has test files but no test script defined in package.json.

## Project Architecture & Layout

### Root Directory Structure
- `package.json` - Workspace scripts and dev dependencies
- `pnpm-workspace.yaml` - Defines packages/* workspace
- `tsconfig.base.json` - Base TypeScript config with @rpg/* path aliases
- `.env.example` - Environment template (copy to `.env` for local dev)
- `docker-compose.yml` - Neo4j and Redis services
- `scripts/embed-copy-admin.cjs` - Static file embedding utility

### Package Structure (`packages/`)
```
packages/
├── backend/              # @rpg/backend - Main Fastify API server
├── admin-dashboard/      # @rpg/admin-dashboard - React admin UI  
├── frontend/             # @rpg/frontend - React story/game UI
├── types/                # @rpg/types - Shared TypeScript types + Zod schemas
├── utils/                # @rpg/utils - Common utilities
├── mca/                  # @rpg/mca - Memory, Character, Affect modules
├── context-modifier/     # @rpg/context-modifier - LLM context management
└── affect/               # @rpg/affect - Emotional/affective systems
```

### Key Configuration Files
- `packages/admin-dashboard/vite.config.js` - Admin build config
- `packages/frontend/vite.config.ts` - Story frontend config  
- `packages/backend/src/config.ts` - Runtime configuration (loads from .env)
- `packages/types/ts-to-zod.config.cjs` - Type → Zod schema generation

### Environment Variables (copy .env.example to .env)
**Required for backend:**
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` - Database connection
- `PORT=3001` - Backend server port

**Optional services:**
- `REDIS_URL` - Caching layer
- `OLLAMA_BASE_URL` - LLM service endpoint

**Static embedding flags:**
- `SERVE_ADMIN_STATIC=true` - Serve admin from backend /admin/*
- `ADMIN_PUBLIC=true/false` - Public access vs API key gated
- `ADMIN_API_KEY` - Protection key when ADMIN_PUBLIC=false

## External Service Dependencies

### Required
- **Neo4j** (bolt://localhost:7687): Primary database
  ```bash
  docker-compose up neo4j  # Or install locally
  ```

### Optional  
- **Redis** (localhost:6380): Caching and session storage
- **Ollama** (localhost:11434): LLM inference server
  ```bash
  # Install Ollama, then pull a model
  ollama pull mistral:instruct
  ```

## Build Validation Checklist

Before making changes, verify the baseline works:
```bash
# 1. Clean install
rm -rf node_modules packages/*/node_modules packages/*/dist
pnpm install --no-frozen-lockfile && pnpm approve-builds

# 2. Type checking
pnpm typecheck                   # Should pass without errors

# 3. Build process  
pnpm build:all                   # Should complete in ~2-3 minutes

# 4. Static embedding
pnpm embed:copy                  # Should copy admin assets to backend/dist/admin

# 5. Test suites
cd packages/backend && pnpm test # Should pass 3 tests
cd packages/affect && pnpm test  # Should pass 4 tests
```

## Common Issues & Workarounds

**1. "fastify-plugin version mismatch" during dev:backend**
- Cause: @fastify/compress incompatible with Fastify 4.x
- Workaround: Build and run directly: `pnpm build:backend && node packages/backend/dist/index.js`

**2. "Cannot install with frozen-lockfile"**  
- Always use `pnpm install --no-frozen-lockfile` initially
- Lockfile is intentionally out of sync with some package.json files

**3. "Permission denied" or build script failures**
- Run `pnpm approve-builds` to enable native dependency compilation
- Required for esbuild and faiss-node native modules

**4. TypeScript path resolution errors**
- Ensure `pnpm install` completed successfully
- All packages use workspace protocol: `@rpg/types: workspace:*`
- Check `tsconfig.base.json` for @rpg/* path mappings

**5. Neo4j connection failures**
- Start services: `docker-compose up neo4j redis`  
- Check .env file has correct NEO4J_* variables

## Development Workflow

### Making Backend Changes
```bash
# 1. Start external services
docker-compose up -d neo4j

# 2. Build and test
pnpm build:backend
cd packages/backend && pnpm test

# 3. Run manually (due to dev script issue)
SERVE_ADMIN_STATIC=true node packages/backend/dist/index.js
```

### Making Frontend Changes  
```bash
# Admin dashboard
pnpm dev:admin                   # http://localhost:5173

# Story frontend  
pnpm dev:frontend               # http://localhost:5174

# Test static embedding
pnpm build:admin && pnpm embed:copy
```

### Adding Dependencies
```bash
# Add to specific package
pnpm --filter @rpg/backend add dependency-name

# Add to workspace root
pnpm add -w -D dev-dependency
```

## Deployment & Production

### Static Embedding (Recommended)
```bash
# Build everything with embedded admin
pnpm build:embed

# Resulting artifacts:
# - packages/backend/dist/ (complete server + embedded admin)
# - Admin dashboard accessible at /admin/* when SERVE_ADMIN_STATIC=true
```

### Docker Deployment
- Use provided `docker-compose.yml` for Neo4j/Redis
- Backend runs as single Node.js process serving API + static files
- See `docs/development/static-frontend.md` for detailed deployment patterns

## Documentation References  
- `docs/integration-story-memory.md` - Overall architecture and package mapping
- `docs/consolidation-notes.md` - Migration decisions and follow-up items  
- `docs/development/static-frontend.md` - Static embedding implementation details
- `CONSOLIDATION_TODO.md` - Historical consolidation plan and remaining tasks

**Trust These Instructions**: The information above has been validated by building and testing the codebase. Only perform additional exploration if specific instructions are incomplete or found to be incorrect.