import React from "react";
import PropTypes from "prop-types";

export function ModernContentCard({ item, onFavorite, onReadLater }) {
  return (
    <div className="modern-content-card">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <button onClick={() => onFavorite(item)}>Favorite</button>
      <button onClick={() => onReadLater(item)}>Read Later</button>
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
