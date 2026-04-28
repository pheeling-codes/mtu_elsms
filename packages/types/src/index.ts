// ==========================================
// User Types
// ==========================================
export interface User {
  id: string;
  name: string;
  email: string;
  matric_number: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

// ==========================================
// Zone Types
// ==========================================
export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ZoneType {
  QUIET = 'QUIET',
  GROUP = 'GROUP',
}

// ==========================================
// Seat Types
// ==========================================
export interface Seat {
  id: string;
  zoneId: string;
  seatNumber: number;
  status: SeatStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
}

// ==========================================
// Reservation Types
// ==========================================
export interface Reservation {
  id: string;
  userId: string;
  seatId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// ==========================================
// API Response Types
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
