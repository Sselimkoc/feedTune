import PropTypes from "prop-types";
import { Heart, Bookmark, PlayCircle, Youtube, Rss } from "lucide-react";

export function ModernContentCard({ item, onFavorite, onReadLater }) {
  // Use thumbnail for YouTube, image for others
  const imageUrl =
    item.type === "youtube"
      ? item.thumbnail || "/images/placeholder.webp"
      : item.image || "/images/placeholder.webp";

  return (
    <div className="rounded-2xl shadow-xl bg-white/20 dark:bg-white/10 backdrop-blur-lg border border-white/30 dark:border-white/10 overflow-hidden flex flex-col transition-all hover:scale-105 hover:shadow-emerald-500/30 w-full max-w-md mx-auto cursor-pointer">
      {/* Platform Icon */}
      <div className="absolute z-20 m-3">
        {item.type === "youtube" ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 dark:bg-zinc-900/70 backdrop-blur text-xs font-semibold text-red-600 shadow">
            <Youtube className="w-4 h-4 text-red-500" /> YouTube
          </span>
        ) : item.type === "rss" ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/60 dark:bg-zinc-900/70 backdrop-blur text-xs font-semibold text-orange-500 shadow">
            <Rss className="w-4 h-4 text-orange-400" /> RSS
          </span>
        ) : null}
      </div>
      {/* Thumbnail */}
      <div className="relative w-full pt-[56.25%] bg-zinc-800">
        <img
          src={imageUrl}
          alt={item.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play icon overlay */}
        <span className="absolute inset-0 flex items-center justify-center">
          <PlayCircle className="w-14 h-14 text-white/90 drop-shadow-xl" />
        </span>
      </div>
      {/* Content */}
      <div className="flex flex-col flex-grow p-4 text-white">
        <h3 className="text-lg font-semibold mb-2 text-emerald-300 leading-tight line-clamp-2">
          {item.title || "Başlıksız Video"}
        </h3>
        <p className="text-sm text-zinc-300 mb-4 flex-grow line-clamp-3">
          {item.description || "Bu video için açıklama bulunmamaktadır."}
        </p>
        <div className="flex items-center justify-end border-t border-white/10 pt-3 mt-auto gap-2">
          {/* Logo and Channel/Feed Title */}
          <div className="flex items-center flex-1 min-w-0 gap-2 text-xs text-zinc-400 truncate">
            {item.logoUrl && (
              <img
                src={item.logoUrl}
                alt="Logo"
                className="w-6 h-6 rounded-full object-cover border border-white/20"
                loading="lazy"
              />
            )}
            <span className="truncate">
              {item.type === "youtube"
                ? item.channelTitle || item.channel || ""
                : item.feedTitle || item.feed_title || ""}
            </span>
          </div>
          <button
            className="icon-button flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 hover:text-emerald-300 transition"
            onClick={onFavorite}
            type="button"
            aria-label="Favori"
          >
            <Heart className="w-5 h-5" />
          </button>
          <button
            className="icon-button flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 hover:text-sky-400 transition"
            onClick={onReadLater}
            type="button"
            aria-label="Sonra İzle"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

ModernContentCard.propTypes = {
  item: PropTypes.shape({
    image: PropTypes.string,
    thumbnail: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  onFavorite: PropTypes.func,
  onReadLater: PropTypes.func,
};
