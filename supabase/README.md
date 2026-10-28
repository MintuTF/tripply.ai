# Supabase setup

Tripply works without Supabase (visitors are guests and their data stays in their browser). Supabase adds
accounts, saved trips, share links, and a shared cache that stops repeat AI/YouTube work.

## 1. Create the database (5 minutes)

1. Create a project at https://supabase.com (pick the region closest to your Vercel region, `iad1` = US East).
2. **SQL Editor → New query**, paste the whole of [`setup.sql`](./setup.sql), **Run**. It is meant for a new, empty project and is run once.
3. Check **Table Editor**: you should see `users, trips, cards, messages, comments, share_links, trip_invitations, chat_conversations, saved_places, products, feedback, city_videos, city_video_items, video_insights, ...`.

`setup.sql` is generated from `src/lib/db/migrations/*.sql`. To change the schema later, add a new numbered migration there,
add it to the list in `scripts/build-supabase-setup.mjs`, run `node scripts/build-supabase-setup.mjs`, and run only the new file in the SQL editor.

## 2. Authentication

**Authentication → URL Configuration**
- Site URL: `https://YOUR-DOMAIN`
- Redirect URLs: `https://YOUR-DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`

**Authentication → Providers**
- Email: on (the app signs people in with a magic link).
- Google (optional): create an OAuth client in Google Cloud (type "Web application"), add the redirect URI
  `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`, then paste the client ID and secret into Supabase.

**Email delivery:** Supabase's built-in sender is limited to a few emails an hour, which is not enough for real users.
Under **Authentication → SMTP Settings** use your own SMTP (Resend works: host `smtp.resend.com`, user `resend`, password = your Resend API key).

## 3. Environment variables

**Project Settings → API**, then add to Vercel (and `.env.local` for local work):

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key. **Secret.** Server only, never prefix with `NEXT_PUBLIC_` |

## 4. Make yourself an admin

Sign in once on the site, then in the SQL editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

(Nobody can promote themselves from the app: a database trigger blocks role changes from signed-in users.)

## 5. What to try after deploying

1. Sign in with a magic link. A row appears in `users`.
2. Create a trip, add places, confirm some on the Board. Rows appear in `trips` and `cards`.
3. Share the trip and open the link in a private window: it loads read-only.
4. Open a video page twice. The second time `video_insights` already has the row (no second AI call).

## What was fixed in the original schema (migration 011)

Found by running every migration on a clean Postgres and testing each policy as different users:

- **The original policies could not run at all.** Reading or saving trips failed with `infinite recursion detected in policy`
  (the `trips`, `share_links` and `users` policies referenced each other / themselves).
- **Private trips leaked.** As written, any trip with one share link was readable by every user, and any trip with an editor link was editable by every user.
- **Anyone could make themselves admin** by updating their own `users.role`.

All three are fixed and covered by checks. Shared links are now served by the server after validating the token, and are read-only.

## Known limits

- Editing or commenting through a share link is not supported yet (the link is read-only).
- The in-memory rate limiter is per server instance. Put it on Redis (for example Upstash) before heavy traffic.
- `GRANT ALL ... TO anon` from the first migration is still in place. Row level security is the protection, so do not disable it on any table.
