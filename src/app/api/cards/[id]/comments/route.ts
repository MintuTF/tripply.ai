import { createServerComponentClient } from '@/lib/db/supabase';
import { NextResponse } from 'next/server';

// GET /api/cards/[id]/comments - Get all comments for a card
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient();
    const { id: cardId } = await params;

    // Fetch comments with user info
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        reactions,
        created_at,
        user_id,
        users (
          name,
          email
        )
      `)
      .eq('parent_type', 'card')
      .eq('parent_id', cardId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ comments: [] });
    }

    // Transform to include user info
    const transformedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      user_id: comment.user_id,
      user_name: comment.users?.name || comment.users?.email?.split('@')[0] || 'User',
      text: comment.text,
      reactions: comment.reactions || {},
      created_at: comment.created_at,
    }));

    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    console.error('Error in GET comments:', error);
    return NextResponse.json({ comments: [] });
  }
}

// POST /api/cards/[id]/comments - Create a new comment
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

    const { id: cardId } = await params;
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        parent_type: 'card',
        parent_id: cardId,
        user_id: user.id,
        text: text.trim(),
        reactions: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    const transformedComment = {
      id: comment.id,
      user_id: comment.user_id,
      user_name: userData?.name || userData?.email?.split('@')[0] || 'User',
      text: comment.text,
      reactions: comment.reactions || {},
      created_at: comment.created_at,
    };

    return NextResponse.json({ comment: transformedComment });
  } catch (error) {
    console.error('Error in POST comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
