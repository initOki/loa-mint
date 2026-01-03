import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://typjtuojliphdnlhtlui.supabase.co";
const supabaseKey = (import.meta as any).env.PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
