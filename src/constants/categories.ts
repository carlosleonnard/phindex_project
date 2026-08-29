import {
  Users,
  Film,
  Music,
  Palette,
  Brain,
  Microscope,
  Trophy,
  Briefcase,
  Building,
  Skull,
  Church,
  Shield,
} from "lucide-react";

export const CATEGORY_OPTIONS = [
  "Pop Culture",
  "Music and Entertainment",
  "Arts",
  "Philosophy",
  "Sciences",
  "Sports",
  "Business",
  "Politics",
  "Criminals",
  "Religion",
  "Military",
];

export const CATEGORY_ICONS: Record<string, any> = {
  "Community": Users,
  "Pop Culture": Film,
  "Music and Entertainment": Music,
  "Arts": Palette,
  "Philosophy": Brain,
  "Sciences": Microscope,
  "Sports": Trophy,
  "Business": Briefcase,
  "Politics": Building,
  "Criminals": Skull,
  "Religion": Church,
  "Military": Shield,
};

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  "Community": "community",
  "Pop Culture": "pop-culture",
  "Music and Entertainment": "music-and-entertainment",
  "Arts": "arts",
  "Philosophy": "philosophy",
  "Sciences": "sciences",
  "Sports": "sports",
  "Business": "business",
  "Politics": "politics",
  "Criminals": "criminals",
  "Religion": "religion",
  "Military": "military",
};

export const SLUG_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([k, v]) => [v, k])
);

// Map slug "community" -> display name "User Profiles"
SLUG_TO_CATEGORY["community"] = "User Profiles";

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "community": "Profiles of anonymous people and regular platform users",
  "pop-culture": "Celebrities, influencers and pop culture personalities",
  "music-and-entertainment": "Artists, musicians, actors and entertainment professionals",
  "arts": "Visual artists, writers and arts professionals",
  "philosophy": "Philosophers, thinkers and intellectuals",
  "sciences": "Scientists, researchers and academics",
  "sports": "Athletes, sports players and sports professionals",
  "business": "Entrepreneurs, executives and business leaders",
  "politics": "Politicians, government leaders and political figures",
  "criminals": "Notorious criminals, outlaws and infamous figures",
  "religion": "Religious leaders, theologians and spiritual figures",
  "military": "Military leaders, strategists and war heroes",
};

export const CATEGORY_IMAGES: Record<string, string> = {
  "community": "/category-community.svg",
  "pop-culture": "/category-pop-culture.svg",
  "music-and-entertainment": "/category-music-and-entertainment.svg",
  "arts": "/category-arts.svg",
  "philosophy": "/category-philosophy.svg",
  "sciences": "/category-sciences.svg",
  "sports": "/category-sports.svg",
  "business": "/category-business.svg",
  "politics": "/category-politics.svg",
  "criminals": "/category-criminals.svg",
  "religion": "/category-religion.svg",
  "military": "/category-military.svg",
};

export const SUBCATEGORIES: Record<string, string[]> = {
  "Pop Culture": [
    "Memes & Internet",
    "Actors & Actresses",
    "Dancers",
    "Famous For Being Famous",
    "Film & TV Crew",
    "Hosts & Presenters",
    "Models",
    "News & Journalists",
    "People of Classic Hollywood",
    "Voice Acting",
    "Animation",
    "Anime & Manga",
    "Video Games",
    "Celebrities",
    "Comics",
  ],
  "Music and Entertainment": [
    "Rock",
    "Pop",
    "Hip-Hop & Rap",
    "Electronic Music",
    "Jazz & Blues",
    "Classical Music",
    "K-Pop",
    "R&B & Soul",
    "Reggae & Latin",
  ],
  "Arts": [
    "Painting & Sculpture",
    "Cinema",
    "Photography",
    "Architecture",
    "Theater",
    "Literature",
    "Dance",
    "Fashion & Design",
  ],
  "Philosophy": [
    "African Philosophy",
    "Confucianism",
    "Eastern Philosophy",
    "Indigenous American Philosophy",
    "Latin American Philosophy",
    "Middle Eastern Philosophy",
    "Western Philosophy",
  ],
  "Sciences": [
    "Physics",
    "Biology",
    "Chemistry",
    "Astronomy & Space",
    "Medicine & Health",
    "Technology",
    "Mathematics",
    "Psychology",
    "Environment",
  ],
  "Sports": [
    "Football (Soccer)",
    "Basketball",
    "Tennis",
    "Athletics",
    "Motorsport",
    "Martial Arts",
    "Swimming",
    "Olympics",
    "Esports",
  ],
  "Business": [
    "Entrepreneurship",
    "Finance & Investments",
    "Marketing",
    "Big Companies",
    "Global Economy",
    "Cryptocurrency",
    "Innovation & Startups",
    "International Trade",
  ],
  "Politics": [
    "Geopolitics",
    "Human Rights",
    "Democracy & Elections",
    "International Relations",
    "Social Movements",
    "Political History",
    "International Organizations",
    "Law & Constitutions",
  ],
  "Criminals": [
    "Serial Killers",
    "Organized Crime",
    "White Collar Crime",
    "Drug Lords",
    "Hackers & Cybercrime",
    "Historical Criminals",
    "Heists & Robberies",
    "War Criminals",
  ],
  "Religion": [
    "Christianity",
    "Islam",
    "Judaism",
    "Buddhism",
    "Hinduism",
    "Indigenous Religions",
    "New Religious Movements",
    "Mythology",
  ],
  "Military": [
    "Battles & Wars",
    "Military Strategy",
    "Weapons & Technology",
    "Navy & Air Force",
    "Special Forces",
    "Military Leaders",
    "Nuclear Weapons",
    "Peacekeeping",
  ],
};

// Helper: get parent category from subcategory name
export function getCategoryFromSubcategory(subcategory: string): string | null {
  for (const [category, subs] of Object.entries(SUBCATEGORIES)) {
    if (subs.includes(subcategory)) return category;
  }
  return null;
}

// Helper: get category slug from category display name
export function getCategorySlug(categoryName: string): string {
  return CATEGORY_SLUG_MAP[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
}
