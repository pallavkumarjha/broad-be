import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Database types (will be generated from Supabase CLI later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          handle: string | null;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          country_code: string | null;
          phone: string | null;
          email: string;
          expo_push_token: string | null;
          role: string;
          is_available: boolean;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          handle?: string | null;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          country_code?: string | null;
          phone?: string | null;
          email: string;
          expo_push_token?: string | null;
          role?: string;
          is_available?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          handle?: string | null;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          country_code?: string | null;
          phone?: string | null;
          email?: string;
          expo_push_token?: string | null;
          role?: string;
          is_available?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rides: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          tagline: string | null;
          route_summary: string | null;
          starts_at: string;
          meetup_location: any | null;
          pace: string | null;
          experience_level: string | null;
          max_riders: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          tagline?: string | null;
          route_summary?: string | null;
          starts_at: string;
          meetup_location?: any | null;
          pace?: string | null;
          experience_level?: string | null;
          max_riders?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          tagline?: string | null;
          route_summary?: string | null;
          starts_at?: string;
          meetup_location?: any | null;
          pace?: string | null;
          experience_level?: string | null;
          max_riders?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      garages: {
        Row: {
          id: string;
          owner_id: string;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          label?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          label?: string;
          created_at?: string;
        };
      };
      motorcycles: {
        Row: {
          id: string;
          garage_id: string;
          make: string;
          model: string;
          year: number;
          nickname: string | null;
          vin: string | null;
          odometer_km: number | null;
          last_serviced_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          garage_id: string;
          make: string;
          model: string;
          year: number;
          nickname?: string | null;
          vin?: string | null;
          odometer_km?: number | null;
          last_serviced_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          garage_id?: string;
          make?: string;
          model?: string;
          year?: number;
          nickname?: string | null;
          vin?: string | null;
          odometer_km?: number | null;
          last_serviced_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Create untyped client to avoid TypeScript issues
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
export const supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);