import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvclnfbibkhlllmecfge.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Y2xuZmJpYmtobGxsbWVjZmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTg5MDAsImV4cCI6MjA4NjIzNDkwMH0.xufeoXaLVHi-fhhNoPpU4VfMGshhJ_3tzUIhQ8Zrgy0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
