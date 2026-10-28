-- Security fixes found while preparing for production. Safe to run on a fresh project or on top of 001-010.
--
--  1. The "Admins can view all users" policy selected from `users` inside a policy ON `users`, which makes
--     Postgres fail with "infinite recursion detected in policy for relation users" on every read of that table.
--     Admin checks now go through a SECURITY DEFINER function that bypasses RLS.
--  2. Users could UPDATE their own row, including `role`, and make themselves admin. Role changes are now
--     only possible for admins, the service role, or direct SQL (no end-user session).
--  3. Trips, messages, cards and comments were readable by EVERY user as soon as the trip had one share link,
--     and editable by every user once it had an editor link. Access is now owner-only.
--     Shared links are served by the server (service role) after it validates the token.

-- ---------------------------------------------------------------------------
-- 1. Admin check without recursion
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Nobody can promote themselves to admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is NULL for the SQL editor and for the service role, so you can still set the first admin with:
  --   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_protect_role ON users;
CREATE TRIGGER users_protect_role
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();

-- ---------------------------------------------------------------------------
-- 3. Owner-only access to trips and everything inside them
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS trips_select_own ON trips;
CREATE POLICY trips_select_own ON trips FOR SELECT USING (auth.uid() = user_id);

-- messages_select (as redefined in 007): trip owner, or the owner of the chat conversation
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  OR conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS cards_select ON cards;
CREATE POLICY cards_select ON cards FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS cards_update ON cards;
CREATE POLICY cards_update ON cards FOR UPDATE USING (
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS comments_select ON comments;
CREATE POLICY comments_select ON comments FOR SELECT USING (
  (parent_type = 'message' AND parent_id IN (
    SELECT id FROM messages WHERE trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  ))
  OR
  (parent_type = 'card' AND parent_id IN (
    SELECT id FROM cards WHERE trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
  ))
);
