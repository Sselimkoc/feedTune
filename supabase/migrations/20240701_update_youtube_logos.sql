-- YouTube feed logolarını feeds tablosuna aktarma
UPDATE feeds
SET site_favicon = youtube_feeds.channel_avatar
FROM youtube_feeds
WHERE feeds.id = youtube_feeds.id
AND youtube_feeds.channel_avatar IS NOT NULL
AND feeds.site_favicon IS NULL;

-- Güncellenen satır sayısını göster
SELECT COUNT(*) as updated_feeds FROM feeds
WHERE site_favicon IS NOT NULL
AND type = 'youtube'; 