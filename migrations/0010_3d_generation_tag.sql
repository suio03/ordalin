-- Image & Design browse tag for tools that generate or texture 3D models.
INSERT INTO tags (id, slug, name, kind, category_group_id, description, is_active) VALUES ('tag_3d_generation', '3d-generation', '3D generation', 'category', 'cat_image', 'Generate, texture, and convert 3D models, scenes, and relief prints from text or images.', 1) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, kind = excluded.kind, category_group_id = excluded.category_group_id, description = excluded.description, is_active = 1;--> statement-breakpoint
-- Meshy was filed under Image generation only because this tag did not exist yet.
INSERT OR IGNORE INTO tool_tags (tool_id, tag_id) SELECT t.id, tag.id FROM tools t JOIN tags tag ON tag.slug = '3d-generation' WHERE t.canonical_key = 'meshy.ai';--> statement-breakpoint
DELETE FROM tool_tags WHERE tool_id IN (SELECT id FROM tools WHERE canonical_key = 'meshy.ai') AND tag_id = (SELECT id FROM tags WHERE slug = 'image-generation');--> statement-breakpoint
UPDATE tools_fts SET tag_names = replace(tag_names, 'Image generation', '3D generation') WHERE tool_id IN (SELECT id FROM tools WHERE canonical_key = 'meshy.ai');
