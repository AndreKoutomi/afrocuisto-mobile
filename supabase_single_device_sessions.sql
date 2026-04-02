-- ============================================================
-- SINGLE-DEVICE SESSION ENFORCEMENT
-- Table: user_active_sessions
-- Chaque utilisateur ne peut être actif que sur un seul appareil.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_active_sessions (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id   TEXT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on device_id for fast lookups during polling
CREATE INDEX IF NOT EXISTS idx_user_active_sessions_device_id
    ON public.user_active_sessions (device_id);

-- Row Level Security
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- Allow the user to read/write their own session row
CREATE POLICY "user_own_session_read" ON public.user_active_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_own_session_write" ON public.user_active_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_own_session_update" ON public.user_active_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_own_session_delete" ON public.user_active_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Grant access to the anon/authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_sessions
    TO anon, authenticated;
