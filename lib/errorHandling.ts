import i18n from './i18n';

interface SupabaseError {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}

export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) {
    return i18n.t('parent_home.code_generation_errors.generic_error');
  }

  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code;
  const errorDetails = supabaseError.details;

  if (errorCode === 'PGRST301' || errorCode === '42501') {
    return i18n.t('parent_home.code_generation_errors.unauthorized');
  }

  if (errorCode === 'P0001') {
    if (errorDetails && errorDetails.includes('not found')) {
      return i18n.t('parent_home.code_generation_errors.child_not_found');
    }
    if (errorDetails && errorDetails.includes('unique code')) {
      return i18n.t('parent_home.code_generation_errors.system_busy');
    }
    return i18n.t('parent_home.code_generation_errors.generic_error');
  }

  return i18n.t('parent_home.code_generation_errors.generic_error');
}
