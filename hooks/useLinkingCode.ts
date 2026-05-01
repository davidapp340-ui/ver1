import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { getUserFriendlyErrorMessage } from '@/lib/errorHandling';

type Child = Database['public']['Tables']['children']['Row'];

interface LinkingCodeResult {
  success: boolean;
  child: Child | null;
  error: string | null;
}

export function useLinkingCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = async (child: Child): Promise<LinkingCodeResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('generate_linking_code', {
        child_id_param: child.id,
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        const errorMessage = getUserFriendlyErrorMessage(rpcError);
        setError(errorMessage);
        return { success: false, child: null, error: errorMessage };
      }

      if (!data || !data.success) {
        console.error('RPC returned unsuccessful response:', data);
        const errorMessage = getUserFriendlyErrorMessage(null);
        setError(errorMessage);
        return { success: false, child: null, error: errorMessage };
      }

      const updatedChild: Child = {
        ...child,
        linking_code: data.code,
        linking_code_expires_at: data.expires_at,
      };

      return { success: true, child: updatedChild, error: null };
    } catch (err: any) {
      console.error('Unexpected error generating code:', err);
      const errorMessage = getUserFriendlyErrorMessage(err);
      setError(errorMessage);
      return { success: false, child: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { generateCode, loading, error };
}
