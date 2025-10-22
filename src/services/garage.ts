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

  async getWorkspaceNotes(garageId: string): Promise<string> {
    const { data, error } = await supabase
      .from('garages')
      .select('workspace_notes')
      .eq('id', garageId)
      .single();

    if (error) {
      throw new Error(`Failed to get workspace notes: ${error.message}`);
    }

    return (data as any)?.workspace_notes ?? '';
  }

  async updateWorkspaceNotes(garageId: string, notes: string): Promise<string> {
    const { data, error } = await supabase
      .from('garages')
      .update({ workspace_notes: notes })
      .eq('id', garageId)
      .select('workspace_notes')
      .single();

    if (error) {
      throw new Error(`Failed to update workspace notes: ${error.message}`);
    }

    return (data as any)?.workspace_notes ?? '';
  }

  async setPrimaryBike(garageId: string, motorcycleId: string | null) {
    const { data, error } = await supabase
      .from('garages')
      .update({ primary_bike_id: motorcycleId })
      .eq('id', garageId)
      .select('*')
      .single();

    if (error) throw new Error(`Failed to set primary bike: ${error.message}`);
    return data;
  }

  async setBackupBike(garageId: string, motorcycleId: string | null) {
    const { data, error } = await supabase
      .from('garages')
      .update({ backup_bike_id: motorcycleId })
      .eq('id', garageId)
      .select('*')
      .single();

    if (error) throw new Error(`Failed to set backup bike: ${error.message}`);
    return data;
  }

  // Tasks
  async getTasks(garageId: string) {
    const { data, error } = await supabase
      .from('garage_tasks')
      .select('*')
      .eq('garage_id', garageId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get tasks: ${error.message}`);
    return data ?? [];
  }

  async createTask(garageId: string, label: string) {
    const { data, error } = await supabase
      .from('garage_tasks')
      .insert({ garage_id: garageId, label })
      .select('*')
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);
    return data;
  }

  async updateTask(id: string, label: string) {
    const { data, error } = await supabase
      .from('garage_tasks')
      .update({ label })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Failed to update task: ${error.message}`);
    return data;
  }

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('garage_tasks')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete task: ${error.message}`);
    return true;
  }

  // Documents
  async getDocuments(garageId: string) {
    const { data, error } = await supabase
      .from('garage_documents')
      .select('*')
      .eq('garage_id', garageId)
      .order('updated_on', { ascending: false });
    if (error) throw new Error(`Failed to get documents: ${error.message}`);
    return data ?? [];
  }

  async createDocument(garageId: string, payload: any) {
    const doc = {
      garage_id: garageId,
      title: payload?.title ?? '',
      status: payload?.status ?? 'unknown',
      updated_on: payload?.updatedOn ?? payload?.updated_on ?? new Date().toISOString().slice(0, 10),
      expires_on: payload?.expiryDate ?? payload?.expiresOn ?? null,
      storage: payload?.storage ?? 'local',
    };
    const { data, error } = await supabase
      .from('garage_documents')
      .insert(doc)
      .select('*')
      .single();
    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return data;
  }

  async updateDocument(id: string, payload: any) {
    const update = {
      title: payload?.title,
      status: payload?.status,
      updated_on: payload?.updatedOn ?? payload?.updated_on,
      expires_on: payload?.expiryDate ?? payload?.expiresOn,
      storage: payload?.storage,
    };
    const { data, error } = await supabase
      .from('garage_documents')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return data;
  }

  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('garage_documents')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete document: ${error.message}`);
    return true;
  }

  // Dashboard aggregation
  async getDashboard(garageId: string) {
    const [{ data: garage, error: gErr }, { data: bikes, error: mErr }] = await Promise.all([
      supabase.from('garages').select('*').eq('id', garageId).single(),
      supabase.from('motorcycles').select('*').eq('garage_id', garageId).is('deleted_at', null).order('created_at', { ascending: false }),
    ]);

    if (gErr) throw new Error(`Failed to load garage: ${gErr.message}`);
    if (mErr) throw new Error(`Failed to load motorcycles: ${mErr.message}`);

    const primaryId = (garage as any)?.primary_bike_id as string | null;

    // Maintenance logs for primary bike (recent first)
    let serviceHistory: any[] = [];
    if (primaryId) {
      const { data: logs, error: lErr } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('motorcycle_id', primaryId)
        .order('performed_at', { ascending: false })
        .limit(20);
      if (lErr) throw new Error(`Failed to load service history: ${lErr.message}`);
      serviceHistory = (logs ?? []).map((l: any) => ({
        id: l.id,
        title: l.title,
        date: l.performed_at,
        summary: l.summary,
      }));
    }

    const [tasks, documents] = await Promise.all([
      this.getTasks(garageId),
      this.getDocuments(garageId),
    ]);

    return {
      garageId,
      primaryBikeId: primaryId,
      backupBikeId: (garage as any)?.backup_bike_id ?? null,
      workspaceNotes: (garage as any)?.workspace_notes ?? '',
      motorcycles: bikes ?? [],
      serviceHistory,
      upcomingTasks: (tasks ?? []).map((t: any) => ({ id: t.id, label: t.label })),
      documents: (documents ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        updatedOn: d.updated_on,
        expiryDate: d.expires_on,
        storage: d.storage,
      })),
    };
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