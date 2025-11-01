// Demo data for users to try the application without logging in
export const demoFeeds = [
  {
    id: "demo-feed-1",
    title: "TechCrunch",
    description: "Latest technology news and startup information",
    url: "https://techcrunch.com/feed/",
    feed_type: "rss",
    thumbnail:
      "https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png",
    category: "tech",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    last_synced_at: "2024-01-15T10:00:00Z",
    is_active: true,
    user_id: "demo-user",
  },
  {
    id: "demo-feed-2",
    title: "The Verge",
    description: "Technology, science, art, and culture",
    url: "https://www.theverge.com/rss/index.xml",
    feed_type: "rss",
    thumbnail:
      "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395359/favicon-32x32.0.png",
    category: "tech",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    last_synced_at: "2024-01-15T10:00:00Z",
    is_active: true,
    user_id: "demo-user",
  },
  {
    id: "demo-feed-3",
    title: "Marques Brownlee",
    description: "Tech reviews and gadget discussions",
    url: "https://www.youtube.com/@mkbhd",
    feed_type: "youtube",
    thumbnail:
      "https://yt3.googleusercontent.com/lkH37D712tiyphnu9Idqj4bCMx30zYJBP9_6aZqIVT3rJcag4skPHcz5MIRR6gqS8Nkmdvsa=s176-c-k-c0x00ffffff-no-rj",
    category: "tech",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    last_synced_at: "2024-01-15T10:00:00Z",
    is_active: true,
    user_id: "demo-user",
    channel_id: "UCBJycsmduvYEL83R_U4JriQ",
  },
  {
    id: "demo-feed-4",
    title: "Linus Tech Tips",
    description: "Computer hardware reviews and tech news",
    url: "https://www.youtube.com/@LinusTechTips",
    feed_type: "youtube",
    thumbnail:
      "https://yt3.googleusercontent.com/lkH37D712tiyphnu9Idqj4bCMx30zYJBP9_6aZqIVT3rJcag4skPHcz5MIRR6gqS8Nkmdvsa=s176-c-k-c0x00ffffff-no-rj",
    category: "tech",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    last_synced_at: "2024-01-15T10:00:00Z",
    is_active: true,
    user_id: "demo-user",
    channel_id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
  },
  {
    id: "demo-feed-5",
    title: "BBC News",
    description: "Latest news from around the world",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    feed_type: "rss",
    thumbnail: "https://ichef.bbci.co.uk/images/ic/480x240/p08h6q8k.jpg",
    category: "news",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    last_synced_at: "2024-01-15T10:00:00Z",
    is_active: true,
    user_id: "demo-user",
  },
];

export const demoRssItems = [
  {
    id: "demo-rss-1",
    feed_id: "demo-feed-1",
    title: "Apple announces new iPhone with revolutionary features",
    description:
      "Apple has unveiled its latest iPhone model featuring breakthrough technology including advanced AI capabilities and improved battery life.",
    link: "https://techcrunch.com/2024/01/15/apple-new-iphone/",
    guid: "demo-rss-1-guid",
    published_at: "2024-01-15T09:00:00Z",
    author: "TechCrunch Staff",
    thumbnail:
      "https://techcrunch.com/wp-content/uploads/2024/01/iphone-15.jpg",
    content:
      "Apple's latest iPhone introduces revolutionary features that set new standards in mobile technology...",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-rss-2",
    feed_id: "demo-feed-1",
    title: "Tesla's autonomous driving breakthrough",
    description:
      "Tesla has achieved a major milestone in autonomous driving technology, bringing us closer to fully self-driving vehicles.",
    link: "https://techcrunch.com/2024/01/15/tesla-autonomous-driving/",
    guid: "demo-rss-2-guid",
    published_at: "2024-01-15T08:30:00Z",
    author: "Sarah Johnson",
    thumbnail:
      "https://techcrunch.com/wp-content/uploads/2024/01/tesla-autonomous.jpg",
    content:
      "Tesla's latest software update includes significant improvements to its Full Self-Driving system...",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-rss-3",
    feed_id: "demo-feed-2",
    title: "The future of virtual reality gaming",
    description:
      "VR gaming is evolving rapidly with new technologies that promise to revolutionize how we play and interact with digital worlds.",
    link: "https://www.theverge.com/2024/01/15/vr-gaming-future/",
    guid: "demo-rss-3-guid",
    published_at: "2024-01-15T07:45:00Z",
    author: "Alex Chen",
    thumbnail:
      "https://cdn.vox-cdn.com/uploads/chorus_asset/file/2024/01/vr-gaming.jpg",
    content:
      "Virtual reality gaming is entering a new era with advancements in haptic feedback and spatial computing...",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-rss-4",
    feed_id: "demo-feed-5",
    title: "Global climate summit reaches historic agreement",
    description:
      "World leaders have agreed on unprecedented measures to combat climate change at the latest international summit.",
    link: "https://www.bbc.com/news/world-climate-summit-2024",
    guid: "demo-rss-4-guid",
    published_at: "2024-01-15T06:15:00Z",
    author: "BBC News",
    thumbnail: "https://ichef.bbci.co.uk/images/ic/480x240/p08h6q8k.jpg",
    content:
      "The historic climate agreement includes commitments from all major economies to reduce emissions...",
    created_at: "2024-01-15T10:00:00Z",
  },
];

export const demoYoutubeItems = [
  {
    id: "demo-yt-1",
    feed_id: "demo-feed-3",
    video_id: "demo-video-1",
    title: "iPhone 15 Pro Review: Worth the Upgrade?",
    description:
      "In this comprehensive review, I test the iPhone 15 Pro's new features including the titanium design, improved camera system, and USB-C port.",
    thumbnail: "https://i.ytimg.com/vi/demo-video-1/maxresdefault.jpg",
    published_at: "2024-01-15T09:00:00Z",
    channel_title: "Marques Brownlee",
    url: "https://www.youtube.com/watch?v=demo-video-1",
    duration: "PT15M30S",
    view_count: 2500000,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-yt-2",
    feed_id: "demo-feed-3",
    video_id: "demo-video-2",
    title: "The Best Gaming Laptops of 2024",
    description:
      "I've tested dozens of gaming laptops this year. Here are the top performers for different budgets and use cases.",
    thumbnail: "https://i.ytimg.com/vi/demo-video-2/maxresdefault.jpg",
    published_at: "2024-01-15T08:30:00Z",
    channel_title: "Marques Brownlee",
    url: "https://www.youtube.com/watch?v=demo-video-2",
    duration: "PT12M45S",
    view_count: 1800000,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-yt-3",
    feed_id: "demo-feed-4",
    video_id: "demo-video-3",
    title: "Building a $5000 Gaming PC",
    description:
      "Watch as we build an ultimate gaming PC with the latest RTX 4090 and Intel i9 processor. Can it run Crysis?",
    thumbnail: "https://i.ytimg.com/vi/demo-video-3/maxresdefault.jpg",
    published_at: "2024-01-15T07:15:00Z",
    channel_title: "Linus Tech Tips",
    url: "https://www.youtube.com/watch?v=demo-video-3",
    duration: "PT20M10S",
    view_count: 3200000,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-yt-4",
    feed_id: "demo-feed-4",
    video_id: "demo-video-4",
    title: "Why AMD is Beating Intel Right Now",
    description:
      "AMD's latest processors are dominating the market. Let's break down why and what this means for consumers.",
    thumbnail: "https://i.ytimg.com/vi/demo-video-4/maxresdefault.jpg",
    published_at: "2024-01-15T06:45:00Z",
    channel_title: "Linus Tech Tips",
    url: "https://www.youtube.com/watch?v=demo-video-4",
    duration: "PT18M25S",
    view_count: 2100000,
    created_at: "2024-01-15T10:00:00Z",
  },
];

// Demo interactions (favorites, read later, etc.)
export const demoInteractions = {
  rss: [
    {
      item_id: "demo-rss-1",
      user_id: "demo-user",
      is_favorite: true,
      is_read: true,
      is_read_later: false,
    },
    {
      item_id: "demo-rss-3",
      user_id: "demo-user",
      is_favorite: false,
      is_read: false,
      is_read_later: true,
    },
  ],
  youtube: [
    {
      item_id: "demo-yt-1",
      user_id: "demo-user",
      is_favorite: true,
      is_read: true,
      is_read_later: false,
    },
    {
      item_id: "demo-yt-3",
      user_id: "demo-user",
      is_favorite: true,
      is_read: false,
      is_read_later: false,
    },
  ],
};

// Demo statistics
export const demoStats = {
  totalFeeds: demoFeeds.length,
  totalItems: demoRssItems.length + demoYoutubeItems.length,
  totalFavorites:
    demoInteractions.rss.filter((i) => i.is_favorite).length +
    demoInteractions.youtube.filter((i) => i.is_favorite).length,
  totalReadLater:
    demoInteractions.rss.filter((i) => i.is_read_later).length +
    demoInteractions.youtube.filter((i) => i.is_read_later).length,
  feedsByType: {
    rss: demoFeeds.filter((f) => f.feed_type === "rss").length,
    youtube: demoFeeds.filter((f) => f.feed_type === "youtube").length,
  },
  itemsByType: {
    rss: demoRssItems.length,
    youtube: demoYoutubeItems.length,
  },
};

// Helper function to get all demo items with interactions
export function getDemoItemsWithInteractions() {
  const rssItemsWithInteractions = demoRssItems.map((item) => {
    const interaction = demoInteractions.rss.find(
      (i) => i.item_id === item.id
    ) || {
      is_favorite: false,
      is_read: false,
      is_read_later: false,
    };

    return {
      ...item,
      type: "rss",
      feed_type: "rss",
      is_favorite: interaction.is_favorite,
      is_read: interaction.is_read,
      is_read_later: interaction.is_read_later,
      thumbnailUrl: item.thumbnail,
      channelName: demoFeeds.find((f) => f.id === item.feed_id)?.title || "",
      channelLogo:
        demoFeeds.find((f) => f.id === item.feed_id)?.thumbnail || "",
    };
  });

  const youtubeItemsWithInteractions = demoYoutubeItems.map((item) => {
    const interaction = demoInteractions.youtube.find(
      (i) => i.item_id === item.id
    ) || {
      is_favorite: false,
      is_read: false,
      is_read_later: false,
    };

    return {
      ...item,
      type: "youtube",
      feed_type: "youtube",
      is_favorite: interaction.is_favorite,
      is_read: interaction.is_read,
      is_read_later: interaction.is_read_later,
      thumbnailUrl: item.thumbnail,
      channelName: item.channel_title,
      channelLogo:
        demoFeeds.find((f) => f.id === item.feed_id)?.thumbnail || "",
    };
  });

  return [...rssItemsWithInteractions, ...youtubeItemsWithInteractions];
}

// Helper function to get demo favorites
export function getDemoFavorites() {
  return getDemoItemsWithInteractions().filter((item) => item.is_favorite);
}

// Helper function to get demo read later items
export function getDemoReadLater() {
  return getDemoItemsWithInteractions().filter((item) => item.is_read_later);
}
