import { createServerComponentClient } from './supabase-server';
import type { Trip, Card, Message, User, ChatConversation, ChatMode } from '@/types';

/**
 * Database query functions
 * All queries respect Row Level Security (RLS) policies
 */

// ==================== USERS ====================

export async function getUser(userId: string): Promise<User | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, any>
): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('users')
    .update({ prefs_json: preferences })
    .eq('id', userId);

  if (error) {
    console.error('Error updating preferences:', error);
    return false;
  }

  return true;
}

// ==================== TRIPS ====================

export async function getUserTrips(userId: string): Promise<Trip[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trips:', error);
    return [];
  }

  return data || [];
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return null;
  }

  return data;
}

export async function createTrip(trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single();

  if (error) {
    console.error('Error creating trip:', error);
    return null;
  }

  return data;
}

export async function updateTrip(tripId: string, updates: Partial<Trip>): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId);

  if (error) {
    console.error('Error updating trip:', error);
    return false;
  }

  return true;
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error('Error deleting trip:', error);
    return false;
  }

  return true;
}

// ==================== MESSAGES ====================

export async function getTripMessages(tripId: string): Promise<Message[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

export async function createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return null;
  }

  return data;
}

// ==================== CARDS ====================

export async function getTripCards(tripId: string): Promise<Card[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cards:', error);
    return [];
  }

  return data || [];
}

export async function createCard(card: Omit<Card, 'id' | 'created_at' | 'updated_at'>): Promise<Card | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('cards')
    .insert(card)
    .select()
    .single();

  if (error) {
    console.error('Error creating card:', error);
    return null;
  }

  return data;
}

export async function updateCard(cardId: string, updates: Partial<Card>): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', cardId);

  if (error) {
    console.error('Error updating card:', error);
    return false;
  }

  return true;
}

export async function toggleCardFavorite(cardId: string, favorite: boolean): Promise<boolean> {
  return updateCard(cardId, { favorite });
}

export async function deleteCard(cardId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting card:', error);
    return false;
  }

  return true;
}

// ==================== SHARE LINKS ====================

export async function createShareLink(
  tripId: string,
  role: 'viewer' | 'commenter' | 'editor',
  expiresAt?: string
): Promise<{ token: string } | null> {
  const supabase = await createServerComponentClient();

  // Generate a random token
  const token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('share_links')
    .insert({
      trip_id: tripId,
      token,
      role,
      expires_at: expiresAt,
    })
    .select('token')
    .single();

  if (error) {
    console.error('Error creating share link:', error);
    return null;
  }

  return data;
}

export async function getShareLink(token: string) {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    console.error('Error fetching share link:', error);
    return null;
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data;
}

export async function getTripShareLinks(tripId: string) {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('trip_id', tripId);

  if (error) {
    console.error('Error fetching share links:', error);
    return [];
  }

  return data || [];
}

export async function deleteShareLink(linkId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Error deleting share link:', error);
    return false;
  }

  return true;
}

// ==================== WELCOME EMAIL ====================

/**
 * Check if welcome email was already sent to a user
 * Returns true if email was sent (fail-safe: returns true on error to prevent duplicates)
 */
export async function hasWelcomeEmailBeenSent(userId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('users')
    .select('welcome_email_sent_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking welcome email status:', error);
    return true; // Fail safe: assume sent to prevent duplicates
  }

  return data?.welcome_email_sent_at !== null;
}

/**
 * Mark welcome email as sent for a user
 * Uses atomic update to prevent race conditions (only updates if welcome_email_sent_at is still null)
 */
export async function markWelcomeEmailSent(userId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('users')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', userId)
    .is('welcome_email_sent_at', null); // Atomic: only succeeds if still null

  if (error) {
    console.error('Error marking welcome email sent:', error);
    return false;
  }

  return true;
}

// ==================== CHAT CONVERSATIONS ====================

const MAX_CONVERSATIONS = 5;

/**
 * Get user's conversations (max 5, ordered by most recent)
 */
export async function getConversations(userId: string): Promise<ChatConversation[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      messages:messages(count)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(MAX_CONVERSATIONS);

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Add message count and get last message preview
  const conversationsWithMeta = await Promise.all(
    (data || []).map(async (conv) => {
      // Get last message for preview
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('text')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...conv,
        message_count: conv.messages?.[0]?.count || 0,
        last_message_preview: lastMsg?.text?.slice(0, 100) || '',
      };
    })
  );

  return conversationsWithMeta;
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<ChatConversation | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data;
}

/**
 * Get conversation by destination for a user (for auto-resume)
 */
export async function getConversationByDestination(
  userId: string,
  destination: string
): Promise<ChatConversation | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('destination', destination)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is expected
    console.error('Error fetching conversation by destination:', error);
  }

  return data || null;
}

/**
 * Create a new conversation (enforces max 5 limit via DB trigger)
 */
export async function createConversation(
  userId: string,
  destination: string,
  mode: ChatMode,
  tripId?: string
): Promise<ChatConversation | null> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: userId,
      trip_id: tripId,
      destination,
      chat_mode: mode,
      title: `Chat about ${destination}`,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}

/**
 * Update conversation (title, mode, etc.)
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Pick<ChatConversation, 'title' | 'chat_mode'>>
): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('chat_conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation (cascades to messages)
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: Omit<Message, 'id' | 'created_at' | 'conversation_id'>
): Promise<Message | null> {
  const supabase = await createServerComponentClient();

  // Insert message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ...message,
      conversation_id: conversationId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding message to conversation:', error);
    return null;
  }

  // Update conversation's updated_at and title if first user message
  if (message.role === 'user') {
    await supabase
      .from('chat_conversations')
      .update({
        updated_at: new Date().toISOString(),
        title: message.text.slice(0, 50) + (message.text.length > 50 ? '...' : ''),
      })
      .eq('id', conversationId);
  } else {
    // Just update timestamp for assistant messages
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  return data;
}

/**
 * Touch conversation (update timestamp without changing content)
 */
export async function touchConversation(conversationId: string): Promise<boolean> {
  const supabase = await createServerComponentClient();

  const { error } = await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Error touching conversation:', error);
    return false;
  }

  return true;
}
