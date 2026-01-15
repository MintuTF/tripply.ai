// City metadata helpers

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  US: '🇺🇸', JP: '🇯🇵', FR: '🇫🇷', GB: '🇬🇧', DE: '🇩🇪',
  IT: '🇮🇹', ES: '🇪🇸', AU: '🇦🇺', CA: '🇨🇦', BR: '🇧🇷',
  MX: '🇲🇽', TH: '🇹🇭', VN: '🇻🇳', KR: '🇰🇷', CN: '🇨🇳',
  IN: '🇮🇳', ID: '🇮🇩', MY: '🇲🇾', SG: '🇸🇬', PH: '🇵🇭',
  NZ: '🇳🇿', ZA: '🇿🇦', EG: '🇪🇬', AE: '🇦🇪', TR: '🇹🇷',
  GR: '🇬🇷', PT: '🇵🇹', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭',
  AT: '🇦🇹', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮',
  PL: '🇵🇱', CZ: '🇨🇿', HU: '🇭🇺', RO: '🇷🇴', HR: '🇭🇷',
  AR: '🇦🇷', CL: '🇨🇱', CO: '🇨🇴', PE: '🇵🇪', CR: '🇨🇷',
  IE: '🇮🇪', IS: '🇮🇸', MA: '🇲🇦', KE: '🇰🇪', TZ: '🇹🇿',
};

// Best time to visit data for popular destinations
const bestTimeData: Record<string, { season: string; months: string }> = {
  // Asia
  'tokyo': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },
  'kyoto': { season: 'Spring/Fall', months: 'Mar-May, Oct-Nov' },
  'osaka': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },
  'bangkok': { season: 'Winter', months: 'Nov-Feb' },
  'singapore': { season: 'Year-round', months: 'Feb-Apr (driest)' },
  'hong kong': { season: 'Fall/Winter', months: 'Oct-Dec' },
  'seoul': { season: 'Spring/Fall', months: 'Apr-May, Sep-Oct' },
  'bali': { season: 'Dry Season', months: 'Apr-Oct' },

  // Europe
  'paris': { season: 'Spring/Fall', months: 'Apr-Jun, Sep-Oct' },
  'london': { season: 'Summer', months: 'Jun-Aug' },
  'rome': { season: 'Spring/Fall', months: 'Apr-Jun, Sep-Oct' },
  'barcelona': { season: 'Spring/Fall', months: 'May-Jun, Sep-Oct' },
  'amsterdam': { season: 'Spring/Summer', months: 'Apr-Sep' },
  'berlin': { season: 'Summer', months: 'May-Sep' },
  'prague': { season: 'Spring/Fall', months: 'Apr-May, Sep-Oct' },
  'lisbon': { season: 'Spring/Fall', months: 'Mar-May, Sep-Oct' },
  'vienna': { season: 'Spring/Fall', months: 'Apr-May, Sep-Oct' },
  'athens': { season: 'Spring/Fall', months: 'Apr-Jun, Sep-Oct' },

  // Americas
  'new york': { season: 'Spring/Fall', months: 'Apr-Jun, Sep-Nov' },
  'los angeles': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },
  'san francisco': { season: 'Fall', months: 'Sep-Nov' },
  'miami': { season: 'Winter', months: 'Dec-May' },
  'las vegas': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },
  'chicago': { season: 'Summer/Fall', months: 'Jun-Oct' },
  'toronto': { season: 'Summer', months: 'Jun-Sep' },
  'vancouver': { season: 'Summer', months: 'Jun-Sep' },
  'mexico city': { season: 'Spring', months: 'Mar-May' },
  'rio de janeiro': { season: 'Fall/Winter', months: 'Apr-Oct' },
  'buenos aires': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },

  // Oceania
  'sydney': { season: 'Spring/Fall', months: 'Sep-Nov, Mar-May' },
  'melbourne': { season: 'Spring/Fall', months: 'Sep-Nov, Mar-May' },
  'auckland': { season: 'Summer', months: 'Dec-Mar' },

  // Middle East & Africa
  'dubai': { season: 'Winter', months: 'Nov-Mar' },
  'cairo': { season: 'Winter/Spring', months: 'Oct-Apr' },
  'cape town': { season: 'Summer', months: 'Nov-Mar' },
  'marrakech': { season: 'Spring/Fall', months: 'Mar-May, Sep-Nov' },
};

// Price level data for popular destinations
const priceLevelData: Record<string, '$' | '$$' | '$$$'> = {
  // Expensive ($$$)
  'tokyo': '$$$', 'london': '$$$', 'paris': '$$$', 'new york': '$$$',
  'singapore': '$$$', 'sydney': '$$$', 'dubai': '$$$', 'zurich': '$$$',
  'hong kong': '$$$', 'oslo': '$$$', 'copenhagen': '$$$', 'san francisco': '$$$',

  // Moderate ($$)
  'barcelona': '$$', 'rome': '$$', 'berlin': '$$', 'amsterdam': '$$',
  'los angeles': '$$', 'seoul': '$$', 'taipei': '$$', 'melbourne': '$$',
  'toronto': '$$', 'vienna': '$$', 'prague': '$$', 'chicago': '$$',
  'miami': '$$', 'athens': '$$', 'lisbon': '$$', 'dublin': '$$',

  // Budget-friendly ($)
  'bangkok': '$', 'bali': '$', 'ho chi minh': '$', 'hanoi': '$',
  'kuala lumpur': '$', 'manila': '$', 'cairo': '$', 'marrakech': '$',
  'mexico city': '$', 'buenos aires': '$', 'lima': '$', 'budapest': '$',
  'krakow': '$', 'bucharest': '$', 'sofia': '$', 'belgrade': '$',
};

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();

  // Check our mapping first
  if (countryFlags[code]) {
    return countryFlags[code];
  }

  // Generate flag from country code using regional indicator symbols
  // Each letter A-Z maps to a regional indicator symbol
  const codePoints = [...code].map(
    char => 0x1F1E6 + char.charCodeAt(0) - 'A'.charCodeAt(0)
  );

  return String.fromCodePoint(...codePoints);
}

/**
 * Get best time to visit for a city
 */
export function getBestTimeToVisit(cityName: string): { season: string; months: string } | null {
  const normalized = cityName.toLowerCase().trim();

  // Direct match
  if (bestTimeData[normalized]) {
    return bestTimeData[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(bestTimeData)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Get price level for a city
 */
export function getPriceLevel(cityName: string): '$' | '$$' | '$$$' | null {
  const normalized = cityName.toLowerCase().trim();

  // Direct match
  if (priceLevelData[normalized]) {
    return priceLevelData[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(priceLevelData)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

/**
 * Get weather icon URL from OpenWeather icon code
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Get weather emoji from condition
 */
export function getWeatherEmoji(condition: string): string {
  const conditionMap: Record<string, string> = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️',
    'Smoke': '🌫️',
    'Dust': '🌫️',
    'Sand': '🌫️',
    'Ash': '🌋',
    'Squall': '💨',
    'Tornado': '🌪️',
  };

  return conditionMap[condition] || '🌤️';
}

/**
 * Extract country code from place description
 * e.g., "Tokyo, Japan" -> "JP"
 */
export function extractCountryCode(description: string): string | null {
  const countryNameToCode: Record<string, string> = {
    'japan': 'JP', 'united states': 'US', 'usa': 'US', 'france': 'FR',
    'united kingdom': 'GB', 'uk': 'GB', 'germany': 'DE', 'italy': 'IT',
    'spain': 'ES', 'australia': 'AU', 'canada': 'CA', 'brazil': 'BR',
    'mexico': 'MX', 'thailand': 'TH', 'vietnam': 'VN', 'south korea': 'KR',
    'korea': 'KR', 'china': 'CN', 'india': 'IN', 'indonesia': 'ID',
    'malaysia': 'MY', 'singapore': 'SG', 'philippines': 'PH',
    'new zealand': 'NZ', 'south africa': 'ZA', 'egypt': 'EG',
    'united arab emirates': 'AE', 'uae': 'AE', 'turkey': 'TR',
    'greece': 'GR', 'portugal': 'PT', 'netherlands': 'NL', 'belgium': 'BE',
    'switzerland': 'CH', 'austria': 'AT', 'sweden': 'SE', 'norway': 'NO',
    'denmark': 'DK', 'finland': 'FI', 'poland': 'PL', 'czech republic': 'CZ',
    'czechia': 'CZ', 'hungary': 'HU', 'romania': 'RO', 'croatia': 'HR',
    'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO', 'peru': 'PE',
    'costa rica': 'CR', 'ireland': 'IE', 'iceland': 'IS', 'morocco': 'MA',
    'kenya': 'KE', 'tanzania': 'TZ',
  };

  const normalized = description.toLowerCase();

  for (const [country, code] of Object.entries(countryNameToCode)) {
    if (normalized.includes(country)) {
      return code;
    }
  }

  return null;
}
