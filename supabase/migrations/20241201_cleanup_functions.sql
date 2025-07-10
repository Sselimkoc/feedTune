-- Create RPC functions for cleaning up orphaned interactions

-- Function to count orphaned RSS interactions
CREATE OR REPLACE FUNCTION count_orphaned_rss_interactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphan_count
    FROM rss_interactions ri
    WHERE NOT EXISTS (
        SELECT 1 FROM rss_items r WHERE r.id = ri.item_id
    );
    
    RETURN orphan_count;
END;
$$;

-- Function to count orphaned YouTube interactions
CREATE OR REPLACE FUNCTION count_orphaned_youtube_interactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphan_count
    FROM youtube_interactions yi
    WHERE NOT EXISTS (
        SELECT 1 FROM youtube_items y WHERE y.id = yi.item_id
    );
    
    RETURN orphan_count;
END;
$$;

-- Function to cleanup orphaned RSS interactions
CREATE OR REPLACE FUNCTION cleanup_orphaned_rss_interactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM rss_interactions ri
        WHERE NOT EXISTS (
            SELECT 1 FROM rss_items r WHERE r.id = ri.item_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;

-- Function to cleanup orphaned YouTube interactions
CREATE OR REPLACE FUNCTION cleanup_orphaned_youtube_interactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM youtube_interactions yi
        WHERE NOT EXISTS (
            SELECT 1 FROM youtube_items y WHERE y.id = yi.item_id
        )
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$;

-- Function to get cleanup statistics
CREATE OR REPLACE FUNCTION get_cleanup_stats(older_than_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_date TIMESTAMP;
    rss_count INTEGER;
    youtube_count INTEGER;
    rss_orphans INTEGER;
    youtube_orphans INTEGER;
    result JSON;
BEGIN
    cutoff_date := NOW() - (older_than_days || ' days')::INTERVAL;
    
    -- Count old RSS items
    SELECT COUNT(*) INTO rss_count
    FROM rss_items
    WHERE published_at < cutoff_date;
    
    -- Count old YouTube items
    SELECT COUNT(*) INTO youtube_count
    FROM youtube_items
    WHERE published_at < cutoff_date;
    
    -- Count orphaned interactions
    SELECT count_orphaned_rss_interactions() INTO rss_orphans;
    SELECT count_orphaned_youtube_interactions() INTO youtube_orphans;
    
    result := json_build_object(
        'cutoff_date', cutoff_date,
        'old_rss_items', rss_count,
        'old_youtube_items', youtube_count,
        'orphaned_rss_interactions', rss_orphans,
        'orphaned_youtube_interactions', youtube_orphans,
        'total_old_items', rss_count + youtube_count,
        'total_orphaned_interactions', rss_orphans + youtube_orphans
    );
    
    RETURN result;
END;
$$; 