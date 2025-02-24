import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "thumbnail"],
    ],
  },
});

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("RSS API Route - No session found");
      return Response.json({ error: "No session found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return Response.json({ error: "Feed URL is required" }, { status: 400 });
    }

    try {
      const response = await fetch(url);
      const text = await response.text();
      const feed = await parser.parseString(text);

      return Response.json({
        feed: {
          title: feed.title,
          link: feed.link,
          description: feed.description,
        },
        items: feed.items.map((item) => ({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.content,
          published_at: item.pubDate || item.isoDate,
          thumbnail: item.thumbnail?.url || item.media?.url || null,
        })),
      });
    } catch (error) {
      console.error("RSS Parser Error:", error);
      return Response.json(
        { error: error.message || "Failed to parse RSS feed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
