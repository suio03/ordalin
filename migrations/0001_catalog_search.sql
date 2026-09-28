CREATE VIRTUAL TABLE `tools_fts` USING fts5(
  `tool_id` UNINDEXED,
  `name`,
  `tagline`,
  `description`,
  `category_names`,
  `tag_names`,
  tokenize = 'unicode61 remove_diacritics 2'
);
