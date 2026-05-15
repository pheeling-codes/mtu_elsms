# E-Library Space Management System (ELSMS)

A premium, context-aware data intelligence platform for university space management, engineered to maximize seat occupancy efficiency and provide comprehensive administrative oversight.

## Documentation

For complete project documentation, see the [docs/](./docs/) directory:
- [Project Overview](./docs/README.md) - Complete project overview and architecture
- [Development Setup](./docs/DEVSETUP.md) - Complete development setup guide
- [Technical Methodology](./docs/METHODOLOGY.md) - Technical methodology and implementation details
- [Product Requirements](./docs/PRD.md) - Product Requirements Document

## Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd mtu_elsms
pnpm install

# Configure environment
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env files with your Supabase credentials

# Start development
pnpm dev
```

## Key Features

### Student Portal
- **Dynamic Seat Map**: Interactive SVG-based seat visualization with real-time status updates
- **Interactive Canvas**: Intuitive zone-based seat selection with filtering capabilities
- **Multi-channel Reservations**: Web-based booking with QR code confirmation and mobile-responsive design
- **Profile Analytics**: Personalized dashboard showing hours spent, reservation history, and no-show tracking

### Administrative Command Center
- **Live Occupancy Dashboard**: Real-time seat utilization metrics with zone-based analytics
- **Architectural Seat Editor**: Canvas API-powered seat positioning and zone configuration
- **Zone Management**: Dynamic zone creation with customizable features (quiet, group, charging areas)
- **User Accountability**: Automated no-show detection, reservation enforcement, and usage analytics

## Technology Stack

### Frontend
- **Next.js 16.2.3** (Turbopack) - React framework with edge runtime support
- **Tailwind CSS 3.4.0** - Utility-first styling framework
- **Shadcn UI** - Premium component library built on Radix UI primitives
- **Framer Motion 12.38.0** - Production-ready motion library for animations
- **React 19.2.4** - Latest React with concurrent features
- **Zustand 5.0.12** - Lightweight state management
- **Recharts 2.12.0** - Composable charting library

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Prisma ORM 6.19.3** - Type-safe database access with schema generation
- **Supabase Realtime** - WebSocket-based real-time subscriptions
- **Supabase Storage** - File storage for avatars and assets

### Development Infrastructure
- **Turbo** - High-performance monorepo build system
- **pnpm 10.33.0** - Efficient package manager with workspace support
- **TypeScript 5.4.0** - Type-safe development with strict configuration

## Architecture Overview

```
elsms-monorepo/
├── apps/
│   ├── web/           # Next.js frontend application
│   └── api/           # API services (if applicable)
├── packages/
│   ├── database/      # Prisma schema and database utilities
│   └── types/         # Shared TypeScript definitions
├── docs/              # Centralized documentation
└── turbo.json         # Monorepo build configuration
```

---

*ELSMS - Precision Library Space Management*
