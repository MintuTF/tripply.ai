import { createServerComponentClient } from '@/lib/db/supabase-server';
import { createShareLink, getTrip } from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { resend } from '@/lib/email/resend';
import { getInvitationEmailHtml, getInvitationEmailText } from '@/lib/email/templates/invitation';

// POST /api/trips/[id]/invite - Send email invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the trip
    const trip = await getTrip(tripId);
    if (!trip || trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const { email, role = 'viewer' } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Validate role
    if (!['viewer', 'commenter', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Create a share link for this invitation
    const shareLink = await createShareLink(tripId, role);
    if (!shareLink) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Store invitation in database (optional - for tracking)
    const { error: inviteError } = await supabase.from('trip_invitations').insert({
      trip_id: tripId,
      email,
      role,
      share_token: shareLink.token,
      invited_by: user.id,
      status: 'pending',
    });

    // Note: If the invitations table doesn't exist, we'll still proceed with sending the email
    if (inviteError) {
      console.warn('Failed to store invitation record:', inviteError);
    }

    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/shared/${shareLink.token}`;

    // Send email invitation using Resend
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.EMAIL_FROM || 'Voyagr <onboarding@resend.dev>';

      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `You're invited to view "${trip.title}" on Voyagr`,
          html: getInvitationEmailHtml({
            inviterEmail: user.email || 'A Voyagr user',
            tripTitle: trip.title,
            role,
            inviteUrl,
          }),
          text: getInvitationEmailText({
            inviterEmail: user.email || 'A Voyagr user',
            tripTitle: trip.title,
            role,
            inviteUrl,
          }),
        });

        if (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Continue anyway - the share link was created successfully
        } else {
          console.log('Invitation email sent successfully:', emailData?.id);
        }
      } catch (emailErr) {
        console.error('Error sending invitation email:', emailErr);
        // Continue anyway - the share link was created successfully
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      console.log('Invitation created (email not sent):', {
        to: email,
        tripTitle: trip.title,
        inviteUrl,
        role,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Invitation sent',
        invitation: {
          email,
          role,
          inviteUrl,
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
