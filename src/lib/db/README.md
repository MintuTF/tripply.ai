# Database Setup Guide

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin operations)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Running Migrations

### Option 1: Supabase Dashboard (Quick Start)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI (Recommended for Development)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

## Database Schema

### Tables

#### `users`
Extends Supabase auth.users with additional profile data and preferences.
- `id` - UUID (references auth.users)
- `email` - User email
- `name` - Display name
- `prefs_json` - User preferences (budget, cuisine, mobility, etc.)

#### `trips`
Main trip entity.
- `id` - UUID
- `user_id` - Owner
- `title` - Trip name
- `dates` - Start/end dates (JSON)
- `party_json` - Travel party details
- `budget_range` - Budget range per night
- `privacy` - 'private' or 'shared'

#### `messages`
Chat conversation history.
- `id` - UUID
- `trip_id` - Associated trip
- `role` - 'user', 'assistant', or 'system'
- `text` - Message content
- `tool_calls_json` - AI tool calls
- `citations_json` - Source citations

#### `cards`
Saved items (hotels, spots, food, activities, notes).
- `id` - UUID
- `trip_id` - Associated trip
- `type` - 'hotel', 'spot', 'food', 'activity', 'note'
- `payload_json` - Card-specific data
- `labels` - Array of labels
- `favorite` - Boolean
- `ranking` - Integer for ordering

#### `comments`
Collaboration comments on messages or cards.
- `id` - UUID
- `parent_type` - 'message' or 'card'
- `parent_id` - ID of parent entity
- `user_id` - Comment author
- `text` - Comment content

#### `reminders`
User reminders for price, weather, visa, etc.
- `id` - UUID
- `trip_id` - Associated trip
- `type` - 'price', 'weather', 'visa', 'itinerary'
- `config_json` - Reminder configuration
- `next_fire_at` - Next scheduled time
- `enabled` - Boolean

#### `audit_log`
Activity tracking for trips.
- `id` - UUID
- `trip_id` - Associated trip
- `event` - Event name
- `actor_id` - User who performed action
- `payload_json` - Event details

#### `share_links`
Shareable links for collaboration.
- `id` - UUID
- `trip_id` - Associated trip
- `token` - Unique share token
- `role` - 'viewer', 'commenter', 'editor'
- `expires_at` - Optional expiration

## Row Level Security (RLS)

All tables have RLS enabled with policies that:

1. **Users** can only see/update their own profile
2. **Trips** can be accessed by owner or via share links
3. **Messages, Cards, Comments** inherit trip access permissions
4. **Reminders, Audit Logs** are owner-only
5. **Share Links** can be managed by trip owner

## Query Functions

Use the helper functions in `queries.ts` for type-safe database operations:

```typescript
import { getTrip, createCard, toggleCardFavorite } from '@/lib/db/queries';

// Fetch a trip
const trip = await getTrip(tripId);

// Create a card
const card = await createCard({
  trip_id: tripId,
  type: 'hotel',
  payload_json: { name: 'Hotel Name', ... },
  labels: ['romantic'],
  favorite: false,
});

// Toggle favorite
await toggleCardFavorite(cardId, true);
```

## Testing

To test your database setup:

1. Create a test user via Supabase Auth
2. Insert a test trip via the dashboard or API
3. Verify RLS policies are working by trying to access another user's data

## Backup and Migrations

- Use Supabase CLI to generate migration files
- Version control all migration files in `migrations/`
- Test migrations in development before production deploy

## Performance Considerations

- Indexes are created on frequently queried columns
- Use connection pooling (Supabase handles this automatically)
- Cache frequently accessed data in Redis
- Monitor query performance in Supabase dashboard

## Next Steps

1. Run the initial migration
2. Set up authentication (see auth setup guide)
3. Test CRUD operations via API routes
