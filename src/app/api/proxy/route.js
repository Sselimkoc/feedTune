import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "thumbnail"],
      ["content:encoded", "contentEncoded"],
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
      return Response.json({ error: "No session found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const type = searchParams.get("type") || "rss"; // rss veya youtube

    if (!url) {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return Response.json(
          { error: "Failed to fetch feed" },
          { status: response.status }
        );
      }

      if (type === "rss") {
        const text = await response.text();
        const feed = await parser.parseString(text);

        return Response.json({
          feed: {
            title: feed.title || "",
            link: feed.link || url,
            description: feed.description || "",
          },
          items: (feed.items || []).map((item) => ({
            title: item.title || "",
            link: item.link || "",
            description: item.contentEncoded || item.description || "",
            published_at:
              item.pubDate || item.isoDate || new Date().toISOString(),
            thumbnail: item.thumbnail?.url || item.media?.url || null,
          })),
        });
      }

      return Response.json(await response.json());
    } catch (error) {
      console.error("Feed Parser Error:", error);
      return Response.json(
        { error: error.message || "Failed to parse feed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
