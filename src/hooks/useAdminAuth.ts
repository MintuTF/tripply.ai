'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const supabase = createClient();

        // Select all columns to avoid error if 'role' column doesn't exist
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Admin check error:', error.message || 'Unknown error');
          setIsAdmin(false);
        } else if (data) {
          // Check if role column exists in the returned data
          if ('role' in data) {
            setIsAdmin(data.role === 'admin');
          } else {
            console.warn('Role column not found. Run migration: src/lib/db/migrations/001_admin_schema.sql');
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  return {
    isAdmin,
    loading: authLoading || checking,
    user,
  };
}
