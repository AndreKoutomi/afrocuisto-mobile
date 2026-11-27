-- ==============================================================================
-- Migration 09 : Vérification d'existence de compte avant Reset Password OTP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_account_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(coalesce(p_email, '')));
  IF v_clean_email = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = v_clean_email
      AND deleted_at IS NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_account_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_account_exists(TEXT) TO anon, authenticated;
