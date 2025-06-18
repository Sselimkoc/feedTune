import React from "react";
import { Heart, Bookmark } from "lucide-react";

export function FavoriteDetailCard({
  video,
  onToggleFavorite,
  onToggleReadLater,
}) {
  if (!video) return null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col text-white transition-transform duration-200 ease-in-out max-w-sm mx-auto mb-8">
      {/* Video Thumbnail Container */}
      <div
        className="relative w-full bg-gray-900"
        style={{ paddingTop: "56.25%" }}
      >
        <img
          src={video.thumbnail || "/images/placeholder.webp"}
          alt={video.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-foreground leading-tight line-clamp-2">
          {video.title}
        </h3>
        <p className="text-sm text-gray-300 mb-4 flex-grow line-clamp-3">
          {video.description || "No description available."}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white border-opacity-10">
          {/* Channel Info */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={video.channelLogo || "/images/placeholder.webp"}
              alt={video.channelName || "Channel"}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-gray-300 truncate">
              {video.channelName || "Unknown Channel"}
            </span>
          </div>
          {/* Video Actions */}
          <div className="flex gap-2 ml-4">
            <button
              className={`flex items-center justify-center bg-transparent border border-gray-500 text-white cursor-pointer w-9 h-9 rounded text-base transition-colors duration-200 hover:bg-white hover:bg-opacity-10 ${
                video.is_read_later
                  ? "text-blue-400 bg-blue-500/10"
                  : "hover:text-blue-400"
              }`}
              onClick={() => onToggleReadLater && onToggleReadLater(video)}
              aria-label="Read Later"
              title="Read Later"
            >
              <Bookmark
                className="w-5 h-5"
                fill={video.is_read_later ? "currentColor" : "none"}
                stroke="currentColor"
              />
            </button>
            <button
              className={`flex items-center justify-center bg-transparent border-none text-white cursor-pointer w-9 h-9 rounded-full text-xl transition-colors duration-200 hover:bg-white hover:bg-opacity-10 ${
                video.is_favorite
                  ? "text-red-500 bg-red-500/10"
                  : "hover:text-red-500"
              }`}
              onClick={() => onToggleFavorite && onToggleFavorite(video)}
              aria-label="Favorite"
              title="Favorite"
            >
              <Heart
                className="w-5 h-5"
                fill={video.is_favorite ? "currentColor" : "none"}
                stroke="currentColor"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
