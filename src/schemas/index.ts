import { z } from 'zod';

// Common schemas
export const UuidSchema = z.string().uuid();
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Profile schemas
export const CreateProfileSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  countryCode: z.string().length(2).optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
});

export const UpdateProfileSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  countryCode: z.string().length(2).optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
  expoPushToken: z.string().optional(),
});

// Ride schemas
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export const CreateRideSchema = z.object({
  title: z.string().min(1).max(200),
  tagline: z.string().max(100).optional(),
  routeSummary: z.string().max(1000).optional(),
  startsAt: z.string().datetime(),
  meetupLocation: LocationSchema.optional(),
  pace: z.enum(['cruise', 'group', 'spirited']).optional(),
  experienceLevel: z.enum(['novice', 'intermediate', 'advanced']).optional(),
  maxRiders: z.number().int().min(2).max(50).default(10),
});

export const UpdateRideSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  tagline: z.string().max(100).optional(),
  routeSummary: z.string().max(1000).optional(),
  startsAt: z.string().datetime().optional(),
  meetupLocation: LocationSchema.optional(),
  pace: z.enum(['cruise', 'group', 'spirited']).optional(),
  experienceLevel: z.enum(['novice', 'intermediate', 'advanced']).optional(),
  maxRiders: z.number().int().min(2).max(50).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const RideQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  creatorId: UuidSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Garage schemas
export const CreateGarageSchema = z.object({
  label: z.string().min(1).max(100),
});

export const UpdateGarageSchema = z.object({
  label: z.string().min(1).max(100).optional(),
});

// Motorcycle schemas
export const CreateMotorcycleSchema = z.object({
  garageId: UuidSchema,
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1960).max(new Date().getFullYear() + 1),
  nickname: z.string().max(50).optional(),
  vin: z.string().length(17).optional(),
  odometerKm: z.number().min(0).optional(),
  lastServicedAt: z.string().date().optional(),
});

export const UpdateMotorcycleSchema = z.object({
  make: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  year: z.number().int().min(1960).max(new Date().getFullYear() + 1).optional(),
  nickname: z.string().max(50).optional(),
  vin: z.string().length(17).optional(),
  odometerKm: z.number().min(0).optional(),
  lastServicedAt: z.string().date().optional(),
});

// Maintenance log schemas
export const CreateMaintenanceLogSchema = z.object({
  motorcycleId: UuidSchema,
  performedAt: z.string().date(),
  description: z.string().min(1).max(500),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateMaintenanceLogSchema = z.object({
  performedAt: z.string().date().optional(),
  description: z.string().min(1).max(500).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

// Booking schemas
export const CreateBookingSchema = z.object({
  rideId: UuidSchema,
});



// Unified auth schemas
export const UnifiedPhoneAuthSchema = z.object({
  phone: z.string(),
});

export const UnifiedVerifyOTPSchema = z.object({
  phone: z.string(),
  token: z.string().length(6, 'OTP must be 6 digits'),
});

// Export all schema types
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateRideInput = z.infer<typeof CreateRideSchema>;
export type UpdateRideInput = z.infer<typeof UpdateRideSchema>;
export type RideQueryInput = z.infer<typeof RideQuerySchema>;
export type CreateGarageInput = z.infer<typeof CreateGarageSchema>;
export type UpdateGarageInput = z.infer<typeof UpdateGarageSchema>;
export type CreateMotorcycleInput = z.infer<typeof CreateMotorcycleSchema>;
export type UpdateMotorcycleInput = z.infer<typeof UpdateMotorcycleSchema>;
export type CreateMaintenanceLogInput = z.infer<typeof CreateMaintenanceLogSchema>;
export type UpdateMaintenanceLogInput = z.infer<typeof UpdateMaintenanceLogSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export type UnifiedPhoneAuthInput = z.infer<typeof UnifiedPhoneAuthSchema>;
export type UnifiedVerifyOTPInput = z.infer<typeof UnifiedVerifyOTPSchema>;