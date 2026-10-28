import { createBrowserClient } from '@supabase/ssr';

let warned = false;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Placeholder client so the app renders without Supabase; auth/db calls will fail gracefully
    if (!warned) {
      warned = true;
      console.warn('Supabase credentials not configured. Auth features will not work.');
    }
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createBrowserClient(url, key);
}
