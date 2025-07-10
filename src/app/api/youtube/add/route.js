import { NextResponse } from "next/server";
import { youtubeService } from "@/lib/youtube/service";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

// Helper function to insert YouTube items
async function insertYoutubeItems(feedId, items) {
  try {
    let insertedCount = 0;
    
    for (const item of items) {
      try {
        const videoId = item.videoId || item.video_id;
        if (!videoId) continue;
        
        const { error } = await supabase
          .from('youtube_items')
          .insert({
            feed_id: feedId,
            video_id: videoId,
            title: item.title || 'Untitled Video',
            description: item.description ? item.description.substring(0, 500) : null,
            thumbnail: item.thumbnail || item.image || null,
            published_at: item.pubDate || item.publishedAt || new Date().toISOString(),
            channel_title: item.author || item.channelTitle || null,
            url: item.link || `https://youtube.com/watch?v=${videoId}`,
            created_at: new Date().toISOString()
          });
        
        if (!error) {
          insertedCount++;
        } else if (error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error inserting YouTube item:', error);
        }
      } catch (itemError) {
        console.error('Error processing YouTube item:', itemError);
      }
    }
    
    return insertedCount;
  } catch (error) {
    console.error('Error inserting YouTube items:', error);
    throw error;
  }
}

/**
 * YouTube channel add endpoint
 *
 * Adds a YouTube channel using the channelId parameter from the POST request.
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const channelId = body.channelId;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId parameter is required" },
        { status: 400 }
      );
    }

    const newFeed = await youtubeService.addYoutubeChannel(
      channelId, 
      session.user.id, 
      insertYoutubeItems
    );

    return NextResponse.json({
      success: true,
      message: "YouTube channel added successfully",
      feed: newFeed,
    });
  } catch (error) {
    console.error("YouTube channel add error:", error);

    return NextResponse.json(
      { error: error.message || "YouTube channel add error" },
      { status: 500 }
    );
  }
}
