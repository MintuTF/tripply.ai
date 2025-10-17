import type { WeatherData, WeatherForecast, ToolResult } from '@/types';

/**
 * Weather API Integration using Open-Meteo (free, no API key required)
 * https://open-meteo.com/en/docs
 */

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
  };
  current_weather?: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
}

// Weather code mappings (WMO codes)
const WEATHER_CONDITIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/**
 * Get coordinates from location name using geocoding
 */
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Check if location is already coordinates (lat,lng format)
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lon: parseFloat(coordMatch[2]),
      };
    }

    // Use Open-Meteo's geocoding API (free)
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Get weather forecast for a location
 */
export async function getWeather(params: {
  location: string;
  dates?: { start: string; end: string };
}): Promise<ToolResult<WeatherData>> {
  try {
    const { location, dates } = params;

    // Get coordinates
    const coords = await geocodeLocation(location);
    if (!coords) {
      return {
        success: false,
        error: `Could not find location: ${location}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Build API URL for Open-Meteo
    const baseUrl = 'https://api.open-meteo.com/v1/forecast';
    const params_obj = new URLSearchParams({
      latitude: coords.lat.toString(),
      longitude: coords.lon.toString(),
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max',
      current_weather: 'true',
      temperature_unit: 'fahrenheit',
      windspeed_unit: 'mph',
      timezone: 'auto',
      forecast_days: '10',
    });

    // Add date range if provided
    if (dates) {
      params_obj.append('start_date', dates.start);
      params_obj.append('end_date', dates.end);
    }

    const url = `${baseUrl}?${params_obj.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: 'Weather API request failed',
        timestamp: new Date().toISOString(),
      };
    }

    const data: OpenMeteoResponse = await response.json();

    // Parse forecast data
    const forecast: WeatherForecast[] = data.daily.time.map((date, index) => ({
      date,
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
      condition: WEATHER_CONDITIONS[data.daily.weathercode[index]] || 'Unknown',
      rain_chance: data.daily.precipitation_probability_max[index],
      wind_speed: Math.round(data.daily.windspeed_10m_max[index]),
    }));

    // Create current weather from forecast
    const current: WeatherForecast = data.current_weather
      ? {
          date: new Date().toISOString().split('T')[0],
          high: Math.round(data.current_weather.temperature),
          low: Math.round(data.current_weather.temperature),
          condition: WEATHER_CONDITIONS[data.current_weather.weathercode] || 'Unknown',
          rain_chance: 0,
          wind_speed: Math.round(data.current_weather.windspeed),
        }
      : forecast[0];

    // Calculate historical average (using current month's average from forecast)
    const avgHigh = Math.round(
      forecast.reduce((sum, day) => sum + day.high, 0) / forecast.length
    );
    const avgLow = Math.round(
      forecast.reduce((sum, day) => sum + day.low, 0) / forecast.length
    );

    const weatherData: WeatherData = {
      current,
      forecast,
      historical_avg: {
        high: avgHigh,
        low: avgLow,
      },
      alerts: [], // Open-Meteo doesn't provide alerts in free tier
    };

    return {
      success: true,
      data: weatherData,
      sources: [
        {
          url: 'https://open-meteo.com',
          title: 'Open-Meteo Weather API',
          snippet: `Weather forecast for ${location}`,
          timestamp: new Date().toISOString(),
          confidence: 0.95,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Weather tool error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Format weather data for display
 */
export function formatWeatherSummary(weather: WeatherData): string {
  const { current, forecast, historical_avg } = weather;

  let summary = `Current: ${current.condition}, ${current.high}°F`;
  summary += `\n\n10-Day Forecast:\n`;

  forecast.slice(0, 10).forEach((day) => {
    const date = new Date(day.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    summary += `${date}: ${day.condition}, High ${day.high}°F / Low ${day.low}°F`;
    if (day.rain_chance > 30) {
      summary += ` (${day.rain_chance}% rain)`;
    }
    summary += `\n`;
  });

  if (historical_avg) {
    summary += `\nHistorical Average: ${historical_avg.high}°F / ${historical_avg.low}°F`;
  }

  return summary;
}
