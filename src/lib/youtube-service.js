/**
 * YouTube Service Facade for API Routes
 * This file is a facade for the YouTube service that is used by API routes.
 * It imports and re-exports the functions from the consolidated service module.
 */

import { youtubeService } from "@/lib/youtube/service";

// Re-export the functions needed by API routes
export const {
  addYoutubeChannel,
  updateYoutubeChannel,
  parseYoutubeChannel,
  deleteYoutubeChannel,
} = youtubeService;
