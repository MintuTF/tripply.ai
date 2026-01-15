import { createServerComponentClient } from '@/lib/db/supabase-server';
import { NextResponse } from 'next/server';
import type { Card } from '@/types';

interface BatchUpdateRequest {
  changes: Array<{
    id: string;
    updates: Partial<Card>;
  }>;
  trip_id: string;
  client_version?: Record<string, string>; // card_id → timestamp
}

interface BatchUpdateResponse {
  success: boolean;
  saved: string[];
  failed: Array<{ id: string; error: string }>;
  conflicts: Array<{
    id: string;
    client_version: string;
    server_version: string;
    server_data: Card;
  }>;
  server_versions: Record<string, string>;
}

// POST /api/cards/batch - Batch update multiple cards
export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchUpdateRequest = await request.json();
    const { changes, trip_id, client_version = {} } = body;

    // Validate input
    if (!Array.isArray(changes) || !trip_id) {
      return NextResponse.json(
        { error: 'Invalid request: changes array and trip_id required' },
        { status: 400 }
      );
    }

    // Verify user has permission to edit trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id, shared_links(role, user_id)')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or has editor role
    const isOwner = trip.user_id === user.id;
    const isEditor = Array.isArray(trip.shared_links) && trip.shared_links.some(
      (link: any) => link.user_id === user.id && link.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to edit this trip' },
        { status: 403 }
      );
    }

    const saved: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    const conflicts: Array<{
      id: string;
      client_version: string;
      server_version: string;
      server_data: Card;
    }> = [];
    const server_versions: Record<string, string> = {};

    // Process each change
    for (const change of changes) {
      try {
        const { id, updates } = change;

        // Validate card ID
        if (!id || typeof id !== 'string') {
          failed.push({ id: id || 'unknown', error: 'Invalid card ID' });
          continue;
        }

        // Fetch current server version for conflict detection
        const { data: currentCard, error: fetchError } = await supabase
          .from('cards')
          .select('updated_at, trip_id')
          .eq('id', id)
          .single();

        if (fetchError || !currentCard) {
          failed.push({ id, error: 'Card not found' });
          continue;
        }

        // Verify card belongs to the trip
        if (currentCard.trip_id !== trip_id) {
          failed.push({ id, error: 'Card does not belong to this trip' });
          continue;
        }

        // Check for conflicts if client version is provided
        if (client_version[id]) {
          const clientTime = new Date(client_version[id]);
          const serverTime = new Date(currentCard.updated_at);

          if (serverTime > clientTime) {
            // Conflict detected - server was modified after client's last known version
            const { data: serverData } = await supabase
              .from('cards')
              .select('*')
              .eq('id', id)
              .single();

            if (serverData) {
              conflicts.push({
                id,
                client_version: client_version[id],
                server_version: currentCard.updated_at,
                server_data: serverData,
              });
              continue; // Skip this update due to conflict
            }
          }
        }

        // Perform update
        const { data, error: updateError } = await supabase
          .from('cards')
          .update(updates)
          .eq('id', id)
          .select('updated_at')
          .single();

        if (updateError) {
          failed.push({ id, error: updateError.message });
          continue;
        }

        saved.push(id);
        server_versions[id] = data.updated_at;
      } catch (error: any) {
        failed.push({
          id: change.id || 'unknown',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Recalculate travel info if order or day changed
    const hasOrderChanges = changes.some(
      (c) => 'order' in c.updates || 'day' in c.updates
    );

    if (hasOrderChanges && saved.length > 0) {
      // Note: Travel info recalculation will be implemented separately
      // For now, we'll let the client handle it optimistically
      console.log('Travel info recalculation needed for trip:', trip_id);
    }

    const response: BatchUpdateResponse = {
      success: failed.length === 0 && conflicts.length === 0,
      saved,
      failed,
      conflicts,
      server_versions,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Batch update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to batch update cards' },
      { status: 500 }
    );
  }
}
