// Weather utility functions
// In production, use OpenWeatherMap API or similar service

export interface WeatherData {
  date: string;
  temp: number; // Celsius
  tempMin: number;
  tempMax: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

// Mock weather data generator (replace with real API calls)
export function generateMockWeather(startDate: string, days: number): WeatherData[] {
  const conditions = [
    { condition: 'Sunny', icon: '☀️', tempRange: [20, 28] },
    { condition: 'Partly Cloudy', icon: '⛅', tempRange: [18, 25] },
    { condition: 'Cloudy', icon: '☁️', tempRange: [15, 22] },
    { condition: 'Rain', icon: '🌧️', tempRange: [12, 18] },
    { condition: 'Clear', icon: '🌤️', tempRange: [19, 26] },
  ];

  const weather: WeatherData[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const [minRange, maxRange] = condition.tempRange;
    const tempMax = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    const tempMin = tempMax - Math.floor(Math.random() * 5 + 3);
    const temp = Math.floor((tempMax + tempMin) / 2);

    weather.push({
      date: date.toISOString(),
      temp,
      tempMin,
      tempMax,
      condition: condition.condition,
      description: `${condition.condition} skies`,
      humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
      windSpeed: Math.floor(Math.random() * 15 + 5), // 5-20 km/h
      icon: condition.icon,
    });
  }

  return weather;
}

/**
 * Fetch weather data from OpenWeatherMap API
 * Requires API key in environment variables
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  startDate: string,
  days: number
): Promise<WeatherData[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  // If no API key, return mock data
  if (!apiKey) {
    return generateMockWeather(startDate, days);
  }

  try {
    // OpenWeatherMap One Call API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=${days * 8}` // 8 forecasts per day (3-hour intervals)
    );

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();

    // Process and group by day
    const dailyWeather: Record<string, any> = {};

    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyWeather[date]) {
        dailyWeather[date] = {
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: [],
        };
      }

      dailyWeather[date].temps.push(item.main.temp);
      dailyWeather[date].conditions.push(item.weather[0]);
      dailyWeather[date].humidity.push(item.main.humidity);
      dailyWeather[date].windSpeed.push(item.wind.speed);
    });

    // Convert to WeatherData format
    return Object.entries(dailyWeather).map(([date, data]: [string, any]) => ({
      date: new Date(date).toISOString(),
      temp: Math.round(data.temps.reduce((a: number, b: number) => a + b) / data.temps.length),
      tempMin: Math.round(Math.min(...data.temps)),
      tempMax: Math.round(Math.max(...data.temps)),
      condition: data.conditions[0].main,
      description: data.conditions[0].description,
      humidity: Math.round(data.humidity.reduce((a: number, b: number) => a + b) / data.humidity.length),
      windSpeed: Math.round(data.windSpeed.reduce((a: number, b: number) => a + b) / data.windSpeed.length),
      icon: getWeatherIcon(data.conditions[0].main),
    }));
  } catch (error) {
    console.error('Weather fetch error:', error);
    return generateMockWeather(startDate, days);
  }
}

function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
  };

  return icons[condition] || '🌤️';
}

export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}
