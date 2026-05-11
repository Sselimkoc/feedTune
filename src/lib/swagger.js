export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "FeedTune API",
    version: "1.0.0",
    description: "FeedTune RSS & YouTube feed aggregator API",
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "sb-access-token" },
    },
    schemas: {
      Feed: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string" },
          user_id: { type: "string" },
          type: { type: "string", enum: ["rss", "youtube"] },
          title: { type: "string" },
          description: { type: "string" },
          icon: { type: "string" },
          category_id: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          deleted_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      Item: {
        type: "object",
        properties: {
          id: { type: "string" },
          feed_id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          thumbnail: { type: "string", nullable: true },
          published_at: { type: "string", format: "date-time" },
          is_read: { type: "boolean" },
          is_favorite: { type: "boolean" },
          is_read_later: { type: "boolean" },
          type: { type: "string", enum: ["rss", "youtube"] },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Feeds", description: "Feed management" },
    { name: "Items", description: "Feed items and interactions" },
    { name: "YouTube", description: "YouTube channel management" },
    { name: "Utilities", description: "Proxy and preview utilities" },
    { name: "Cron", description: "Scheduled job endpoints" },
  ],
  paths: {
    // ─── AUTH ────────────────────────────────────────────────────────────────
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  displayName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    needsVerification: { type: "boolean" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/check-email": {
      post: {
        tags: ["Auth"],
        summary: "Check if an email already exists",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email lookup result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exists: { type: "boolean" },
                    verified: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/ensure-user": {
      post: {
        tags: ["Auth"],
        summary: "Ensure authenticated user exists in the database",
        responses: {
          200: {
            description: "User record",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Auth"],
        summary: "Get current user record",
        responses: {
          200: { description: "User record" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── FEEDS ───────────────────────────────────────────────────────────────
    "/api/feeds": {
      get: {
        tags: ["Feeds"],
        summary: "Get all feeds with recent items and stats",
        responses: {
          200: {
            description: "Feeds, stats, and recent items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    feeds: { type: "array", items: { $ref: "#/components/schemas/Feed" } },
                    stats: {
                      type: "object",
                      properties: {
                        totalFeeds: { type: "integer" },
                        totalRead: { type: "integer" },
                        totalFavorites: { type: "integer" },
                        totalReadLater: { type: "integer" },
                      },
                    },
                    recentItems: { type: "array", items: { $ref: "#/components/schemas/Item" } },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/add": {
      post: {
        tags: ["Feeds"],
        summary: "Add a new RSS feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", format: "uri" },
                  type: { type: "string", enum: ["rss", "youtube"] },
                  extraData: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      title: { type: "string" },
                      description: { type: "string" },
                      icon: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Created feed",
            content: { "application/json": { schema: { type: "object", properties: { feed: { $ref: "#/components/schemas/Feed" } } } } },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/edit": {
      patch: {
        tags: ["Feeds"],
        summary: "Update a feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" },
                  category_id: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated feed", content: { "application/json": { schema: { type: "object", properties: { feed: { $ref: "#/components/schemas/Feed" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/delete": {
      delete: {
        tags: ["Feeds"],
        summary: "Soft-delete a feed",
        parameters: [{ name: "feedId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/sync-items": {
      post: {
        tags: ["Feeds"],
        summary: "Fetch and insert new RSS items for a feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["feedId"], properties: { feedId: { type: "string" } } },
            },
          },
        },
        responses: {
          200: {
            description: "Sync result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    inserted: { type: "integer" },
                    total: { type: "integer" },
                    errors: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/auto-sync": {
      post: {
        tags: ["Feeds"],
        summary: "Update last_fetched timestamps for all active feeds (server-side cooldown)",
        responses: {
          200: {
            description: "Sync result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    synced: { type: "integer" },
                    message: { type: "string" },
                    errors: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/feeds/summary": {
      get: {
        tags: ["Feeds"],
        summary: "Get aggregate stats for the authenticated user",
        responses: {
          200: {
            description: "Feed statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalFeeds: { type: "integer" },
                    rssFeeds: { type: "integer" },
                    youtubeFeeds: { type: "integer" },
                    totalRead: { type: "integer" },
                    totalFavorites: { type: "integer" },
                    totalReadLater: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── ITEMS ───────────────────────────────────────────────────────────────
    "/api/favorites": {
      get: {
        tags: ["Items"],
        summary: "Get all favorited items",
        responses: {
          200: {
            description: "Favorite items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Item" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/read-later": {
      get: {
        tags: ["Items"],
        summary: "Get all read-later items",
        responses: {
          200: {
            description: "Read-later items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Item" } },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/interactions/add": {
      post: {
        tags: ["Items"],
        summary: "Add an interaction flag (read, favorite, read-later)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["itemId", "type", "itemType"],
                properties: {
                  itemId: { type: "string" },
                  type: { type: "string", enum: ["is_read", "is_favorite", "is_read_later"] },
                  itemType: { type: "string", enum: ["rss", "youtube"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/interactions/remove": {
      post: {
        tags: ["Items"],
        summary: "Remove an interaction flag",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["itemId", "type", "itemType"],
                properties: {
                  itemId: { type: "string" },
                  type: { type: "string", enum: ["is_read", "is_favorite", "is_read_later"] },
                  itemType: { type: "string", enum: ["rss", "youtube"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── YOUTUBE ─────────────────────────────────────────────────────────────
    "/api/youtube/add": {
      post: {
        tags: ["YouTube"],
        summary: "Add a YouTube channel as a feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["channelId"], properties: { channelId: { type: "string" } } },
            },
          },
        },
        responses: {
          200: { description: "Created feed", content: { "application/json": { schema: { type: "object", properties: { feed: { $ref: "#/components/schemas/Feed" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/delete": {
      delete: {
        tags: ["YouTube"],
        summary: "Delete a YouTube feed",
        parameters: [{ name: "feedId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/sync": {
      post: {
        tags: ["YouTube"],
        summary: "Sync new videos for a YouTube feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["feedId"], properties: { feedId: { type: "string" } } },
            },
          },
        },
        responses: {
          200: {
            description: "Sync result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    inserted: { type: "integer" },
                    total: { type: "integer" },
                    errors: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/update": {
      post: {
        tags: ["YouTube"],
        summary: "Update metadata for a YouTube feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["feedId"], properties: { feedId: { type: "string" } } },
            },
          },
        },
        responses: {
          200: { description: "Updated feed", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, feed: { $ref: "#/components/schemas/Feed" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/channel-search": {
      post: {
        tags: ["YouTube"],
        summary: "Search for a YouTube channel by URL or keyword",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri", description: "YouTube channel URL" },
                  query: { type: "string", description: "Search query" },
                  keyword: { type: "string" },
                  language: { type: "string", default: "en" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Channel search result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    source: { type: "string", enum: ["channel_id", "search"] },
                    channel: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        thumbnail: { type: "string" },
                        url: { type: "string" },
                        subscribers: { type: "integer" },
                        subscribersFormatted: { type: "string" },
                        videoCount: { type: "integer" },
                        videoCountFormatted: { type: "string" },
                      },
                    },
                    channels: { type: "array" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["YouTube"],
        summary: "Search for a YouTube channel (GET)",
        security: [],
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "url", in: "query", schema: { type: "string" } },
          { name: "keyword", in: "query", schema: { type: "string" } },
          { name: "language", in: "query", schema: { type: "string", default: "en" } },
        ],
        responses: { 200: { description: "Channel search result" } },
      },
    },
    "/api/youtube/channel-videos": {
      post: {
        tags: ["YouTube"],
        summary: "Get videos for a YouTube channel",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["channelId"],
                properties: {
                  channelId: { type: "string" },
                  maxResults: { type: "integer", default: 20, maximum: 50 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Channel videos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    channelId: { type: "string" },
                    channelTitle: { type: "string" },
                    channelThumbnail: { type: "string" },
                    videos: { type: "array" },
                    totalCount: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["YouTube"],
        summary: "Get videos for a YouTube channel (GET)",
        security: [],
        parameters: [
          { name: "channelId", in: "query", required: true, schema: { type: "string" } },
          { name: "maxResults", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Channel videos" } },
      },
    },
    "/api/youtube/parse": {
      get: {
        tags: ["YouTube"],
        summary: "Parse a YouTube channel and return metadata + recent videos",
        parameters: [{ name: "channelId", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Parsed channel data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    channel: { type: "object" },
                    videos: { type: "array" },
                    suggestedChannels: { type: "array" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/to-rss": {
      post: {
        tags: ["YouTube"],
        summary: "Convert a YouTube channel URL to an RSS feed URL",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["url"], properties: { url: { type: "string", format: "uri" } } },
            },
          },
        },
        responses: {
          200: {
            description: "RSS URL",
            content: {
              "application/json": {
                schema: { type: "object", properties: { rssUrl: { type: "string" } } },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/youtube/video-search": {
      post: {
        tags: ["YouTube"],
        summary: "Search YouTube videos by query",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["query"],
                properties: {
                  query: { type: "string" },
                  maxResults: { type: "integer", default: 10 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Video search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    channelId: { type: "string" },
                    channelTitle: { type: "string" },
                    query: { type: "string" },
                    videos: { type: "array" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["YouTube"],
        summary: "Search YouTube videos by query (GET)",
        security: [],
        parameters: [
          { name: "query", in: "query", required: true, schema: { type: "string" } },
          { name: "maxResults", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: { description: "Video search results" } },
      },
    },
    "/api/youtube-items/add": {
      post: {
        tags: ["YouTube"],
        summary: "Bulk insert YouTube video items for a feed",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["feedId", "items"],
                properties: {
                  feedId: { type: "string" },
                  items: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      properties: {
                        video_id: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        thumbnail: { type: "string" },
                        published_at: { type: "string", format: "date-time" },
                        channel_title: { type: "string" },
                        url: { type: "string" },
                        image: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Insert result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    inserted: { type: "integer" },
                    errors: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── UTILITIES ───────────────────────────────────────────────────────────
    "/api/feed-proxy": {
      post: {
        tags: ["Utilities"],
        summary: "Fetch and parse an RSS feed URL (bypasses CORS)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["url"], properties: { url: { type: "string", format: "uri" } } },
            },
          },
        },
        responses: {
          200: {
            description: "Parsed feed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    feed: { type: "object", description: "Parsed feed metadata and items" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/rss-preview": {
      post: {
        tags: ["Utilities"],
        summary: "Preview an RSS feed before adding it",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["url"], properties: { url: { type: "string", format: "uri" } } },
            },
          },
        },
        responses: {
          200: {
            description: "RSS preview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    feed: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        link: { type: "string" },
                        icon: { type: "string" },
                        url: { type: "string" },
                      },
                    },
                    items: { type: "array", maxItems: 20 },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["Utilities"],
        summary: "Preview an RSS feed (GET)",
        security: [],
        parameters: [{ name: "url", in: "query", required: true, schema: { type: "string", format: "uri" } }],
        responses: { 200: { description: "RSS preview" } },
      },
    },
    "/api/image-proxy": {
      get: {
        tags: ["Utilities"],
        summary: "Proxy and cache remote images (bypasses CORS)",
        security: [],
        parameters: [{ name: "url", in: "query", required: true, schema: { type: "string", format: "uri" } }],
        responses: {
          200: { description: "Binary image data" },
          400: { description: "Missing or invalid URL" },
        },
      },
    },
    "/api/proxy": {
      post: {
        tags: ["Utilities"],
        summary: "Generic HTTP proxy for external requests",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string", format: "uri" },
                  method: { type: "string", default: "GET" },
                  headers: { type: "object" },
                  data: { description: "Request body to forward" },
                  maxRedirects: { type: "integer", default: 5 },
                  skipCache: { type: "boolean" },
                  retryCount: { type: "integer", default: 3 },
                  timeout: { type: "integer", default: 15000, description: "ms" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Proxied response" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── USER ────────────────────────────────────────────────────────────────
    "/api/user/delete": {
      delete: {
        tags: ["Auth"],
        summary: "Delete the authenticated user's account and all data",
        responses: {
          200: { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          401: { description: "Unauthorized" },
        },
      },
    },

    // ─── CLEANUP ─────────────────────────────────────────────────────────────
    "/api/cleanup": {
      get: {
        tags: ["Cron"],
        summary: "Preview old items that would be deleted (dryRun=true by default)",
        parameters: [
          { name: "olderThanDays", in: "query", schema: { type: "integer", default: 30 } },
          { name: "keepFavorites", in: "query", schema: { type: "boolean", default: true } },
          { name: "keepReadLater", in: "query", schema: { type: "boolean", default: true } },
          { name: "dryRun", in: "query", schema: { type: "boolean", default: true } },
        ],
        responses: {
          200: {
            description: "Cleanup preview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    details: { type: "object" },
                    cutoffDate: { type: "string", format: "date-time" },
                    dryRun: { type: "boolean" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Cron"],
        summary: "Delete old items for the authenticated user",
        parameters: [
          { name: "olderThanDays", in: "query", schema: { type: "integer", default: 30 } },
          { name: "keepFavorites", in: "query", schema: { type: "boolean", default: true } },
          { name: "keepReadLater", in: "query", schema: { type: "boolean", default: true } },
          { name: "dryRun", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: { description: "Cleanup result" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/cron/cleanup": {
      post: {
        tags: ["Cron"],
        summary: "Cron job — delete old items across all users (requires CRON_SECRET)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "olderThanDays", in: "query", schema: { type: "integer", default: 30 } },
          { name: "keepFavorites", in: "query", schema: { type: "boolean", default: true } },
          { name: "keepReadLater", in: "query", schema: { type: "boolean", default: true } },
          { name: "dryRun", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          200: {
            description: "Cleanup result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    details: {
                      type: "object",
                      properties: {
                        rssItems: { type: "integer" },
                        youtubeItems: { type: "integer" },
                        orphanedInteractions: { type: "integer" },
                        errors: { type: "array" },
                      },
                    },
                    cutoffDate: { type: "string", format: "date-time" },
                    dryRun: { type: "boolean" },
                  },
                },
              },
            },
          },
          401: { description: "Missing or invalid CRON_SECRET" },
        },
      },
      get: {
        tags: ["Cron"],
        summary: "Cron job (GET variant) — same as POST",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Cleanup result" } },
      },
    },
    "/api/cron/test": {
      get: {
        tags: ["Cron"],
        summary: "Test endpoint — triggers cron/cleanup and returns the result",
        security: [],
        responses: {
          200: {
            description: "Test result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    testUrl: { type: "string" },
                    cronResult: { type: "object" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
