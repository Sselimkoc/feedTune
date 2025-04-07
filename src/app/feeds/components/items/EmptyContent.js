import React, { useLanguage } from "react";
import { Rss, Star, Clock, Search, Filter, FileX } from "lucide-react";

// Boş içerik durumu gösterimi bileşeni
const EmptyContent = ({ type = "default" }) => {
  const { t } = useLanguage();

  // İçerik tipine göre farklı mesaj ve ikon gösterme
  let title = "";
  let description = "";
  let icon = null;

  switch (type) {
    case "feed":
      title = t("feeds.emptyFeedTitle");
      description = t("feeds.emptyFeedDescription");
      icon = <Rss className="h-12 w-12 mb-4 text-gray-400" />;
      break;
    case "favorites":
      title = t("feeds.emptyFavoritesTitle");
      description = t("feeds.emptyFavoritesDescription");
      icon = <Star className="h-12 w-12 mb-4 text-gray-400" />;
      break;
    case "readLater":
      title = t("feeds.emptyReadLaterTitle");
      description = t("feeds.emptyReadLaterDescription");
      icon = <Clock className="h-12 w-12 mb-4 text-gray-400" />;
      break;
    case "search":
      title = t("feeds.emptySearchTitle");
      description = t("feeds.emptySearchDescription");
      icon = <Search className="h-12 w-12 mb-4 text-gray-400" />;
      break;
    case "filter":
      title = t("feeds.emptyFilterTitle");
      description = t("feeds.emptyFilterDescription");
      icon = <Filter className="h-12 w-12 mb-4 text-gray-400" />;
      break;
    default:
      title = t("feeds.emptyDefaultTitle");
      description = t("feeds.emptyDefaultDescription");
      icon = <FileX className="h-12 w-12 mb-4 text-gray-400" />;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-12 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        {description}
      </p>
    </div>
  );
};

export default EmptyContent;
