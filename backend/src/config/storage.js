const { createClient } = require("@supabase/supabase-js");

// Client Supabase côté serveur, avec la clé service_role qui a tous les droits
// sur le Storage — ne jamais envoyer cette clé au frontend.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabase;