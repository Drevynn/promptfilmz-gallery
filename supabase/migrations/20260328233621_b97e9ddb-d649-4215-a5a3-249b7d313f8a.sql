DROP VIEW IF EXISTS public.contest_entries_public;

CREATE VIEW public.contest_entries_public
WITH (security_invoker = false)
AS
SELECT
  ce.id,
  ce.shot_id,
  ce.votes,
  ce.created_at,
  ce.category,
  p.display_name AS director_name,
  p.avatar_url AS director_avatar,
  s.description AS shot_description,
  s.shot_type,
  s.scene_number AS shot_scene_number,
  s.shot_code,
  s.thumbnail_url AS shot_thumbnail_url,
  s.video_url AS shot_video_url
FROM contest_entries ce
JOIN profiles p ON p.id = ce.user_id
JOIN shots s ON s.id = ce.shot_id;