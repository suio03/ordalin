ALTER TABLE `tags` ADD `kind` text DEFAULT 'attribute' NOT NULL;
--> statement-breakpoint
UPDATE `tags` SET `kind` = 'interface' WHERE `slug` IN ('web-app', 'desktop-app', 'browser-extension', 'api');
--> statement-breakpoint
INSERT OR IGNORE INTO `tags` (`id`, `slug`, `name`, `kind`, `description`, `is_active`) VALUES
  ('tag_dictation', 'dictation', 'Dictation', 'capability', '', 1),
  ('tag_transcription', 'transcription', 'Transcription', 'capability', '', 1),
  ('tag_translation', 'translation', 'Translation', 'capability', '', 1),
  ('tag_image_generation', 'image-generation', 'Image generation', 'capability', '', 1),
  ('tag_image_editing', 'image-editing', 'Image editing', 'capability', '', 1),
  ('tag_brand_design', 'brand-design', 'Brand design', 'capability', '', 1),
  ('tag_video_generation', 'video-generation', 'Video generation', 'capability', '', 1),
  ('tag_video_editing', 'video-editing', 'Video editing', 'capability', '', 1),
  ('tag_screen_recording', 'screen-recording', 'Screen recording', 'capability', '', 1),
  ('tag_dubbing', 'dubbing', 'Dubbing', 'capability', '', 1),
  ('tag_music_generation', 'music-generation', 'Music generation', 'capability', '', 1),
  ('tag_voice_generation', 'voice-generation', 'Voice generation', 'capability', '', 1),
  ('tag_coding_assistant', 'coding-assistant', 'Coding assistant', 'capability', '', 1),
  ('tag_app_builder', 'app-builder', 'App builder', 'capability', '', 1),
  ('tag_software_testing', 'software-testing', 'Software testing', 'capability', '', 1),
  ('tag_devops_monitoring', 'devops-monitoring', 'DevOps and monitoring', 'capability', '', 1),
  ('tag_meeting_assistant', 'meeting-assistant', 'Meeting assistant', 'capability', '', 1),
  ('tag_scheduling', 'scheduling', 'Scheduling', 'capability', '', 1),
  ('tag_workflow_automation', 'workflow-automation', 'Workflow automation', 'capability', '', 1),
  ('tag_ad_creative', 'ad-creative', 'Ad creative', 'capability', '', 1),
  ('tag_social_media', 'social-media', 'Social media', 'capability', '', 1),
  ('tag_business_research', 'business-research', 'Business research', 'capability', '', 1),
  ('tag_legal_research', 'legal-research', 'Legal research', 'capability', '', 1),
  ('tag_document_analysis', 'document-analysis', 'Document analysis', 'capability', '', 1),
  ('tag_local_ai', 'local-ai', 'Local AI', 'capability', '', 1),
  ('tag_knowledge_management', 'knowledge-management', 'Knowledge management', 'capability', '', 1),
  ('tag_customer_support', 'customer-support', 'Customer support', 'capability', '', 1),
  ('tag_personalized_gifts', 'personalized-gifts', 'Personalized gifts', 'capability', '', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_dictation' FROM `tools` WHERE `canonical_domain` IN ('zenproducts.ai', 'lispr.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_transcription' FROM `tools` WHERE `canonical_domain` IN ('zenproducts.ai', 'lispr.ai', 'hearsub.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_translation' FROM `tools` WHERE `canonical_domain` IN ('lispr.ai', 'hearsub.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_image_generation' FROM `tools` WHERE `canonical_domain` IN ('playyy.ai', 'miora.design', 'zawa.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_image_editing' FROM `tools` WHERE `canonical_domain` = 'playyy.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_brand_design' FROM `tools` WHERE `canonical_domain` IN ('miora.design', 'zawa.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_video_generation' FROM `tools` WHERE `canonical_domain` IN ('miora.design', 'adant.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_video_editing' FROM `tools` WHERE `canonical_domain` = 'capptivo.com';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_screen_recording' FROM `tools` WHERE `canonical_domain` = 'capptivo.com';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_dubbing' FROM `tools` WHERE `canonical_domain` = 'hearsub.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_coding_assistant' FROM `tools` WHERE `canonical_domain` IN ('coldtea.ai', 'soloop.io');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_software_testing' FROM `tools` WHERE `canonical_domain` IN ('coldtea.ai', 'testmuai.com', 'usesuperflow.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_devops_monitoring' FROM `tools` WHERE `canonical_domain` = 'coldtea.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_meeting_assistant' FROM `tools` WHERE `canonical_domain` = 'heynoah.io';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_scheduling' FROM `tools` WHERE `canonical_domain` = 'heynoah.io';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_workflow_automation' FROM `tools` WHERE `canonical_domain` IN ('heynoah.io', 'soloop.io');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_ad_creative' FROM `tools` WHERE `canonical_domain` = 'adant.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_social_media' FROM `tools` WHERE `canonical_domain` = 'adant.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_business_research' FROM `tools` WHERE `canonical_domain` IN ('decisity.com', 'soloop.io');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_document_analysis' FROM `tools` WHERE `canonical_domain` IN ('decisity.com', 'vaquill.ai');
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_legal_research' FROM `tools` WHERE `canonical_domain` = 'vaquill.ai';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_local_ai' FROM `tools` WHERE `canonical_domain` = 'lumichats.com';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_knowledge_management' FROM `tools` WHERE `canonical_domain` = 'lumichats.com';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_music_generation' FROM `tools` WHERE `canonical_domain` = 'yoursonggift.net';
--> statement-breakpoint
INSERT OR IGNORE INTO `tool_tags` (`tool_id`, `tag_id`) SELECT `id`, 'tag_personalized_gifts' FROM `tools` WHERE `canonical_domain` = 'yoursonggift.net';
