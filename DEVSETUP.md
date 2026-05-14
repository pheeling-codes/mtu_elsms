# Development Setup Guide

Complete zero-to-running setup for the E-Library Space Management System (ELSMS) monorepo.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (Latest LTS version - 20.x or higher)
- **pnpm** (Package manager - version 10.33.0 or higher)
- **Supabase Project** (Active Supabase account with project created)

## Quick Start Commands

```bash
# Clone and initialize
git clone <repository-url>
cd mtu_elsms

# Install dependencies
pnpm install

# Configure environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local with your Supabase credentials

# Sync database
pnpm db:push

# Start development
pnpm dev
```

## Detailed Setup Instructions

### 1. Repository Cloning & Initialization

Clone the repository and navigate to the project root:

```bash
git clone https://https://github.com/pheeling-codes/mtu_elsms.git
cd mtu_elsms
```

### 2. Dependency Installation

Install all monorepo dependencies using pnpm:

```bash
pnpm install
```

This command installs dependencies for:
- Root monorepo packages (Turbo, TypeScript)
- `apps/web` frontend application
- `packages/database` Prisma utilities
- `packages/types` shared TypeScript definitions

### 3. Environment Configuration

Create your environment configuration file:

```bash
# Copy the example environment file
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your Supabase project credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations
- `DATABASE_URL`: Direct PostgreSQL connection string

### 4. Supabase Storage Setup

Create the required storage bucket in your Supabase project:

1. Navigate to your Supabase dashboard
2. Go to **Storage** section
3. Create a new bucket named `profiles`
4. Set bucket permissions to allow public uploads for avatars
5. Ensure Row Level Security (RLS) is properly configured

### 5. Database Synchronization

Synchronize your local database schema with Supabase:

```bash
# From the packages/database directory
cd packages/database
pnpm db:push
```

Alternatively, from the project root:

```bash
pnpm --filter @elsms/database db:push
```

This command:
- Generates Prisma client
- Pushes schema changes to Supabase
- Creates all necessary tables and relationships
- Applies database migrations

### 6. Development Execution

Start the development server:

```bash
pnpm dev
```

This command runs:
- **Next.js development server** (typically on http://localhost:3000)
- **Turbo build system** for monorepo coordination
- **Hot reload** for frontend changes
- **TypeScript compilation** in watch mode

The application will be available at `http://localhost:3000`

### 7. Build & Production

Build the application for production:

```bash
pnpm build
```

This command:
- Compiles all TypeScript files
- Optimizes Next.js bundles
- Generates static assets
- Prepares deployment-ready build

## Development Workflow

### Database Schema Changes

1. Modify `packages/database/prisma/schema.prisma`
2. Run `pnpm --filter @elsms/database db:push` to apply changes
3. Regenerate Prisma client: `pnpm --filter @elsms/database generate`

### Package Management

- Add dependencies to specific workspaces: `pnpm --filter @elsms/web add <package>`
- Add dev dependencies: `pnpm --filter @elsms/web add -D <package>`
- Update all dependencies: `pnpm update`

### Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type check only
pnpm --filter @elsms/web lint
```

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correctly set in `.env.local`
- Ensure Supabase project is active
- Check network connectivity

**Prisma Client Generation**
```bash
# Force regenerate client
pnpm --filter @elsms/database generate
```

**Dependency Resolution**
```bash
# Clear pnpm cache
pnpm store prune
pnpm install
```

**Port Conflicts**
- Default Next.js port: 3000
- Modify in `apps/web/next.config.ts` if needed

### Development Tools

- **Supabase Dashboard**: https://app.supabase.com
- **Database Inspector**: Built into Supabase dashboard
- **API Documentation**: Available in Supabase project settings

## Production Deployment

### Frontend (Vercel)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

1. Database is already hosted on Supabase
2. Ensure all migrations are applied
3. Configure RLS policies for security

### Environment Variables for Production

- `NEXT_PUBLIC_SUPABASE_URL`: Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Production anon key
- `DATABASE_URL`: Production database string

---

*For additional support, refer to the project documentation or contact the development team.*
