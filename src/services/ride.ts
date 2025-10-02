import { supabase } from '../config/supabase.js';

export interface RideSearchParams {
  creator_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius_km?: number;
  };
  page?: number;
  limit?: number;
}

export class RideService {
  async getRideById(id: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get ride: ${error.message}`);
    }

    return data;
  }

  async getRidesByCreator(creatorId: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get rides by creator: ${error.message}`);
    }

    return data;
  }

  async getUpcomingRides() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .gte('starts_at', now)
      .eq('status', 'active')
      .order('starts_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get upcoming rides: ${error.message}`);
    }

    return data;
  }

  async getRidesByStatus(status: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get rides by status: ${error.message}`);
    }

    return data;
  }

  async getRidesInDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .gte('starts_at', startDate)
      .lte('starts_at', endDate)
      .order('starts_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get rides in date range: ${error.message}`);
    }

    return data;
  }

  async createRide(rideData: any) {
    const { data, error } = await supabase
      .from('rides')
      .insert(rideData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ride: ${error.message}`);
    }

    return data;
  }

  async updateRide(id: string, updateData: any) {
    const { data, error } = await supabase
      .from('rides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ride: ${error.message}`);
    }

    return data;
  }

  async deleteRide(id: string) {
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ride: ${error.message}`);
    }

    return true;
  }

  async updateRideStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('rides')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ride status: ${error.message}`);
    }

    return data;
  }

  async searchRides(filters: any = {}) {
    let query = supabase
      .from('rides')
      .select('*')
      .eq('status', 'active');

    if (filters.pace) {
      query = query.eq('pace', filters.pace);
    }

    if (filters.experience_level) {
      query = query.eq('experience_level', filters.experience_level);
    }

    if (filters.starts_after) {
      query = query.gte('starts_at', filters.starts_after);
    }

    if (filters.starts_before) {
      query = query.lte('starts_at', filters.starts_before);
    }

    const { data, error } = await query.order('starts_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to search rides: ${error.message}`);
    }

    return data;
  }

  async getRidesWithBookings() {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        bookings (
          id,
          rider_id,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get rides with bookings: ${error.message}`);
    }

    return data;
  }

  async cancelRide(id: string) {
    const { data, error } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel ride: ${error.message}`);
    }

    return data;
  }
}

export const rideService = new RideService();