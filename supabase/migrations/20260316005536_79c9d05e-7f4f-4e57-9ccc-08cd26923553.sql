-- Recreate view with shot data included to avoid FK join issues
CREATE OR REPLACE VIEW public.contest_entries_public AS
SELECT
  ce.id,
  ce.shot_id,
  ce.votes,
  ce.created_at,
  p.display_name AS director_name,
  p.avatar_url AS director_avatar,
  s.description AS shot_description,
  s.shot_type AS shot_type,
  s.scene_number AS shot_scene_number,
  s.shot_code AS shot_code,
  s.thumbnail_url AS shot_thumbnail_url,
  s.video_url AS shot_video_url
FROM public.contest_entries ce
LEFT JOIN public.profiles p ON p.id = ce.user_id
LEFT JOIN public.shots s ON s.id = ce.shot_id;

ALTER VIEW public.contest_entries_public SET (security_invoker = on);