export const FEED_TYPES = {
  YOUTUBE: "youtube",
  RSS: "rss",
};

export const DIALOG_STEPS = {
  INPUT: "input",
  SEARCH: "search",
  PREVIEW: "preview",
};

export const CATEGORIES = [
  { value: "general", label: "General", icon: "Globe" },
  { value: "tech", label: "Technology", icon: "Sparkles" },
  { value: "news", label: "News", icon: "AlignLeft" },
  { value: "entertainment", label: "Entertainment", icon: "Film" },
  { value: "other", label: "Other", icon: "Plus" },
];

export const FORM_DEFAULT_VALUES = {
  title: "",
  url: "",
  type: "youtube",
  category: "general",
  fetch_full_content: false,
};
