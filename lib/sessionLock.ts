import { supabase } from '@/lib/supabase';

interface SessionLockResult {
  locked: boolean;
  device_id?: string;
}

export async function checkProfileSessionLock(userId: string): Promise<SessionLockResult> {
  const { data, error } = await supabase.rpc('check_session_lock_profile', {
    p_user_id: userId,
  });

  if (error) {
    return { locked: false };
  }

  return data as SessionLockResult;
}

export async function checkChildSessionLock(childId: string): Promise<SessionLockResult> {
  const { data, error } = await supabase.rpc('check_session_lock_child', {
    p_child_id: childId,
  });

  if (error) {
    return { locked: false };
  }

  return data as SessionLockResult;
}
