
import { createClient } from '@supabase/supabase-js';
import { User, Student, Absence, Supervision, ControlRequest, DeliveryLog } from './types';

// بيانات المشروع الحقيقية
const supabaseUrl = 'https://upfavagxyuwnqmjgiibo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZmF2YWd4eXV3bnFtamdpaWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDQ0OTYsImV4cCI6MjA4MTk4MDQ5Nn0.AxsPO_Vw04aVuoa2KkFS_63OX1lz1yYthzBLLIkotuw';

export const supabase = createClient(supabaseUrl, supabaseKey);

const handleError = (error: any) => {
  if (error) {
    console.error("Supabase Trace:", error);
    throw new Error(error.message || error.details || JSON.stringify(error));
  }
};

export const db = {
  users: {
    getAll: async () => {
      const { data, error } = await supabase.from('users').select('*');
      handleError(error);
      return (data || []) as User[];
    },
    getById: async (nationalId: string) => {
      const { data, error } = await supabase.from('users').select('*').eq('national_id', nationalId).single();
      if (error && error.code !== 'PGRST116') handleError(error);
      return data as User;
    },
    upsert: async (users: any[]) => {
      const { error } = await supabase.from('users').upsert(users, { onConflict: 'national_id' });
      handleError(error);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      handleError(error);
    }
  },

  students: {
    getAll: async () => {
      const { data, error } = await supabase.from('students').select('*');
      handleError(error);
      return (data || []) as Student[];
    },
    upsert: async (students: any[]) => {
      const { error } = await supabase.from('students').upsert(students, { onConflict: 'national_id' });
      handleError(error);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      handleError(error);
    }
  },

  absences: {
    getAll: async () => {
      const { data, error } = await supabase.from('absences').select('*');
      handleError(error);
      return (data || []) as Absence[];
    },
    insert: async (absence: Partial<Absence>) => {
      const { error } = await supabase.from('absences').insert([absence]);
      handleError(error);
    },
    delete: async (studentId: string) => {
      const { error } = await supabase.from('absences').delete().eq('student_id', studentId);
      handleError(error);
    }
  },

  supervision: {
    getAll: async () => {
      const { data, error } = await supabase.from('supervision').select('*');
      handleError(error);
      return (data || []) as Supervision[];
    },
    upsert: async (sv: Partial<Supervision>) => {
      const { error } = await supabase.from('supervision').upsert([sv]);
      handleError(error);
    }
  },

  controlRequests: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('control_requests')
        .select('*')
        .order('created_at', { ascending: false });
      handleError(error);
      return (data || []).map((d: any) => ({
        id: d.id,
        from: d.from_user_name,
        committee: d.committee_number,
        text: d.text,
        time: d.time,
        status: d.status
      })) as ControlRequest[];
    },
    insert: async (req: Partial<ControlRequest>) => {
      const dbPayload = {
        from_user_name: req.from,
        committee_number: req.committee,
        text: req.text,
        time: req.time,
        status: req.status || 'PENDING'
      };
      const { error } = await supabase.from('control_requests').insert([dbPayload]);
      handleError(error);
    }
  },

  deliveryLogs: {
    getAll: async () => {
      const { data, error } = await supabase.from('delivery_logs').select('*');
      handleError(error);
      return (data || []) as DeliveryLog[];
    },
    insert: async (log: Partial<DeliveryLog>) => {
      const { error } = await supabase.from('delivery_logs').insert([log]);
      handleError(error);
    }
  },

  notifications: {
    broadcast: async (text: string, targetRole: string, sender: string) => {
      const { error } = await supabase.from('notifications').insert([{ text, target_role: targetRole, sender_name: sender }]);
      handleError(error);
    }
  }
};
