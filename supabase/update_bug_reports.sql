-- Exécutez ce script dans la console SQL de Supabase
-- (Table Editor > SQL Editor > New Query) pour ajouter la colonne screenshot

ALTER TABLE public.bug_reports
ADD COLUMN screenshot TEXT;
