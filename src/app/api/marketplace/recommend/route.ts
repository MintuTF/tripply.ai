/**
 * Marketplace Recommendation API Endpoint
 * Returns personalized product recommendations based on trip context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, getEssentialProducts, getProductsByCategories } from '@/lib/marketplace/recommendationEngine';
import { MarketplaceTripContext, MarketplaceFilters, ProductRecommendation } from '@/types/marketplace';
import { getWeather } from '@/lib/tools/weather';
import { generateAffiliateUrl } from '@/lib/marketplace/affiliateUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripContext, filters } = body as {
      tripContext?: MarketplaceTripContext;
      filters?: MarketplaceFilters;
    };

    // If we have a destination but no weather, fetch it
    let enrichedContext = tripContext || null;
    if (tripContext?.destination && !tripContext.weather) {
      try {
        const weatherResult = await getWeather({ location: tripContext.destination });
        if (weatherResult.success && weatherResult.data) {
          enrichedContext = {
            ...tripContext,
            weather: {
              temperature: weatherResult.data.current.high,
              condition: weatherResult.data.current.condition,
              humidity: undefined,
            },
          };
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // Continue without weather data
      }
    }

    // Get recommendations from engine
    const result = await getRecommendations(
      enrichedContext,
      filters || {}
    );

    // Get all products by category for browsing
    const categoryProducts = getProductsByCategories();

    // If no personalized recommendations, use essential products
    let recommendations: ProductRecommendation[] = result.personalized;
    if (recommendations.length === 0) {
      const essentials = getEssentialProducts();
      recommendations = essentials.map((p) => ({
        ...p,
        affiliateUrl: generateAffiliateUrl(p.affiliateUrl),
        relevanceScore: 80,
        reason: p.shortDescription,
      }));
    }

    // Build response with proper field names that UI expects
    const response = {
      recommendations,
      smartKits: result.kits,
      categoryProducts,
      tripSummary: enrichedContext?.destination
        ? {
            destination: enrichedContext.destination,
            weather: enrichedContext.weather
              ? `${enrichedContext.weather.temperature}°F, ${enrichedContext.weather.condition}`
              : 'Weather unavailable',
            duration: enrichedContext.duration
              ? `${enrichedContext.duration} days`
              : 'Duration not specified',
          }
        : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Marketplace recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return general browsing data
    const essentials = getEssentialProducts();
    const byCategory = getProductsByCategories();

    return NextResponse.json({
      essentials,
      categories: byCategory,
    });
  } catch (error) {
    console.error('Marketplace GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    );
  }
}
