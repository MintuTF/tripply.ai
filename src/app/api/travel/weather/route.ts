import { NextRequest, NextResponse } from 'next/server';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// WMO weather interpretation codes -> condition names the UI already maps to emojis
function describeWeatherCode(code: number): { condition: string; description: string } {
  if (code === 0) return { condition: 'Clear', description: 'clear sky' };
  if (code === 1) return { condition: 'Clear', description: 'mainly clear' };
  if (code === 2) return { condition: 'Clouds', description: 'partly cloudy' };
  if (code === 3) return { condition: 'Clouds', description: 'overcast' };
  if (code === 45 || code === 48) return { condition: 'Fog', description: 'fog' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', description: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'Rain', description: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { condition: 'Snow', description: 'snow' };
  if (code >= 95) return { condition: 'Thunderstorm', description: 'thunderstorm' };
  return { condition: 'Clouds', description: 'cloudy' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ weather: cached.data, cached: true });
  }

  try {
    // Open-Meteo: free, no API key required
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
      `&wind_speed_unit=ms&timezone=auto`;

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`Open-Meteo responded ${response.status}`);
    }

    const { current } = await response.json();
    const { condition, description } = describeWeatherCode(current.weather_code);

    const weather: WeatherData = {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      condition,
      description,
      icon: current.is_day ? '01d' : '01n',
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
    };

    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
    return NextResponse.json({ weather });
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    // Never invent weather: let the UI hide the widget instead
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 502 });
  }
}
