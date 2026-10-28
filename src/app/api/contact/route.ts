import { NextResponse } from 'next/server';
import { resend } from '@/lib/email/resend';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field. Pretend success so they don't retry.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || name.length > 100) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (message.length < 5 || message.length > 4000) {
    return NextResponse.json({ error: 'Please enter a message (5 to 4000 characters).' }, { status: 400 });
  }

  const to = process.env.CONTACT_EMAIL;
  if (!process.env.RESEND_API_KEY || !to) {
    console.error('[Contact] RESEND_API_KEY or CONTACT_EMAIL is not configured');
    return NextResponse.json({ error: 'The contact form is temporarily unavailable.' }, { status: 503 });
  }

  // Only valid, deliverable messages count toward the limit (typos shouldn't lock people out)
  const limit = checkRateLimit(`contact:${getClientIP(request)}`, { windowMs: 10 * 60 * 1000, maxRequests: 3 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Tripply <onboarding@resend.dev>',
    to,
    replyTo: email,
    subject: `[Tripply contact] ${name.replace(/[\r\n]+/g, ' ')}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (error) {
    console.error('[Contact] Failed to send:', error);
    return NextResponse.json({ error: 'We could not send your message. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
