// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qpavuiugtxcfwfspnazy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYXZ1aXVndHhjZndmc3BuYXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDQ1NDksImV4cCI6MjA2NzE4MDU0OX0.TlnCeqhy9G2NrSfn64P1pHCF9WtoQ8b7jVg0k1LH5AU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});