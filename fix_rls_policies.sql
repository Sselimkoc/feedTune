-- Fix missing RLS policies for rss_items and youtube_items tables
-- This migration adds the missing INSERT, UPDATE, and DELETE policies

-- RSS Items INSERT policy
CREATE POLICY rss_items_insert_policy 
ON rss_items 
FOR INSERT 
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- RSS Items UPDATE policy
CREATE POLICY rss_items_update_policy 
ON rss_items 
FOR UPDATE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()))
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- RSS Items DELETE policy
CREATE POLICY rss_items_delete_policy 
ON rss_items 
FOR DELETE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- YouTube Items INSERT policy
CREATE POLICY youtube_items_insert_policy 
ON youtube_items 
FOR INSERT 
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- YouTube Items UPDATE policy
CREATE POLICY youtube_items_update_policy 
ON youtube_items 
FOR UPDATE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()))
WITH CHECK (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid()));

-- YouTube Items DELETE policy
CREATE POLICY youtube_items_delete_policy 
ON youtube_items 
FOR DELETE 
USING (feed_id IN (SELECT id FROM feeds WHERE user_id = auth.uid())); 