import Parser from 'rss-parser';
import axios from 'axios';
import { extractDomain } from '@/lib/utils';

// Create parser instance
const parser = new Parser({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'User-Agent': 'FeedTune/1.0 (https://feedtune.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
  },
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
    ],
    feed: [
      ['image', 'feedImage'],
      ['logo', 'logo'],
      ['icon', 'icon'],
    ],
  },
});

/**
 * API Route for fetching and parsing RSS feeds
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    // Make a preliminary request to get headers and check if the URL is valid
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'FeedTune/1.0 (https://feedtune.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
      },
      maxRedirects: 5,
      validateStatus: status => status < 400, // Accept 200-399 status codes
    });
    
    // Try to parse the feed
    let feed;
    try {
      feed = await parser.parseString(response.data);
    } catch (parseError) {
      console.error('RSS parsing error:', parseError);
      return res.status(422).json({ error: 'Invalid RSS feed format' });
    }
    
    // Extract domain from feed link or URL
    const domain = extractDomain(feed.link || url);
    
    // Process items to normalize and limit them
    const items = (feed.items || []).slice(0, 5).map(item => ({
      id: item.guid || item.id || item.link,
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      description: item.description || item.contentEncoded || item.content || '',
      author: item.creator || item.author || item['dc:creator'] || '',
      categories: item.categories || [],
      // Attempt to find an image
      image: extractImageFromItem(item),
    }));
    
    // Prepare the feed data to return
    const feedData = {
      title: feed.title || 'Untitled Feed',
      description: feed.description || '',
      link: feed.link || url,
      feedUrl: url,
      image: feed.image?.url || feed.feedImage?.url || feed.logo || feed.icon || null,
      domain,
      language: feed.language || 'en',
      lastBuildDate: feed.lastBuildDate || new Date().toISOString(),
      items,
      itemCount: feed.items?.length || 0,
    };
    
    return res.status(200).json(feedData);
    
  } catch (error) {
    console.error('RSS preview error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout' });
    }
    
    if (error.response) {
      // Server responded with an error status
      return res.status(error.response.status).json({ 
        error: `Error fetching feed: ${error.response.statusText || error.message}` 
      });
    }
    
    // Generic error
    return res.status(500).json({ error: `Failed to fetch feed: ${error.message}` });
  }
}

/**
 * Helper function to extract an image from a feed item
 */
function extractImageFromItem(item) {
  // Check for various image formats in the item
  if (item.media?.$.url) {
    return item.media.$.url;
  }
  
  if (item.mediaThumbnail?.$.url) {
    return item.mediaThumbnail.$.url;
  }
  
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  // Try to extract image from HTML content
  const content = item.contentEncoded || item.content || item.description || '';
  if (content) {
    // Simple regex to extract image URL from HTML
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = content.match(imgRegex);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
} 