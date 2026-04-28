# ELSMS System Memory & Source of Truth

This document serves as the persistent memory and core truth-source for the E-Library Space Management System (ELSMS) project. It contains the project vision, finalized technical stack, current progression state, data modeling, and specific UX/UI guidelines.

## 1. Project Identity & Vision
- **Name:** E-Library Space Management System (ELSMS).
- **Vision:** Transforming academic libraries into digital study hubs via real-time seat orchestration.
- **Aesthetic:** Clean, premium, minimalist.
- **Design System:** Strict adherence to an 8px spacing system.

## 2. Technical Stack (Finalized)
- **Monorepo:** Turborepo managed with `pnpm`.
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS (v4), Shadcn UI, Framer Motion.
- **Backend:** NestJS (Node.js).
- **Database:** Live Supabase PostgreSQL (Cloud-only, **no Docker**).
- **ORM:** Prisma.

## 3. Current Progress & State
- **Phase 1 (Complete):** 
  - Monorepo scaffolding established.
  - Shared Types package (`@elsms/types`) implemented and integrated.
  - Supabase Cloud connection successfully verified.
  - Prisma schema fully pushed and synchronized to the live database.
- **Current Blocker/Status:** 
  - Environment variables are actively configured and working (crucially using `%40` for the password `@` symbol to prevent URI parsing errors). 
  - System diagnostics are green and the NestJS backend successfully connects to the live database.

## 4. Data Model (Prisma)
The database utilizes Prisma and is housed within `packages/database`. The core entities are:
- **User:** Primary authentication and student record model.
  - Fields: `id`, `matricNumber` (Unique), `role` (STUDENT | ADMIN), `createdAt`, `updatedAt`.
  - Relations: One-to-Many with `Reservation`.
- **Zone:** Represents physical sections of the library.
  - Fields: `id`, `name`, `type` (QUIET | GROUP), `createdAt`, `updatedAt`.
  - Relations: One-to-Many with `Seat`.
- **Seat:** Individual reservable entities within a Zone.
  - Fields: `id`, `zoneId`, `seatNumber`, `status` (AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE), `createdAt`, `updatedAt`.
  - Relations: Belongs to a `Zone`. One-to-Many with `Reservation`. Unique constraint on `[zoneId, seatNumber]`.
- **Reservation:** Time-bound booking mapping a User to a Seat.
  - Fields: `id`, `userId`, `seatId`, `startTime`, `endTime`, `status` (ACTIVE | COMPLETED | CANCELLED), `createdAt`, `updatedAt`.
  - Relations: Belongs to `User` and `Seat`.

## 5. UI/UX Rules
The system uses strict semantic color coding for seat orchestration and interaction states:
- **Available:** Emerald (`#10B981`)
- **Occupied:** Rose
- **Reserved:** Amber

## 6. Immediate Next Steps (Phase 2.1)
- **Authentication UI:** Implement the Authentication suite (Login, Signup, Forgot Password) within `apps/web`.
- **Layout:** Utilize the split-screen layout concept (reference: `LoginPage.jpg`) for the primary auth screens.
- **Integration:** Connect Supabase Auth to the frontend to handle user sessions and registrations.

## 7. Critical Context
- **Infrastructure:** We are **NOT** using Docker for this project. The database layer relies entirely on the live Supabase cloud instance.
- **User Identification:** The system relies heavily on the student's Matric Number as a primary identifier. Ensure validation logic adheres to the specific Matric Number format (e.g., `MAT/19/1234`) for student users.
