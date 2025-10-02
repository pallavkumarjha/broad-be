import { supabase } from '../config/supabase.js';

export interface ProfileSearchParams {
  query?: string;
  role?: string;
  is_available?: boolean;
  country_code?: string;
  page?: number;
  limit?: number;
}

export class ProfileService {
  async getProfileById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  async getProfileByUserId(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get profile by user ID: ${error.message}`);
    }

    return data;
  }

  async getProfileByHandle(handle: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  async createProfile(profileData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data;
  }

  async updateProfile(id: string, updateData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  }

  async updateLocation(id: string, latitude: number, longitude: number) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }

    return data;
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    return data;
  }

  async searchProfiles(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      throw new Error(`Failed to search profiles: ${error.message}`);
    }

    return data;
  }
}

export const profileService = new ProfileService();