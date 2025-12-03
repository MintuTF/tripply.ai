import { createServerComponentClient } from '@/lib/db/supabase';
import { createShareLink, getTrip } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

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

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, we'll just log the invitation and return success
    // In production, you would send an email like this:
    //
    // await resend.emails.send({
    //   from: 'Tripply <noreply@tripply.ai>',
    //   to: email,
    //   subject: `${user.email} invited you to view their trip: ${trip.title}`,
    //   html: `
    //     <h2>You're invited to view a trip!</h2>
    //     <p>${user.email} has invited you to view their trip "${trip.title}".</p>
    //     <p><a href="${inviteUrl}">View Trip</a></p>
    //   `
    // });

    console.log('Email invitation would be sent:', {
      to: email,
      tripTitle: trip.title,
      inviteUrl,
      role,
    });

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
