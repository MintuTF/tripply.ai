/**
 * Marketplace Recommendation API Endpoint
 * Returns personalized product recommendations based on trip context
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRecommendations,
  getEssentialProducts,
  getProductsByCategories,
  getDontForgetItems,
  getComfortUpgrades
} from '@/lib/marketplace/recommendationEngine';
import { MarketplaceTripContext, MarketplaceFilters, ProductRecommendation } from '@/types/marketplace';
import { getWeather } from '@/lib/tools/weather';
import { generateAffiliateUrl } from '@/lib/marketplace/affiliateUtils';
import { getTripContextSummary } from '@/lib/marketplace/tripContextUtils';
import { Trip } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripContext, filters, trip } = body as {
      tripContext?: MarketplaceTripContext;
      filters?: MarketplaceFilters;
      trip?: Trip; // NEW: Full trip object for TripContextSummary
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

    // PHASE 8: Get sectioned recommendations

    // 1. Top Recommendations (score >= 65, lowered from 75 to show more products)
    const topRecommendations = result.personalized
      .filter((p) => p.relevanceScore >= 65)
      .slice(0, 9);

    // 2. Don't Forget These (commonly forgotten essentials)
    const dontForget = await getDontForgetItems(enrichedContext);

    // 3. Comfort Upgrades (premium optional items)
    const comfortUpgrades = await getComfortUpgrades(enrichedContext);

    // 4. Trip Context Summary (from full trip object if available)
    const tripContextSummary = trip ? getTripContextSummary(trip) : null;

    // Get all products by category for browsing (legacy support)
    const categoryProducts = await getProductsByCategories();

    // Build sectioned response structure
    const response = {
      // NEW: Sectioned recommendations
      topRecommendations,
      dontForget,
      comfortUpgrades,
      tripContextSummary,
      totalProducts: topRecommendations.length + dontForget.length + comfortUpgrades.length,

      // Legacy fields for backward compatibility
      recommendations: result.personalized, // All personalized (score >= 60)
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
    const essentials = await getEssentialProducts();
    const byCategory = await getProductsByCategories();

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
