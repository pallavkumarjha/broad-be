import { supabase } from '../config/supabase.js';

export class GarageService {
  async getGarageById(id: string) {
    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get garage: ${error.message}`);
    }

    return data;
  }

  async getGaragesByOwner(ownerId: string) {
    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get garages: ${error.message}`);
    }

    return data;
  }

  async createGarage(garageData: any) {
    const { data, error } = await supabase
      .from('garages')
      .insert(garageData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create garage: ${error.message}`);
    }

    return data;
  }

  async updateGarage(id: string, updateData: any) {
    const { data, error } = await supabase
      .from('garages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update garage: ${error.message}`);
    }

    return data;
  }

  async deleteGarage(id: string) {
    const { error } = await supabase
      .from('garages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete garage: ${error.message}`);
    }

    return true;
  }
}

export class MotorcycleService {
  async getMotorcycleById(id: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw new Error(`Failed to get motorcycle: ${error.message}`);
    }

    return data;
  }

  async getMotorcyclesByGarage(garageId: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('garage_id', garageId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get motorcycles: ${error.message}`);
    }

    return data;
  }

  async createMotorcycle(motorcycleData: any) {
    const { data, error } = await supabase
      .from('motorcycles')
      .insert(motorcycleData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create motorcycle: ${error.message}`);
    }

    return data;
  }

  async updateMotorcycle(id: string, updateData: any) {
    const { data, error } = await supabase
      .from('motorcycles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update motorcycle: ${error.message}`);
    }

    return data;
  }

  async updateOdometer(id: string, odometerKm: number) {
    const { data, error } = await supabase
      .from('motorcycles')
      .update({ odometer_km: odometerKm })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update odometer: ${error.message}`);
    }

    return data;
  }

  async softDeleteMotorcycle(id: string) {
    const { data, error } = await supabase
      .from('motorcycles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete motorcycle: ${error.message}`);
    }

    return data;
  }
}

export const garageService = new GarageService();
export const motorcycleService = new MotorcycleService();