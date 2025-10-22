import { supabase, supabaseService } from '../config/supabase.js';

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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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
    // Map frontend payload to database column names
    const mappedData = {
      ...rideData,
      // Map existing fields to database columns
      starts_at: rideData.startsAt,
      meetup_location: rideData.meetupLocation,
      experience_level: rideData.experienceLevel,
      max_riders: rideData.maxRiders,
      route_summary: rideData.routeSummary,
      // Map new trip fields to database columns
      name: rideData.name,
      date_iso: rideData.dateISO,
      meetup_iso: rideData.meetupISO,
      meet_location: rideData.meetLocation,
      distance: rideData.distance,
      gear_callout: rideData.gearCallout,
      comm_signals: rideData.commSignals,
      safety_checks: rideData.safetyChecks,
    };

    // Remove frontend field names to avoid conflicts
    delete mappedData.startsAt;
    delete mappedData.meetupLocation;
    delete mappedData.experienceLevel;
    delete mappedData.maxRiders;
    delete mappedData.routeSummary;
    delete mappedData.dateISO;
    delete mappedData.meetupISO;
    delete mappedData.meetLocation;
    delete mappedData.gearCallout;
    delete mappedData.commSignals;
    delete mappedData.safetyChecks;

    const { data, error } = await supabaseService
      .from('rides')
      .insert(mappedData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ride: ${error.message}`);
    }

    return data;
  }

  async updateRide(id: string, updateData: any) {
    // Map frontend payload to database column names
    const mappedData = {
      ...updateData,
      // Map existing fields to database columns
      starts_at: updateData.startsAt,
      meetup_location: updateData.meetupLocation,
      experience_level: updateData.experienceLevel,
      max_riders: updateData.maxRiders,
      route_summary: updateData.routeSummary,
      // Map new trip fields to database columns
      name: updateData.name,
      date_iso: updateData.dateISO,
      meetup_iso: updateData.meetupISO,
      meet_location: updateData.meetLocation,
      distance: updateData.distance,
      gear_callout: updateData.gearCallout,
      comm_signals: updateData.commSignals,
      safety_checks: updateData.safetyChecks,
    };

    // Remove frontend field names to avoid conflicts
    delete mappedData.startsAt;
    delete mappedData.meetupLocation;
    delete mappedData.experienceLevel;
    delete mappedData.maxRiders;
    delete mappedData.routeSummary;
    delete mappedData.dateISO;
    delete mappedData.meetupISO;
    delete mappedData.meetLocation;
    delete mappedData.gearCallout;
    delete mappedData.commSignals;
    delete mappedData.safetyChecks;

    const { data, error } = await supabaseService
      .from('rides')
      .update(mappedData)
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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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
    const { data, error } = await supabaseService
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