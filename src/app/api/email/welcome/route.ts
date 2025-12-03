import { NextResponse } from 'next/server';
import { resend } from '@/lib/email/resend';
import { getWelcomeEmailHtml, getWelcomeEmailText } from '@/lib/email/templates/welcome';

export async function POST(request: Request) {
  try {
    const { email, name, appUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping welcome email');
      return NextResponse.json({ success: false, message: 'Email service not configured' });
    }

    const fromEmail = process.env.EMAIL_FROM || 'Voyagr <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to Tripply - Your Journey Starts Now!',
      html: getWelcomeEmailHtml(name, appUrl),
      text: getWelcomeEmailText(name, appUrl),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Welcome email sent successfully:', data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
