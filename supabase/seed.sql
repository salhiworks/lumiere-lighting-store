-- LUMIÈRE seed: the eight original pendants and their three collections.
--
-- Run after the migration (SQL editor, or psql). Generated from lib/catalog/demo-data.ts, the demo catalog the store uses when
-- Supabase is not configured, so both start out identical. IDs and prices are the original demo's.
-- Safe to re-run: rows that already exist are left untouched, so edits made in the admin are never overwritten.

insert into public.collections (id, name, description, sort_order) values
  ('metal-concrete', 'Metal & Concrete', 'Opaque shades that throw a focused pool of light onto the table.', 1),
  ('glass', 'Glass', 'Clear and opal glass that spreads light through the whole room.', 2),
  ('paper-rattan', 'Paper & Rattan', 'Natural fibers that soften the light and give it texture.', 3)
on conflict (id) do nothing;

insert into public.products (
  id, slug, name, finish, collection_id, price_cents, currency, stock, diameter_cm, summary, description, highlights, specs,
  image_off, image_on, image_alt, image_width, image_height, cord_drop, is_published, sort_order
) values
  (
    'dome-enamel', 'enamel-dome-forest', 'Enamel dome', 'Forest', 'metal-concrete', 18000, 'USD', 14, 38,
    'Glossy forest-green enamel over steel, with a bright white reflector inside.',
    'A workshop classic, refined. Forest-green enamel is fired over spun steel and left glossy, while the white interior throws a clean, generous pool of light onto the table. At 38 cm it suits a kitchen island or a small dining table.',
    array['E27 · 4 W filament LED', 'Ø 38 cm shade', '1.5 m fabric cord']::text[],
    '[{"label":"Material","value":"Spun steel, glossy enamel"},{"label":"Finish","value":"Forest green outside, white inside"},{"label":"Size","value":"Ø 38 cm shade"},{"label":"Light source","value":"E27 · 4 W filament LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/dome-enamel-off.webp', '/lamps/dome-enamel-on.webp', 'Dome pendant in glossy forest-green enamel with a white interior', 557, 900, 0.62, true, 1
  ),
  (
    'glass-globe', 'glass-globe-clear', 'Glass globe', 'Clear', 'glass', 21000, 'USD', 9, 25,
    'Hand-blown clear glass around an exposed filament and a brass socket.',
    'Mouth-blown glass so thin it almost disappears, leaving the filament and the polished brass socket as the whole design. The light is bright and sparkling and carries across a room. Hang a pair over a dining table, or one in a stairwell.',
    array['E27 · 4 W filament LED', 'Ø 25 cm globe', 'Brass socket']::text[],
    '[{"label":"Material","value":"Mouth-blown clear glass, brass socket"},{"label":"Finish","value":"Clear"},{"label":"Size","value":"Ø 25 cm globe"},{"label":"Light source","value":"E27 · 4 W filament LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/glass-globe-off.webp', '/lamps/glass-globe-on.webp', 'Clear glass globe pendant with an exposed filament bulb and a brass socket', 557, 900, 0.9, true, 2
  ),
  (
    'cone-brass', 'brass-cone-brushed', 'Brass cone', 'Brushed', 'metal-concrete', 24000, 'USD', 6, 22,
    'A tall cone of brushed brass that throws a tight pool of light.',
    'A slim cone of solid brass, brushed by hand and left to deepen with age. Its narrow mouth focuses a GU10 spot into a tight, bright pool. Hang it in a row over a counter, or alone beside a reading chair.',
    array['GU10 · 5 W LED', 'Ø 22 × 34 cm', 'Brushed brass']::text[],
    '[{"label":"Material","value":"Solid brass, brushed by hand"},{"label":"Finish","value":"Brushed brass"},{"label":"Size","value":"Ø 22 × 34 cm"},{"label":"Light source","value":"GU10 · 5 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/cone-brass-off.webp', '/lamps/cone-brass-on.webp', 'Tall conical pendant in brushed brass', 557, 900, 0.74, true, 3
  ),
  (
    'rattan-weave', 'rattan-weave-natural', 'Rattan weave', 'Natural', 'paper-rattan', 15000, 'USD', 11, 45,
    'Hand-woven rattan in a wide bell that scatters soft, patterned light.',
    'Natural rattan, hand-woven over a wide bell frame. Lit, the open weave scatters soft, dappled patterns across the walls and ceiling; unlit, it reads as a calm natural texture. Its 45 cm span suits living rooms and larger tables.',
    array['E27 · 6 W LED', 'Ø 45 cm bell', 'Natural rattan']::text[],
    '[{"label":"Material","value":"Hand-woven natural rattan"},{"label":"Finish","value":"Natural"},{"label":"Size","value":"Ø 45 cm bell"},{"label":"Light source","value":"E27 · 6 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/rattan-weave-off.webp', '/lamps/rattan-weave-on.webp', 'Wide bell pendant in hand-woven natural rattan', 557, 900, 1, true, 4
  ),
  (
    'paper-lantern', 'paper-lantern-washi', 'Paper lantern', 'Washi', 'paper-rattan', 12000, 'USD', 20, 40,
    'White paper over a fine bamboo frame for a soft, even glow.',
    'Washi paper stretched over a fine bamboo frame. The paper diffuses the bulb completely, so the whole sphere glows evenly and without glare: a gentle light for bedrooms, hallways and quiet corners.',
    array['E27 · 4 W LED', 'Ø 40 cm sphere', 'Bamboo frame']::text[],
    '[{"label":"Material","value":"Washi paper, bamboo frame"},{"label":"Finish","value":"White washi"},{"label":"Size","value":"Ø 40 cm sphere"},{"label":"Light source","value":"E27 · 4 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/paper-lantern-off.webp', '/lamps/paper-lantern-on.webp', 'Spherical lantern pendant in white washi paper on a bamboo frame', 557, 900, 0.68, true, 5
  ),
  (
    'concrete-cone', 'concrete-cone-ash', 'Concrete cone', 'Ash', 'metal-concrete', 26000, 'USD', 4, 40,
    'Cast grey concrete with a pale inner face and a wide, low cone.',
    'Cast by hand in ash-grey concrete, so every shade carries its own small marks and pores. A pale inner face softens the light as it leaves the wide, low cone. It gives a long dining table or an island real visual weight.',
    array['E27 · 6 W LED', 'Ø 40 cm shade', 'Cast concrete']::text[],
    '[{"label":"Material","value":"Hand-cast concrete"},{"label":"Finish","value":"Ash grey, pale inner face"},{"label":"Size","value":"Ø 40 cm shade"},{"label":"Light source","value":"E27 · 6 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/concrete-cone-off.webp', '/lamps/concrete-cone-on.webp', 'Wide, low cone pendant in cast ash-grey concrete', 557, 900, 0.86, true, 6
  ),
  (
    'fluted-glass', 'fluted-glass-opal', 'Fluted glass', 'Opal', 'glass', 19000, 'USD', 12, 18,
    'Ribbed opal glass that softens the bulb into a column of light.',
    'A compact column of ribbed opal glass. The flutes break up the bulb into a soft, even column of light with no hot spot. At 18 cm across it fits small spaces: over a sink, in an entryway, or grouped in threes.',
    array['E27 · 4 W LED', 'Ø 18 × 22 cm', 'Opal glass']::text[],
    '[{"label":"Material","value":"Ribbed opal glass"},{"label":"Finish","value":"Opal white"},{"label":"Size","value":"Ø 18 × 22 cm"},{"label":"Light source","value":"E27 · 4 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/fluted-glass-off.webp', '/lamps/fluted-glass-on.webp', 'Cylindrical pendant in ribbed opal glass', 557, 900, 0.58, true, 7
  ),
  (
    'copper-bell', 'copper-bell-polished', 'Copper bell', 'Polished', 'metal-concrete', 39000, 'USD', 3, 36,
    'Polished copper outside and a white enamel bell inside.',
    'Spun from a single sheet of copper and polished to a mirror finish, with white enamel inside to keep the light clean and bright. Left unpolished, the copper slowly deepens in tone. A statement over a dining table.',
    array['E27 · 6 W LED', 'Ø 36 cm bell', 'Polished copper']::text[],
    '[{"label":"Material","value":"Spun copper, white enamel interior"},{"label":"Finish","value":"Polished copper"},{"label":"Size","value":"Ø 36 cm bell"},{"label":"Light source","value":"E27 · 6 W LED, included"},{"label":"Cord","value":"1.5 m black fabric cord"}]'::jsonb,
    '/lamps/copper-bell-off.webp', '/lamps/copper-bell-on.webp', 'Bell pendant in polished copper with a white enamel interior', 557, 900, 0.8, true, 8
  )
on conflict (id) do nothing;
