# Launch checklist

Things only you can do (they need your accounts). Everything else is already in the code.

## Must do
- [ ] **Rotate the API keys that were pasted in chat** (OpenAI, Google, YouTube). Put the new ones in Vercel env vars. Anything pasted into a chat should be treated as exposed.
- [ ] **Supabase**: follow [`supabase/README.md`](./supabase/README.md) (run `setup.sql`, auth URLs, env vars, make yourself admin).
- [ ] **Vercel env vars**: everything in [`.env.example`](./.env.example) marked required, plus the Supabase ones.
- [ ] **Google Places key**: restrict it to the APIs it needs (Places API, Geocoding API). It is used server-side only, so use an API restriction, not a website restriction.
- [ ] **Email**: set `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL`, and verify your sending domain in Resend. The contact page shows contact addresses at `@voyagr.app`; change them if that is not your domain.

## Before real traffic
- [ ] Switch the PDF/map tiles and routing to a paid provider (`NEXT_PUBLIC_MAP_TILE_URL`, `NEXT_PUBLIC_ROUTING_URL`). The free OpenStreetMap servers are for light use only.
- [ ] Move the rate limiter to Redis (it is per-instance memory today).
- [ ] YouTube quota is 10,000 units a day and one search costs 100. Request a quota increase once you have traffic.
- [ ] Amazon Associates: confirm the account is approved and the tag (`trippiy-20`) is yours. The shop has only 9 products; import more through the admin portal or `public/templates/products-template.csv`.

## Known gaps
- Share links are read-only (no editing or comments through a link yet).
- Videos with no captions give thin results; the app says so on the page.
- TypeScript errors that existed before this work are still reported by `tsc` (the build ignores them): see `TYPESCRIPT_TODO.md`.
