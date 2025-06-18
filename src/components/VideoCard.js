import React from "react";

const VideoCard = ({ video }) => {
  if (!video) return null;

  const handleFavoriteClick = () => {
    // Favorilere ekleme/çıkarma mantığı
    console.log(`${video.title} favorilere eklendi/çıkarıldı!`);
  };

  const handleWatchLaterClick = () => {
    // Sonra izle listesine ekleme mantığı
    console.log(`${video.title} sonra izle listesine eklendi!`);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col text-white transition-transform duration-200 ease-in-out cursor-pointer hover:-translate-y-1 hover:shadow-xl max-w-sm">
      {/* Video Thumbnail Container */}
      <div
        className="relative w-full bg-gray-900"
        style={{ paddingTop: "56.25%" }}
      >
        {/* Source Badge on top-left of thumbnail */}
        <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium z-10 shadow">
          {video.source || "YouTube"}
        </span>
        <img
          src={
            video.thumbnailUrl ||
            "https://via.placeholder.com/480x270?text=Video+Thumbnail"
          }
          alt={video.title || "Video Thumbnail"}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        {/* Play icon overlay (optional) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-white opacity-90 pointer-events-none">
          ▶
        </div>
      </div>

      {/* Video Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-green-300 leading-tight line-clamp-2">
          {video.title || "Başlıksız Video"}
        </h3>

        <p className="text-sm text-gray-300 mb-4 flex-grow line-clamp-3">
          {video.description || "Bu video için açıklama bulunmamaktadır."}
        </p>

        {/* Bottom Layout - Channel Info and Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white border-opacity-10">
          {/* Channel Info */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={
                video.channelLogo || "https://via.placeholder.com/32x32?text=C"
              }
              alt={video.channelName || "Channel"}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-gray-300 truncate">
              {video.channelName || "Bilinmeyen Kanal"}
            </span>
          </div>

          {/* Video Actions */}
          <div className="flex gap-2 ml-4">
            <button
              className="flex items-center justify-center bg-transparent border border-gray-500 text-white cursor-pointer w-9 h-9 rounded text-base transition-colors duration-200 hover:bg-white hover:bg-opacity-10 hover:text-blue-400"
              onClick={handleWatchLaterClick}
              title="Kaydet"
            >
              {/* Save/Bookmark Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75v-1.5A2.25 2.25 0 0 0 15 3h-6A2.25 2.25 0 0 0 6.75 5.25v15l5.25-3 5.25 3v-15z"
                />
              </svg>
            </button>
            <button
              className="flex items-center justify-center bg-transparent border-none text-white cursor-pointer w-9 h-9 rounded-full text-xl transition-colors duration-200 hover:bg-white hover:bg-opacity-10 hover:text-red-400"
              onClick={handleFavoriteClick}
              title="Favori"
            >
              ♡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
