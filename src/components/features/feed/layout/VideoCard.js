import React from "react";
import { Heart, Bookmark } from "lucide-react";

const VideoCard = ({ video, onToggleFavorite, onToggleReadLater }) => {
  if (!video) return null;

  const handleFavoriteClick = () => {
    if (onToggleFavorite) onToggleFavorite(video);
  };

  const handleWatchLaterClick = () => {
    if (onToggleReadLater) onToggleReadLater(video);
  };

  return (
    <div className="bg-white dark:bg-[#181C2A] rounded-lg overflow-hidden shadow-lg flex flex-col text-gray-900 dark:text-white transition-transform duration-200 ease-in-out cursor-pointer hover:-translate-y-1 hover:shadow-xl max-w-sm">
      {/* Video Thumbnail Container */}
      <div
        className="relative w-full bg-gray-100 dark:bg-gray-900"
        style={{ paddingTop: "56.25%" }}
      >
        {/* Source Badge on top-left of thumbnail */}
        <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium z-10 shadow">
          {video.source || "YouTube"}
        </span>
        <img
          src={
            video.thumbnail ||
            "https://via.placeholder.com/480x270?text=Video+Thumbnail"
          }
          alt={video.title || "Video Thumbnail"}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>

      {/* Video Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white leading-tight line-clamp-2">
          {video.title || "Başlıksız Video"}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-3">
          {video.description || "Bu video için açıklama bulunmamaktadır."}
        </p>

        {/* Bottom Layout - Channel Info and Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-white/10">
          {/* Channel Info */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={
                video.channelLogo || "https://via.placeholder.com/32x32?text=C"
              }
              alt={video.channelName || "Channel"}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {video.channelName || "Bilinmeyen Kanal"}
            </span>
          </div>

          {/* Video Actions */}
          <div className="flex gap-2 ml-4">
            <button
              className={`flex items-center justify-center bg-transparent border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-white cursor-pointer w-9 h-9 rounded text-base transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 ${
                video.is_read_later
                  ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10"
                  : ""
              }`}
              onClick={handleWatchLaterClick}
              title="Kaydet"
            >
              {/* Save/Bookmark Icon */}
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
              onClick={handleFavoriteClick}
              title="Favori"
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
};

export default VideoCard;
