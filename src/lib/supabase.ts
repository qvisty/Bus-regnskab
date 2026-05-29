import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True i den statiske demo-build – så tvinges lokal tilstand uanset andet. */
export const isDemo = import.meta.env.VITE_DEMO === 'true'

/** True hvis Supabase er konfigureret via miljøvariabler (og ikke demo). */
export const hasSupabase = !isDemo && Boolean(url && anonKey)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string)
  : null
