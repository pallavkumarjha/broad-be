import { supabase, supabaseService } from '../config/supabase.js';

export interface ProfileSearchParams {
  query?: string;
  role?: string;
  is_available?: boolean;
  country_code?: string;
  page?: number;
  limit?: number;
}

export class ProfileService {
  // Transform database row to API format
  private transformProfileToAPI(profile: any) {
    if (!profile) return null;
    
    return {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      countryCode: profile.country_code,
      phoneNumber: profile.phone_number,
      expoPushToken: profile.expo_push_token,
      role: profile.role,
      isAvailable: profile.is_available,
      latitude: profile.latitude,
      longitude: profile.longitude,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }

  async getProfileById(id: string) {
    const { data, error } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return this.transformProfileToAPI(data);
  }

  async getProfileByUserId(userId: string) {
    const { data, error } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get profile by user ID: ${error.message}`);
    }

    return this.transformProfileToAPI(data);
  }

  async getProfileByHandle(handle: string) {
    const { data, error } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error) {
      throw new Error(`Failed to get profile by handle: ${error.message}`);
    }

    return this.transformProfileToAPI(data);
  }

  async createProfile(profileData: any) {
    const { data, error } = await supabaseService
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    // Sync display_name to auth.users raw_user_meta_data
    if (profileData.display_name) {
      const { error: authError } = await supabaseService.auth.admin.updateUserById(profileData.id, {
        user_metadata: { display_name: profileData.display_name }
      });

      if (authError) {
        console.warn('Failed to sync display_name to auth.users:', authError.message);
      }
    }

    return this.transformProfileToAPI(data);
  }

  async updateProfile(id: string, updateData: any) {
    // Update profiles table
    const { data, error } = await supabaseService
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    // Sync display_name to auth.users raw_user_meta_data
    if (updateData.display_name) {
      const { error: authError } = await supabaseService.auth.admin.updateUserById(id, {
        user_metadata: { display_name: updateData.display_name }
      });

      if (authError) {
        console.warn('Failed to sync display_name to auth.users:', authError.message);
      }
    }

    return this.transformProfileToAPI(data);
  }

  async updateLocation(id: string, latitude: number, longitude: number) {
    const { data, error } = await supabaseService
      .from('profiles')
      .update({
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }

    return this.transformProfileToAPI(data);
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    const { data, error } = await supabaseService
      .from('profiles')
      .update({
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    return this.transformProfileToAPI(data);
  }

  async searchProfiles(query: string) {
    const { data, error } = await supabaseService
      .from('profiles')
      .select('*')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      throw new Error(`Failed to search profiles: ${error.message}`);
    }

    return data?.map(profile => this.transformProfileToAPI(profile)) || [];
  }
}

export const profileService = new ProfileService();