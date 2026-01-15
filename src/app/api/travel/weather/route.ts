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

// Cache for weather data
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat and lng are required' },
      { status: 400 }
    );
  }

  const cacheKey = `${lat},${lng}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ weather: cached.data, cached: true });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  // If no API key, return mock data
  if (!apiKey) {
    const mockWeather: WeatherData = {
      temp: 22,
      feelsLike: 23,
      condition: 'Clear',
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 5,
    };
    return NextResponse.json({ weather: mockWeather, mock: true });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather');
    }

    const data = await response.json();

    const weather: WeatherData = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0]?.main || 'Unknown',
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '01d',
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
    };

    // Cache the result
    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });

    return NextResponse.json({ weather });
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    // Return mock data on error
    const mockWeather: WeatherData = {
      temp: 20,
      feelsLike: 20,
      condition: 'Clear',
      description: 'clear sky',
      icon: '01d',
      humidity: 50,
      windSpeed: 5,
    };
    return NextResponse.json({ weather: mockWeather, fallback: true });
  }
}
