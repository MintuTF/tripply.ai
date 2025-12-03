import { createServerComponentClient } from './supabase';
import type { Trip, Card, Message, User } from '@/types';

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
