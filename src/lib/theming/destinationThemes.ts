// Destination-aware theming system
// Each destination gets a unique color palette that evokes its character

export interface DestinationTheme {
  id: string;
  name: string;
  primary: string;      // Main accent (buttons, links, active states)
  secondary: string;    // Supporting color
  accent: string;       // Highlights, badges
  backgroundTint: string;  // Subtle page tint (rgba)
  cardTint: string;        // Card backgrounds (rgba)
  mood: 'warm' | 'cool' | 'neutral' | 'vibrant';
  heroImage: string;    // Curated hero image URL
}

// Curated themes for popular destinations
export const DESTINATION_THEMES: Record<string, DestinationTheme> = {
  // Asia
  'tokyo': {
    id: 'tokyo',
    name: 'Tokyo',
    primary: '#E91E63',      // Cherry blossom pink
    secondary: '#9C27B0',    // Neon purple
    accent: '#FF4081',       // Hot pink
    backgroundTint: 'rgba(233, 30, 99, 0.02)',
    cardTint: 'rgba(233, 30, 99, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
  },
  'kyoto': {
    id: 'kyoto',
    name: 'Kyoto',
    primary: '#8BC34A',      // Bamboo green
    secondary: '#795548',    // Temple wood
    accent: '#CDDC39',       // Spring green
    backgroundTint: 'rgba(139, 195, 74, 0.02)',
    cardTint: 'rgba(139, 195, 74, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  },
  'bali': {
    id: 'bali',
    name: 'Bali',
    primary: '#4CAF50',      // Tropical green
    secondary: '#FF9800',    // Temple gold
    accent: '#00BCD4',       // Ocean blue
    backgroundTint: 'rgba(76, 175, 80, 0.02)',
    cardTint: 'rgba(76, 175, 80, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  },
  'singapore': {
    id: 'singapore',
    name: 'Singapore',
    primary: '#00BCD4',      // Marina blue
    secondary: '#4CAF50',    // Garden green
    accent: '#FF5722',       // Hawker orange
    backgroundTint: 'rgba(0, 188, 212, 0.02)',
    cardTint: 'rgba(0, 188, 212, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
  },
  'bangkok': {
    id: 'bangkok',
    name: 'Bangkok',
    primary: '#FF9800',      // Temple gold
    secondary: '#E91E63',    // Orchid pink
    accent: '#9C27B0',       // Night purple
    backgroundTint: 'rgba(255, 152, 0, 0.02)',
    cardTint: 'rgba(255, 152, 0, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
  },

  // Europe
  'paris': {
    id: 'paris',
    name: 'Paris',
    primary: '#D4AF37',      // Champagne gold
    secondary: '#1A237E',    // Midnight blue
    accent: '#C62828',       // Wine red
    backgroundTint: 'rgba(212, 175, 55, 0.02)',
    cardTint: 'rgba(212, 175, 55, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  },
  'london': {
    id: 'london',
    name: 'London',
    primary: '#1565C0',      // Royal blue
    secondary: '#C62828',    // Phone box red
    accent: '#FFD600',       // Crown gold
    backgroundTint: 'rgba(21, 101, 192, 0.02)',
    cardTint: 'rgba(21, 101, 192, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  },
  'rome': {
    id: 'rome',
    name: 'Rome',
    primary: '#BF360C',      // Terracotta
    secondary: '#1B5E20',    // Olive green
    accent: '#FFD600',       // Vatican gold
    backgroundTint: 'rgba(191, 54, 12, 0.02)',
    cardTint: 'rgba(191, 54, 12, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
  },
  'barcelona': {
    id: 'barcelona',
    name: 'Barcelona',
    primary: '#F57C00',      // Gaudi orange
    secondary: '#0288D1',    // Mediterranean blue
    accent: '#7CB342',       // Parc green
    backgroundTint: 'rgba(245, 124, 0, 0.02)',
    cardTint: 'rgba(245, 124, 0, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80',
  },
  'amsterdam': {
    id: 'amsterdam',
    name: 'Amsterdam',
    primary: '#FF5722',      // Tulip orange
    secondary: '#0277BD',    // Canal blue
    accent: '#7CB342',       // Bike green
    backgroundTint: 'rgba(255, 87, 34, 0.02)',
    cardTint: 'rgba(255, 87, 34, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
  },
  'santorini': {
    id: 'santorini',
    name: 'Santorini',
    primary: '#0288D1',      // Aegean blue
    secondary: '#FFFFFF',    // Whitewash white
    accent: '#FF5722',       // Sunset orange
    backgroundTint: 'rgba(2, 136, 209, 0.02)',
    cardTint: 'rgba(2, 136, 209, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&q=80',
  },
  'iceland': {
    id: 'iceland',
    name: 'Iceland',
    primary: '#00BCD4',      // Glacier blue
    secondary: '#263238',    // Volcanic black
    accent: '#76FF03',       // Aurora green
    backgroundTint: 'rgba(0, 188, 212, 0.02)',
    cardTint: 'rgba(0, 188, 212, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=1200&q=80',
  },

  // Americas
  'new york': {
    id: 'new-york',
    name: 'New York',
    primary: '#FFC107',      // Taxi yellow
    secondary: '#263238',    // City black
    accent: '#E91E63',       // Broadway pink
    backgroundTint: 'rgba(255, 193, 7, 0.02)',
    cardTint: 'rgba(255, 193, 7, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
  },
  'los angeles': {
    id: 'los-angeles',
    name: 'Los Angeles',
    primary: '#FF7043',      // Sunset orange
    secondary: '#00BCD4',    // Ocean blue
    accent: '#AB47BC',       // Hollywood purple
    backgroundTint: 'rgba(255, 112, 67, 0.02)',
    cardTint: 'rgba(255, 112, 67, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&q=80',
  },
  'miami': {
    id: 'miami',
    name: 'Miami',
    primary: '#00E5FF',      // Art deco cyan
    secondary: '#FF4081',    // Miami pink
    accent: '#FFD600',       // Beach gold
    backgroundTint: 'rgba(0, 229, 255, 0.02)',
    cardTint: 'rgba(0, 229, 255, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1200&q=80',
  },
  'las vegas': {
    id: 'las-vegas',
    name: 'Las Vegas',
    primary: '#FFD700',      // Vegas gold
    secondary: '#C62828',    // Casino red
    accent: '#9C27B0',       // Neon purple
    backgroundTint: 'rgba(255, 215, 0, 0.02)',
    cardTint: 'rgba(255, 215, 0, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&q=80',
  },
  'san francisco': {
    id: 'san-francisco',
    name: 'San Francisco',
    primary: '#FF5722',      // Golden Gate orange
    secondary: '#0288D1',    // Bay blue
    accent: '#4CAF50',       // Tech green
    backgroundTint: 'rgba(255, 87, 34, 0.02)',
    cardTint: 'rgba(255, 87, 34, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
  },
  'mexico city': {
    id: 'mexico-city',
    name: 'Mexico City',
    primary: '#D32F2F',      // Frida red
    secondary: '#1B5E20',    // Cactus green
    accent: '#FF9800',       // Marigold orange
    backgroundTint: 'rgba(211, 47, 47, 0.02)',
    cardTint: 'rgba(211, 47, 47, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80',
  },
  'rio de janeiro': {
    id: 'rio',
    name: 'Rio de Janeiro',
    primary: '#4CAF50',      // Jungle green
    secondary: '#FFC107',    // Carnival gold
    accent: '#2196F3',       // Copacabana blue
    backgroundTint: 'rgba(76, 175, 80, 0.02)',
    cardTint: 'rgba(76, 175, 80, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&q=80',
  },

  // Middle East & Africa
  'dubai': {
    id: 'dubai',
    name: 'Dubai',
    primary: '#FFD700',      // Gold
    secondary: '#0D47A1',    // Gulf blue
    accent: '#FF5722',       // Desert orange
    backgroundTint: 'rgba(255, 215, 0, 0.02)',
    cardTint: 'rgba(255, 215, 0, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  },
  'marrakech': {
    id: 'marrakech',
    name: 'Marrakech',
    primary: '#E65100',      // Terracotta
    secondary: '#1B5E20',    // Oasis green
    accent: '#FFD600',       // Spice gold
    backgroundTint: 'rgba(230, 81, 0, 0.02)',
    cardTint: 'rgba(230, 81, 0, 0.03)',
    mood: 'warm',
    heroImage: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=80',
  },
  'cape town': {
    id: 'cape-town',
    name: 'Cape Town',
    primary: '#0288D1',      // Atlantic blue
    secondary: '#8D6E63',    // Table Mountain brown
    accent: '#7CB342',       // Winelands green
    backgroundTint: 'rgba(2, 136, 209, 0.02)',
    cardTint: 'rgba(2, 136, 209, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80',
  },

  // Oceania
  'sydney': {
    id: 'sydney',
    name: 'Sydney',
    primary: '#0288D1',      // Harbour blue
    secondary: '#FF5722',    // Sunset orange
    accent: '#FFD600',       // Beach gold
    backgroundTint: 'rgba(2, 136, 209, 0.02)',
    cardTint: 'rgba(2, 136, 209, 0.03)',
    mood: 'vibrant',
    heroImage: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
  },
  'queenstown': {
    id: 'queenstown',
    name: 'Queenstown',
    primary: '#00BCD4',      // Lake blue
    secondary: '#4CAF50',    // Alpine green
    accent: '#FFEB3B',       // Adventure yellow
    backgroundTint: 'rgba(0, 188, 212, 0.02)',
    cardTint: 'rgba(0, 188, 212, 0.03)',
    mood: 'cool',
    heroImage: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&q=80',
  },
};

// Default theme for unknown destinations
export const DEFAULT_THEME: DestinationTheme = {
  id: 'default',
  name: 'Default',
  primary: '#0D9488',        // Teal
  secondary: '#6366F1',      // Indigo
  accent: '#F59E0B',         // Amber
  backgroundTint: 'rgba(13, 148, 136, 0.02)',
  cardTint: 'rgba(13, 148, 136, 0.03)',
  mood: 'neutral',
  heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
};

// Get theme for a destination (fuzzy matching)
export function getDestinationTheme(destinationName: string | undefined): DestinationTheme {
  if (!destinationName) return DEFAULT_THEME;

  const normalized = destinationName.toLowerCase().trim();

  // Direct match
  if (DESTINATION_THEMES[normalized]) {
    return DESTINATION_THEMES[normalized];
  }

  // Partial match (e.g., "Tokyo, Japan" -> "tokyo")
  for (const [key, theme] of Object.entries(DESTINATION_THEMES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return theme;
    }
  }

  // Country/region-based fallback themes
  const regionThemes: Record<string, DestinationTheme> = {
    'japan': DESTINATION_THEMES['tokyo'],
    'france': DESTINATION_THEMES['paris'],
    'italy': DESTINATION_THEMES['rome'],
    'spain': DESTINATION_THEMES['barcelona'],
    'uk': DESTINATION_THEMES['london'],
    'england': DESTINATION_THEMES['london'],
    'united kingdom': DESTINATION_THEMES['london'],
    'netherlands': DESTINATION_THEMES['amsterdam'],
    'usa': DESTINATION_THEMES['new york'],
    'united states': DESTINATION_THEMES['new york'],
    'indonesia': DESTINATION_THEMES['bali'],
    'thailand': DESTINATION_THEMES['bangkok'],
    'morocco': DESTINATION_THEMES['marrakech'],
    'uae': DESTINATION_THEMES['dubai'],
    'australia': DESTINATION_THEMES['sydney'],
    'new zealand': DESTINATION_THEMES['queenstown'],
    'brazil': DESTINATION_THEMES['rio de janeiro'],
    'mexico': DESTINATION_THEMES['mexico city'],
    'greece': DESTINATION_THEMES['santorini'],
    'south africa': DESTINATION_THEMES['cape town'],
  };

  for (const [region, theme] of Object.entries(regionThemes)) {
    if (normalized.includes(region)) {
      return theme;
    }
  }

  return DEFAULT_THEME;
}

// Get CSS variables object for a theme
export function getThemeCSSVariables(theme: DestinationTheme): Record<string, string> {
  return {
    '--dest-primary': theme.primary,
    '--dest-secondary': theme.secondary,
    '--dest-accent': theme.accent,
    '--dest-bg-tint': theme.backgroundTint,
    '--dest-card-tint': theme.cardTint,
  };
}
