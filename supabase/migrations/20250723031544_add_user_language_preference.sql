-- Migration per aggiungere il supporto linguistico
-- File: supabase/migrations/20240101000000_add_user_language_preference.sql

-- Aggiungi campo preferred_language alla tabella users
ALTER TABLE public.users 
ADD COLUMN preferred_language text DEFAULT 'en' NOT NULL 
CHECK (preferred_language IN ('en', 'it'));

-- Aggiungi commento per documentazione
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language for UI (en = English, it = Italian)';

-- Aggiorna la tabella esistente per avere il default
UPDATE public.users 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;