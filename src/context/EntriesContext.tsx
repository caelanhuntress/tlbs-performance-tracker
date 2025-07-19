import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Entry {
  id?: string;
  user_id?: string;
  date: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

interface EntriesContextType {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEntry: (id: string, entry: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  loading: boolean;
}

const EntriesContext = createContext<EntriesContextType | undefined>(undefined);

export const EntriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load entries from Supabase
  useEffect(() => {
    if (user) {
      loadEntries();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: Omit<Entry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('entries')
        .insert([
          {
            ...entry,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding entry:', error);
        return;
      }

      setEntries(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const updateEntry = async (id: string, entry: Partial<Entry>) => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .update(entry)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating entry:', error);
        return;
      }

      setEntries(prev => prev.map(e => e.id === id ? data : e));
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting entry:', error);
        return;
      }

      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  return (
    <EntriesContext.Provider value={{
      entries,
      addEntry,
      updateEntry,
      deleteEntry,
      loading
    }}>
      {children}
    </EntriesContext.Provider>
  );
};

export const useEntries = () => {
  const context = useContext(EntriesContext);
  if (context === undefined) {
    throw new Error('useEntries must be used within an EntriesProvider');
  }
  return context;
};