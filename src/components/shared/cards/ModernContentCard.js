import React from "react";
import PropTypes from "prop-types";

export function ModernContentCard({ item, onFavorite, onReadLater }) {
  return (
    <div className="bg-white dark:bg-[#181C2A] text-gray-900 dark:text-white shadow-lg rounded-2xl p-6 mb-4">
      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {item.description}
      </p>
      <button
        className="mr-2 px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
        onClick={() => onFavorite(item)}
      >
        Favorite
      </button>
      <button
        className="px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200"
        onClick={() => onReadLater(item)}
      >
        Read Later
      </button>
    </div>
  );
}

ModernContentCard.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onFavorite: PropTypes.func.isRequired,
  onReadLater: PropTypes.func.isRequired,
};
