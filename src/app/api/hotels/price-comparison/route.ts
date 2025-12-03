import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/rate-limit';
import { getHotelPriceComparison } from '@/lib/tools/serpapi';

export interface HotelPriceOffer {
  provider: string;
  price: number;
  currency: string;
  priceWithTaxes: number;
  url: string;
  logo?: string;
  amenities?: string[];
  deal?: string;
  free_cancellation?: boolean;
  official_site?: boolean;
}

/**
 * GET /api/hotels/price-comparison
 * Get hotel price comparison from multiple booking providers using SerpAPI
 *
 * Query params:
 * - property_token (required): SerpAPI property token
 * - hotel_name (required for fallback): Hotel name
 * - location (optional): City or address
 * - check_in (required): Check-in date (YYYY-MM-DD)
 * - check_out (required): Check-out date (YYYY-MM-DD)
 * - adults (optional): Number of adults (default: 2)
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`price-comparison:${clientIP}`, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyToken = searchParams.get('property_token');
    const hotelName = searchParams.get('hotel_name');
    const location = searchParams.get('location');
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');
    const adults = searchParams.get('adults') || '2';

    if (!propertyToken && !hotelName) {
      return NextResponse.json(
        { error: 'Either property_token or hotel_name is required' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters: check_in, check_out' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      );
    }

    // Use SerpAPI to get price comparison if property token is provided
    if (propertyToken) {
      console.log('[PriceComparison] Using SerpAPI for property:', propertyToken);

      const serpResult = await getHotelPriceComparison({
        propertyToken,
        checkIn,
        checkOut,
        adults: parseFloat(adults),
        currency: 'USD',
      });

      if (serpResult.success && serpResult.data) {
        // Transform SerpAPI prices to our format
        const offers: HotelPriceOffer[] = serpResult.data.map((price) => ({
          provider: price.source,
          price: price.rate_per_night?.extracted_lowest || price.total_rate?.extracted_lowest || 0,
          currency: 'USD',
          priceWithTaxes: price.rate_per_night?.extracted_before_taxes_fees ||
                         price.total_rate?.extracted_lowest ||
                         (price.rate_per_night?.extracted_lowest || 0) * 1.18,
          url: price.link,
          logo: price.logo,
          deal: price.deal,
          free_cancellation: price.free_cancellation,
          official_site: price.official_hotel_website,
        }))
        .filter(offer => offer.price > 0) // Filter out invalid prices
        .sort((a, b) => a.price - b.price); // Sort by price ascending

        console.log(`[PriceComparison] Found ${offers.length} price offers from SerpAPI`);

        return NextResponse.json(
          {
            offers: offers.slice(0, 10), // Top 10 offers
            source: 'serpapi',
            timestamp: new Date().toISOString(),
          },
          { headers: createRateLimitHeaders(rateLimitResult) }
        );
      } else {
        console.warn('[PriceComparison] SerpAPI failed:', serpResult.error);
      }
    }

    // Fallback to mock data if SerpAPI fails or no property token
    console.warn('[PriceComparison] Using mock price data');
    return NextResponse.json(
      {
        offers: getMockPriceOffers(hotelName || 'Hotel', parseFloat(adults)),
        source: 'mock',
        message: 'SerpAPI not available, showing estimated prices',
        timestamp: new Date().toISOString(),
      },
      { headers: createRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Price comparison error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch price comparison',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate mock price offers for testing/fallback
 */
function getMockPriceOffers(hotelName: string, adults: number): HotelPriceOffer[] {
  const basePrice = 120 + Math.random() * 80; // Random base between $120-200

  const providers = [
    { name: 'Expedia.com', multiplier: 0.95, domain: 'expedia.com', cancellation: true },
    { name: 'Booking.com', multiplier: 0.98, domain: 'booking.com', cancellation: true },
    { name: 'Hotels.com', multiplier: 0.96, domain: 'hotels.com', cancellation: true },
    { name: 'Priceline', multiplier: 1.02, domain: 'priceline.com', cancellation: false },
    { name: 'Agoda', multiplier: 0.92, domain: 'agoda.com', cancellation: true },
    { name: 'Travelocity', multiplier: 1.00, domain: 'travelocity.com', cancellation: false },
    { name: 'Kayak', multiplier: 1.01, domain: 'kayak.com', cancellation: false },
    { name: 'Trip.com', multiplier: 0.94, domain: 'trip.com', cancellation: true },
  ];

  return providers
    .map((provider) => {
      const price = Math.round(basePrice * provider.multiplier);
      const priceWithTaxes = Math.round(price * 1.18); // 18% taxes/fees

      return {
        provider: provider.name,
        price,
        currency: 'USD',
        priceWithTaxes,
        url: `https://www.${provider.domain}/search?q=${encodeURIComponent(hotelName)}`,
        free_cancellation: provider.cancellation,
        official_site: provider.name.includes('Hotels.com'),
      };
    })
    .sort((a, b) => a.price - b.price) // Sort by price ascending
    .slice(0, 8); // Top 8 offers
}
