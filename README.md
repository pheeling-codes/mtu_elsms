# E-Library Space Management System (ELSMS)

A premium, context-aware data intelligence platform for university space management, engineered to maximize seat occupancy efficiency and provide comprehensive administrative oversight.

## Core Value Proposition

**High-Impact Utility**: Transform library space utilization through intelligent seat management, real-time occupancy tracking, and data-driven administrative control. ELSMS delivers precision seat allocation, automated reservation workflows, and comprehensive analytics for optimal space efficiency.

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
└── turbo.json         # Monorepo build configuration
```

## Database Schema

The system is built on a relational PostgreSQL schema with the following core entities:

- **Users**: Student and administrator profiles with authentication
- **Zones**: Configurable library areas (quiet, group, charging)
- **Seats**: Individual seating with position coordinates and status tracking
- **Reservations**: Time-based seat allocations with status management
- **SystemSettings**: Global configuration for library operations

## Real-Time Features

- **Live Seat Status**: Instant updates across all connected clients
- **Reservation Notifications**: Real-time booking confirmations and alerts
- **Administrative Dashboard**: Dynamic occupancy metrics without page refresh
- **Conflict Resolution**: Automated handling of simultaneous reservation attempts

## Security & Performance

- **Row Level Security**: Database-level access control via Supabase RLS
- **JWT Authentication**: Secure token-based user sessions
- **Optimized Queries**: Efficient database operations with proper indexing
- **CDN Integration**: Fast asset delivery through Supabase Storage

## Deployment Architecture

- **Frontend**: Vercel deployment with edge optimization
- **Backend**: Supabase cloud infrastructure
- **Database**: Managed PostgreSQL with automated backups
- **Storage**: Supabase Storage with CDN acceleration

---

*ELSMS - Precision Library Space Management*
