import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SERVICE_KEY!;

// create supabase client
export default createClient(supabaseUrl, supabaseAnonKey);