import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Time threshold for detecting new users (90 seconds)
const NEW_USER_THRESHOLD_MS = 90000;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this is a new user (account created within 90 seconds)
      // Works for both Magic Link and Google OAuth authentication
      const createdAt = data.user.created_at;
      const isNewUser = createdAt &&
        (new Date(createdAt).getTime() > Date.now() - NEW_USER_THRESHOLD_MS);

      if (isNewUser) {
        // Check database to ensure welcome email hasn't been sent
        const { data: userData } = await supabase
          .from('users')
          .select('welcome_email_sent_at')
          .eq('id', data.user.id)
          .single();

        // Only proceed if welcome email hasn't been sent yet
        if (!userData?.welcome_email_sent_at) {
          // Mark as sent FIRST to prevent race conditions
          // This atomic update only succeeds if welcome_email_sent_at is still null
          const { error: updateError } = await supabase
            .from('users')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', data.user.id)
            .is('welcome_email_sent_at', null);

          // Only send email if update succeeded (prevents duplicates in race conditions)
          if (!updateError) {
            fetch(`${origin}/api/email/welcome`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.user.email,
                name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
                appUrl: origin,
              }),
            }).catch((err) => console.error('Failed to send welcome email:', err));
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
