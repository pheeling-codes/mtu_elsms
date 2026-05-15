# E-Library Space Management System (ELSMS) Documentation

## Project Overview

The E-Library Space Management System (ELSMS) is a premium, context-aware data intelligence platform for university space management, engineered to maximize seat occupancy efficiency and provide comprehensive administrative oversight.

## Problem Statement

MTU library faces significant challenges in space utilization efficiency:
- Inconsistent seat allocation leading to underutilization
- Lack of real-time occupancy tracking
- Manual reservation processes prone to errors
- No data-driven insights for space optimization
- Limited administrative oversight of space usage

## Solution

ELSMS delivers precision seat allocation, automated reservation workflows, and comprehensive analytics for optimal space efficiency through:
- Intelligent seat management with real-time status updates
- Data-driven administrative control and analytics
- Automated reservation workflows with conflict resolution
- Comprehensive user accountability and no-show tracking

## Core Features

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

## Documentation Structure

- **[README.md](./README.md)** - This file: Project overview and architecture
- **[DEVSETUP.md](./DEVSETUP.md)** - Complete development setup guide
- **[METHODOLOGY.md](./METHODOLOGY.md)** - Technical methodology and implementation details
- **[PRD.md](./PRD.md)** - Product Requirements Document

## Getting Started

For detailed setup instructions, see the [Development Setup Guide](./DEVSETUP.md).

---

*ELSMS - Precision Library Space Management*
