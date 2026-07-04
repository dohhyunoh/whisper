-- More permanent seed posts so the pool always has something real-feeling to
-- respond to (especially at launch / before real volume). Fixed ids + distinct
-- sentinel authors (so blocking one doesn't hide the rest), far-future expiry so
-- the cleanup job never removes them. Re-run safe. Varied moods; a mix of
-- gender/tags (some "prefer not to say" → null) to mirror the real range.
-- None are crisis content — those must never sit in the pool.

insert into public.posts (id, author_id, mood, text, author_gender, author_tags, expires_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000002', 'cloudy',
   'I keep smiling at work so no one asks. By the time I get home I don''t have much left for myself.',
   'Female', ARRAY['gentle','rest','self love'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000003', 'stormy',
   'I did everything right and it still fell apart. I''m so tired of being the strong one.',
   null, ARRAY['patience','resilience'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000004', 'windy',
   'It''s 2am again and my mind keeps replaying everything I could have said differently.',
   'Male', ARRAY['peace','letting go'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000005', 'clear',
   'Something small went right today and I almost forgot what that felt like. I wanted to tell someone.',
   'Female', ARRAY['gratitude','hope'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-000000000006', 'cloudy',
   'I lost someone this year and everyone has moved on but me. Some days it lands like it just happened.',
   null, ARRAY['grief','gentle'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-000000000007', 'windy',
   'New city, new job, and I have never felt more alone in a crowd.',
   'Male', ARRAY['belonging','courage'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-000000000008', 'stormy',
   'I am angry and I do not even know who at. Maybe just myself.',
   null, ARRAY['self compassion'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-000000000009', 'cloudy',
   'Being a parent is the best thing I have done and also the loneliest. I miss who I used to be.',
   'Female', ARRAY['rest','identity'], 'infinity'),

  ('00000000-0000-0000-0000-0000000000a9', '00000000-0000-0000-0000-00000000000a', 'clear',
   'I have been in a heavy place for a while, and today I noticed the sky. Just wanted to mark it.',
   null, ARRAY['hope','healing'], 'infinity')
on conflict (id) do nothing;
