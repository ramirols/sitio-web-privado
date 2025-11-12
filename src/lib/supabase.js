import { createClient } from "@supabase/supabase-js"

const supabseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabseUrl, supabaseAnonKey)