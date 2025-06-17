import PropTypes from "prop-types";
import { Heart, Bookmark, PlayCircle } from "lucide-react";

export function ModernContentCard({ item, onFavorite, onReadLater }) {
  // Use thumbnail for YouTube, image for others
  const imageUrl =
    item.type === "youtube"
      ? item.thumbnail || "/images/placeholder.webp"
      : item.image || "/images/placeholder.webp";

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl w-full max-w-md mx-auto cursor-pointer">
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
