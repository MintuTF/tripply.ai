import { createServerComponentClient } from '@/lib/db/supabase';
import { NextResponse } from 'next/server';

// POST /api/cards/[id]/reactions - Add/remove a reaction to a comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { comment_id, emoji } = await request.json();

    if (!comment_id || !emoji) {
      return NextResponse.json(
        { error: 'Comment ID and emoji are required' },
        { status: 400 }
      );
    }

    // Get current comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('reactions')
      .eq('id', comment_id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Update reactions
    const reactions = comment.reactions || {};
    const userIds = reactions[emoji] || [];
    const hasReacted = userIds.includes(user.id);

    if (hasReacted) {
      // Remove reaction
      reactions[emoji] = userIds.filter((id: string) => id !== user.id);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...userIds, user.id];
    }

    // Update comment
    const { error: updateError } = await supabase
      .from('comments')
      .update({ reactions })
      .eq('id', comment_id);

    if (updateError) {
      console.error('Error updating reactions:', updateError);
      return NextResponse.json(
        { error: 'Failed to update reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reactions,
      action: hasReacted ? 'removed' : 'added',
    });
  } catch (error) {
    console.error('Error in POST reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
