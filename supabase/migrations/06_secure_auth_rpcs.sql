-- ============================================================================
-- AFROCUISTO — 06_secure_auth_rpcs.sql
-- Durcissement maximal du trigger d'inscription et des RPCs utilisateur (RLS)
-- ============================================================================

-- 1. Trigger d'inscription durci (SECURITY DEFINER non exposable en RPC)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_name TEXT;
  v_clean_name TEXT;
  v_role TEXT;
  v_terroir TEXT;
  v_avatar TEXT;
  v_diaspora BOOLEAN;
BEGIN
  v_raw_name := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'name'), ''),
    'Gourmet Afro'
  );
  v_clean_name := left(regexp_replace(v_raw_name, '[<>[:cntrl:]]', '', 'g'), 60);
  IF length(btrim(v_clean_name)) < 2 THEN
    v_clean_name := 'Gourmet Afro';
  END IF;

  v_role := COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'role_title'), ''), 'Gourmet Passionné');
  v_role := left(regexp_replace(v_role, '[<>[:cntrl:]]', '', 'g'), 50);

  v_terroir := COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'favorite_terroir'), ''), 'Bénin');
  v_terroir := left(regexp_replace(v_terroir, '[<>[:cntrl:]]', '', 'g'), 40);

  v_avatar := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data->>'picture'), ''),
    ''
  );
  IF v_avatar NOT LIKE 'https://%' THEN
    v_avatar := '';
  END IF;
  v_avatar := left(v_avatar, 1024);

  v_diaspora := COALESCE((NEW.raw_user_meta_data->>'diaspora_substitutes_first')::boolean, false);

  INSERT INTO public.profiles (id, email, display_name, role_title, favorite_terroir, avatar_url)
  VALUES (NEW.id, lower(btrim(NEW.email)), v_clean_name, v_role, v_terroir, v_avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE
      WHEN public.profiles.display_name IN ('', 'Gourmet Afro') THEN EXCLUDED.display_name
      ELSE public.profiles.display_name
    END,
    avatar_url = CASE
      WHEN (public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '') AND EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url
      ELSE public.profiles.avatar_url
    END;

  INSERT INTO public.user_preferences (user_id, diaspora_substitutes_first)
  VALUES (NEW.id, v_diaspora)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Lecture consolidée du dossier utilisateur (SECURITY INVOKER + RLS)
CREATE OR REPLACE FUNCTION public.get_my_user_bundle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := (select auth.uid());
  v_profile public.profiles%ROWTYPE;
  v_prefs public.user_preferences%ROWTYPE;
  v_favorites JSONB;
  v_shopping JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF FOUND AND v_profile.is_banned THEN
    RAISE EXCEPTION 'Account suspended' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_prefs FROM public.user_preferences WHERE user_id = v_uid;

  SELECT COALESCE(jsonb_agg(recipe_id), '[]'::jsonb)
  INTO v_favorites
  FROM public.user_favorites
  WHERE user_id = v_uid;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'name', name,
        'quantity', quantity,
        'category', category,
        'recipeName', recipe_name,
        'isChecked', is_checked,
        'price', price,
        'currency', currency,
        'archivedAt', CASE WHEN archived_at IS NOT NULL THEN (extract(epoch FROM archived_at) * 1000)::bigint ELSE NULL END,
        'archiveBatchLabel', archive_batch_label
      )
    ),
    '[]'::jsonb
  )
  INTO v_shopping
  FROM public.user_shopping_items
  WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'profile', CASE WHEN v_profile.id IS NOT NULL THEN jsonb_build_object(
      'display_name', v_profile.display_name,
      'role_title', v_profile.role_title,
      'bio', v_profile.bio,
      'avatar_url', v_profile.avatar_url,
      'favorite_terroir', v_profile.favorite_terroir,
      'cooked_recipe_ids', to_jsonb(v_profile.cooked_recipe_ids),
      'is_banned', v_profile.is_banned
    ) ELSE NULL END,
    'preferences', CASE WHEN v_prefs.user_id IS NOT NULL THEN jsonb_build_object(
      'default_servings', v_prefs.default_servings,
      'diaspora_substitutes_first', v_prefs.diaspora_substitutes_first,
      'keep_screen_on_in_recipe', v_prefs.keep_screen_on_in_recipe,
      'theme_mode', v_prefs.theme_mode,
      'carousel_auto_scroll', v_prefs.carousel_auto_scroll,
      'timer_vibration_enabled', v_prefs.timer_vibration_enabled,
      'ai_voice_id', v_prefs.ai_voice_id
    ) ELSE NULL END,
    'favorites', v_favorites,
    'shopping_items', v_shopping
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_user_bundle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_user_bundle() TO authenticated;

-- 3. Synchronisation durcie du profil & des préférences (SECURITY INVOKER + RLS)
CREATE OR REPLACE FUNCTION public.sync_my_preferences(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := (select auth.uid());
  v_name TEXT;
  v_role TEXT;
  v_bio TEXT;
  v_avatar TEXT;
  v_terroir TEXT;
  v_servings INTEGER;
  v_theme TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  v_name := left(regexp_replace(COALESCE(NULLIF(btrim(p_payload->>'display_name'), ''), 'Gourmet Afro'), '[<>[:cntrl:]]', '', 'g'), 60);
  v_role := left(regexp_replace(COALESCE(NULLIF(btrim(p_payload->>'role_title'), ''), 'Gourmet Passionné'), '[<>[:cntrl:]]', '', 'g'), 50);
  v_bio := left(regexp_replace(COALESCE(p_payload->>'bio', ''), '[<>[:cntrl:]]', '', 'g'), 280);
  v_avatar := left(COALESCE(p_payload->>'avatar_url', ''), 1024);
  v_terroir := left(regexp_replace(COALESCE(NULLIF(btrim(p_payload->>'favorite_terroir'), ''), 'Bénin'), '[<>[:cntrl:]]', '', 'g'), 40);
  v_servings := LEAST(20, GREATEST(1, COALESCE((p_payload->>'default_servings')::integer, 4)));
  v_theme := CASE WHEN (p_payload->>'theme_mode') IN ('system', 'light', 'dark') THEN p_payload->>'theme_mode' ELSE 'system' END;

  INSERT INTO public.profiles (id, display_name, role_title, bio, avatar_url, favorite_terroir)
  VALUES (v_uid, v_name, v_role, v_bio, v_avatar, v_terroir)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role_title = EXCLUDED.role_title,
    bio = EXCLUDED.bio,
    avatar_url = CASE WHEN EXCLUDED.avatar_url LIKE 'http%' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END,
    favorite_terroir = EXCLUDED.favorite_terroir
  WHERE public.profiles.is_banned = false;

  INSERT INTO public.user_preferences (
    user_id,
    default_servings,
    diaspora_substitutes_first,
    keep_screen_on_in_recipe,
    theme_mode,
    carousel_auto_scroll,
    timer_vibration_enabled,
    ai_voice_id
  )
  VALUES (
    v_uid,
    v_servings,
    COALESCE((p_payload->>'diaspora_substitutes_first')::boolean, false),
    COALESCE((p_payload->>'keep_screen_on_in_recipe')::boolean, true),
    v_theme,
    COALESCE((p_payload->>'carousel_auto_scroll')::boolean, true),
    COALESCE((p_payload->>'timer_vibration_enabled')::boolean, true),
    left(COALESCE(NULLIF(btrim(p_payload->>'ai_voice_id'), ''), 'Aoede'), 40)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    default_servings = EXCLUDED.default_servings,
    diaspora_substitutes_first = EXCLUDED.diaspora_substitutes_first,
    keep_screen_on_in_recipe = EXCLUDED.keep_screen_on_in_recipe,
    theme_mode = EXCLUDED.theme_mode,
    carousel_auto_scroll = EXCLUDED.carousel_auto_scroll,
    timer_vibration_enabled = EXCLUDED.timer_vibration_enabled,
    ai_voice_id = EXCLUDED.ai_voice_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_my_preferences(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_my_preferences(jsonb) TO authenticated;

-- 4. Ajout atomique d'une recette cuisinée (SECURITY INVOKER + RLS)
CREATE OR REPLACE FUNCTION public.mark_recipe_cooked(p_recipe_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := (select auth.uid());
BEGIN
  IF v_uid IS NULL OR p_recipe_id IS NULL OR length(btrim(p_recipe_id)) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET cooked_recipe_ids = (
    SELECT ARRAY(SELECT DISTINCT unnest(cooked_recipe_ids || ARRAY[left(btrim(p_recipe_id), 32)]))
  )
  WHERE id = v_uid AND is_banned = false;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_recipe_cooked(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_recipe_cooked(text) TO authenticated;

-- 5. Verrouillage des triggers internes (search_path fixe + aucun appel RPC direct)
ALTER FUNCTION public.update_likes_count() SET search_path = public;
ALTER FUNCTION public.update_views_count() SET search_path = public;
ALTER FUNCTION public.notify_community_action() SET search_path = public;
ALTER FUNCTION public.handle_post_like_change() SET search_path = public;
ALTER FUNCTION public.handle_post_comment_change() SET search_path = public;
ALTER FUNCTION public.handle_story_view_change() SET search_path = public;
ALTER FUNCTION public.handle_story_like_change() SET search_path = public;
ALTER FUNCTION public.handle_challenge_participant_change() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

REVOKE ALL ON FUNCTION public.update_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_views_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_community_action() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_post_like_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_post_comment_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_story_view_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_story_like_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_challenge_participant_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
