DROP INDEX `import_candidates_domain_unique`;--> statement-breakpoint
ALTER TABLE `import_candidates` ADD `canonical_key` text;--> statement-breakpoint
CREATE INDEX `import_candidates_domain` ON `import_candidates` (`canonical_domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `import_candidates_key_unique` ON `import_candidates` (`canonical_key`);--> statement-breakpoint
DROP INDEX `tools_canonical_domain_unique`;--> statement-breakpoint
ALTER TABLE `tools` ADD `canonical_key` text;--> statement-breakpoint
CREATE INDEX `tools_canonical_domain` ON `tools` (`canonical_domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `tools_canonical_key_unique` ON `tools` (`canonical_key`);--> statement-breakpoint
-- Existing entries keep their domain as identity; FLUX 3 is keyed by its model page so BFL's other models can be listed.
UPDATE `tools` SET `canonical_key` = `canonical_domain` WHERE `canonical_key` IS NULL;--> statement-breakpoint
UPDATE `import_candidates` SET `canonical_key` = `canonical_domain` WHERE `canonical_key` IS NULL;--> statement-breakpoint
UPDATE `tools` SET `canonical_key` = 'bfl.ai/models/flux-3-video' WHERE `canonical_domain` = 'bfl.ai' AND `slug` = 'flux-3';--> statement-breakpoint
UPDATE `import_candidates` SET `canonical_key` = 'bfl.ai/models/flux-3-video' WHERE `canonical_domain` = 'bfl.ai' AND `website_url` = 'https://bfl.ai/models/flux-3-video';--> statement-breakpoint
-- Models listed on /models carry this attribute tag.
INSERT INTO tags (id, slug, name, kind, category_group_id, description, is_active) VALUES ('tag_ai_model', 'ai-model', 'AI model', 'attribute', NULL, 'A generative or foundation model used through an API or playground, rather than a finished app.', 1) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, kind = excluded.kind, description = excluded.description, is_active = 1;--> statement-breakpoint
INSERT OR IGNORE INTO tool_tags (tool_id, tag_id) SELECT t.id, tag.id FROM tools t JOIN tags tag ON tag.slug = 'ai-model' WHERE t.canonical_domain = 'bfl.ai' AND t.slug = 'flux-3';--> statement-breakpoint
UPDATE tools_fts SET tag_names = tag_names || ' AI model' WHERE tool_id IN (SELECT id FROM tools WHERE canonical_domain = 'bfl.ai' AND slug = 'flux-3') AND tag_names NOT LIKE '%AI model%';
