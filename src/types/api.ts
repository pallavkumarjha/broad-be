// Shared API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Profile DTOs
export interface ProfileDTO {
  id: string;
  handle: string | null;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  role: 'rider' | 'moderator' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileDTO {
  handle?: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  countryCode?: string;
  phoneNumber?: string;
}

export interface UpdateProfileDTO {
  handle?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  countryCode?: string;
  phoneNumber?: string;
  expoPushToken?: string;
}

// Ride DTOs
export interface RideDTO {
  id: string;
  creatorId: string;
  title: string;
  tagline: string | null;
  routeSummary: string | null;
  startsAt: string;
  meetupLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  pace: 'cruise' | 'group' | 'spirited' | null;
  experienceLevel: 'novice' | 'intermediate' | 'advanced' | null;
  maxRiders: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  // Populated fields
  creator?: ProfileDTO;
  bookingsCount?: number;
  isBooked?: boolean;
}

export interface CreateRideDTO {
  title: string;
  tagline?: string;
  routeSummary?: string;
  startsAt: string;
  meetupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  pace?: 'cruise' | 'group' | 'spirited';
  experienceLevel?: 'novice' | 'intermediate' | 'advanced';
  maxRiders?: number;
}

export interface UpdateRideDTO {
  title?: string;
  tagline?: string;
  routeSummary?: string;
  startsAt?: string;
  meetupLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  pace?: 'cruise' | 'group' | 'spirited';
  experienceLevel?: 'novice' | 'intermediate' | 'advanced';
  maxRiders?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// Garage DTOs
export interface GarageDTO {
  id: string;
  ownerId: string;
  label: string;
  createdAt: string;
  motorcycles?: MotorcycleDTO[];
}

export interface CreateGarageDTO {
  label: string;
}

export interface UpdateGarageDTO {
  label?: string;
}

// Motorcycle DTOs
export interface MotorcycleDTO {
  id: string;
  garageId: string;
  make: string;
  model: string;
  year: number;
  nickname: string | null;
  vin: string | null;
  odometerKm: number | null;
  lastServicedAt: string | null;
  createdAt: string;
}

export interface CreateMotorcycleDTO {
  garageId: string;
  make: string;
  model: string;
  year: number;
  nickname?: string;
  vin?: string;
  odometerKm?: number;
  lastServicedAt?: string;
}

export interface UpdateMotorcycleDTO {
  make?: string;
  model?: string;
  year?: number;
  nickname?: string;
  vin?: string;
  odometerKm?: number;
  lastServicedAt?: string;
}

// Maintenance Log DTOs
export interface MaintenanceLogDTO {
  id: string;
  motorcycleId: string;
  performedAt: string;
  description: string;
  cost: number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateMaintenanceLogDTO {
  motorcycleId: string;
  performedAt: string;
  description: string;
  cost?: number;
  notes?: string;
}

export interface UpdateMaintenanceLogDTO {
  performedAt?: string;
  description?: string;
  cost?: number;
  notes?: string;
}

// Booking DTOs
export interface BookingDTO {
  id: string;
  rideId: string;
  riderId: string;
  status: 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
  createdAt: string;
  // Populated fields
  rider?: ProfileDTO;
  ride?: RideDTO;
}

// Query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface RideQuery extends PaginationQuery {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  creatorId?: string;
  startDate?: string;
  endDate?: string;
}