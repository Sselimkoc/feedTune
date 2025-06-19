import React from "react";
import { Heart, Bookmark } from "lucide-react";

export function FavoriteDetailCard({
  video,
  onToggleFavorite,
  onToggleReadLater,
}) {
  if (!video) return null;

  return (
    <div className="bg-white dark:bg-[#181C2A] rounded-lg overflow-hidden shadow-lg flex flex-col text-gray-900 dark:text-white transition-transform duration-200 ease-in-out w-full max-w-full sm:max-w-sm mx-auto mb-6">
      {/* Video Thumbnail Container */}
      <div
        className="relative w-full bg-gray-100 dark:bg-gray-900"
        style={{ paddingTop: "56.25%" }}
      >
        <img
          src={video.thumbnail || "/images/placeholder.webp"}
          alt={video.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white leading-tight line-clamp-1 sm:line-clamp-2">
          {video.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 flex-grow line-clamp-2 sm:line-clamp-3">
          {video.description || "No description available."}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t border-gray-200 dark:border-white/10">
          {/* Channel Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <img
              src={video.channelLogo || "/images/placeholder.webp"}
              alt={video.channelName || "Channel"}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
              {video.channelName || "Unknown Channel"}
            </span>
          </div>
          {/* Video Actions */}
          <div className="flex gap-2 ml-2 sm:ml-4">
            <button
              className={`flex items-center justify-center bg-transparent border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white cursor-pointer w-9 h-9 rounded text-base transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                video.is_read_later
                  ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10"
                  : ""
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
              className={`flex items-center justify-center bg-transparent border-none text-gray-700 dark:text-white cursor-pointer w-9 h-9 rounded-full text-xl transition-colors duration-200 hover:bg-red-50 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-red-400 ${
                video.is_favorite
                  ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10"
                  : ""
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
