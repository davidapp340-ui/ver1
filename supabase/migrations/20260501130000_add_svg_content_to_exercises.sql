-- Adds a free-form SVG XML column so admins can author custom vector
-- animations from the admin UI (animation_id = 'custom_svg').
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS svg_content text;
