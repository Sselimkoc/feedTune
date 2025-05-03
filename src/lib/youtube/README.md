# YouTube Service Structure

This document outlines the organization of YouTube-related code in the application.

## Directory Structure

```
src/
├── lib/
│   ├── youtube-service.js       # API route handler facade 
│   └── youtube/                 # YouTube core functionality
│       ├── service.js           # Main YouTube service implementation
│       ├── api-client.js        # YouTube API client
│       ├── utils/               # Helper functions
│       │   └── index.js         # Common utilities
│       ├── cache.js             # Caching utilities
│       ├── README.md            # This documentation file
│       └── CHANGELOG.md         # Changelog tracking refactoring progress
```

## Responsibilities

### 1. `youtube-service.js`

This file serves as a facade for the route handlers, providing simple interfaces for API routes by re-exporting functions from the main service:
- `addYoutubeChannel`: Adding YouTube channels to feeds
- `updateYoutubeChannel`: Updating YouTube channel data
- `parseYoutubeChannel`: Parsing YouTube URLs
- `deleteYoutubeChannel`: Deleting YouTube channels

### 2. `youtube/service.js`

The main service implementation that handles all YouTube functionality:
- Channel information retrieval and caching
- Video synchronization
- Search functionality
- Feed management

### 3. `youtube/api-client.js`

Direct interactions with the YouTube API:
- Channel search
- Channel details retrieval
- Video listing

### 4. `youtube/utils/index.js`

Common utility functions for YouTube operations:
- `extractChannelId`: Extract channel ID from URLs
- `createRssUrl`: Generate RSS feed URL from channel ID
- `extractVideoId`: Extract video ID from video URLs
- `createThumbnailUrl`: Generate thumbnail URLs

### 5. `youtube/cache.js`

Functions for caching YouTube data:
- Channel information caching
- Search results caching
- Cache validation and cleaning

## Usage Guidelines

1. Route handlers should only import from `youtube-service.js`
2. Internal components should import from `youtube/service.js`
3. All YouTube API keys and configuration should be centralized
4. Caching strategies should be consistent

## Recent Changes

We've refactored the YouTube-related code to better organize functionality:

1. Consolidated duplicate implementations into a single service
2. Eliminated the unnecessary complexity with a simpler folder structure
3. Created a clean facade for API routes
4. Organized functionality into logical modules

For more details, see the [CHANGELOG.md](./CHANGELOG.md) file. 