#!/bin/bash

# Imposta la password del database come variabile d'ambiente
export SUPABASE_DB_PASSWORD="zhWLEgSjC4ymQQQ7"

# Esegue il dump dello schema del database e lo salva in supabase/schema.sql
# Inclusi solo gli oggetti dello schema 'public'.
supabase db dump --schema public --file supabase/schema.sql

# Messaggio di conferma.
if [ $? -eq 0 ]; then
  echo "✅ Il dump del database è stato completato con successo in supabase/schema.sql"
else
  echo "❌ Errore durante l'esecuzione del dump del database."
fi

# Rimuove la variabile d'ambiente dalla sessione corrente per motivi di sicurezza
unset SUPABASE_DB_PASSWORD