/**
 * Route Optimization using Traveling Salesman Problem (TSP) algorithms
 * Nearest Neighbor heuristic with optional 2-opt improvement
 */

import { calculateDistance, type Coordinates } from './distance';

export interface RouteStop {
  id: string;
  name: string;
  coordinates: Coordinates;
  timeBlock?: string; // e.g., "morning", "afternoon", "evening"
  openingHours?: {
    start: string; // "09:00"
    end: string; // "17:00"
  };
  priority?: number; // Higher = must visit earlier
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  order: string[]; // IDs in optimized order
}

export interface OptimizationResult {
  originalRoute: OptimizedRoute;
  optimizedRoute: OptimizedRoute;
  improvement: {
    distanceSaved: number; // km
    percentImprovement: number;
    timeSaved: number; // minutes (based on walking speed)
  };
}

/**
 * Calculate total distance for a route
 */
function calculateRouteDistance(stops: RouteStop[]): number {
  if (stops.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalDistance += calculateDistance(stops[i].coordinates, stops[i + 1].coordinates);
  }

  return totalDistance;
}

/**
 * Nearest Neighbor TSP algorithm
 * Greedy approach: always visit the nearest unvisited location
 */
function nearestNeighborTSP(stops: RouteStop[], startIndex: number = 0): RouteStop[] {
  if (stops.length <= 2) return [...stops];

  const visited = new Set<number>();
  const route: RouteStop[] = [];
  let currentIndex = startIndex;

  route.push(stops[currentIndex]);
  visited.add(currentIndex);

  // Visit all remaining stops
  while (visited.size < stops.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    // Find nearest unvisited stop
    for (let i = 0; i < stops.length; i++) {
      if (!visited.has(i)) {
        const distance = calculateDistance(
          stops[currentIndex].coordinates,
          stops[i].coordinates
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      route.push(stops[nearestIndex]);
      visited.add(nearestIndex);
      currentIndex = nearestIndex;
    }
  }

  return route;
}

/**
 * 2-opt improvement algorithm
 * Iteratively removes edge crossings to improve the route
 */
function twoOptImprovement(route: RouteStop[], maxIterations: number = 100): RouteStop[] {
  let improved = true;
  let iteration = 0;
  let currentRoute = [...route];

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 0; i < currentRoute.length - 2; i++) {
      for (let j = i + 2; j < currentRoute.length; j++) {
        // Don't reverse if it would affect the last edge
        if (j === currentRoute.length - 1) continue;

        const currentDistance =
          calculateDistance(currentRoute[i].coordinates, currentRoute[i + 1].coordinates) +
          calculateDistance(currentRoute[j].coordinates, currentRoute[j + 1].coordinates);

        const newDistance =
          calculateDistance(currentRoute[i].coordinates, currentRoute[j].coordinates) +
          calculateDistance(currentRoute[i + 1].coordinates, currentRoute[j + 1].coordinates);

        if (newDistance < currentDistance) {
          // Reverse the segment between i+1 and j
          const newRoute = [
            ...currentRoute.slice(0, i + 1),
            ...currentRoute.slice(i + 1, j + 1).reverse(),
            ...currentRoute.slice(j + 1),
          ];
          currentRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return currentRoute;
}

/**
 * Group stops by time blocks (morning, afternoon, evening)
 * Ensures time-sensitive activities are visited in the correct order
 */
function groupByTimeBlocks(stops: RouteStop[]): Map<string, RouteStop[]> {
  const groups = new Map<string, RouteStop[]>();

  stops.forEach((stop) => {
    const block = stop.timeBlock || 'any';
    if (!groups.has(block)) {
      groups.set(block, []);
    }
    groups.get(block)!.push(stop);
  });

  return groups;
}

/**
 * Optimize route with time block constraints
 * Respects morning/afternoon/evening groupings
 */
function optimizeWithTimeBlocks(stops: RouteStop[]): RouteStop[] {
  const timeBlocks = ['morning', 'afternoon', 'evening'];
  const groups = groupByTimeBlocks(stops);

  const optimizedRoute: RouteStop[] = [];

  // Process each time block in order
  timeBlocks.forEach((block) => {
    const blockStops = groups.get(block);
    if (blockStops && blockStops.length > 0) {
      // Optimize within this time block
      const startIndex = optimizedRoute.length > 0 ? 0 : 0;
      const optimized = nearestNeighborTSP(blockStops, startIndex);
      optimizedRoute.push(...optimized);
    }
  });

  // Add any stops without time blocks at the end
  const anyStops = groups.get('any');
  if (anyStops && anyStops.length > 0) {
    const optimized = nearestNeighborTSP(anyStops);
    optimizedRoute.push(...optimized);
  }

  return optimizedRoute;
}

/**
 * Main optimization function
 * Uses nearest neighbor TSP with 2-opt improvement
 */
export function optimizeRoute(
  stops: RouteStop[],
  options: {
    respectTimeBlocks?: boolean;
    use2Opt?: boolean;
    startLocation?: Coordinates;
  } = {}
): OptimizationResult {
  const { respectTimeBlocks = false, use2Opt = true, startLocation } = options;

  // Calculate original route distance
  const originalDistance = calculateRouteDistance(stops);

  let optimizedStops: RouteStop[];

  // If we have a start location, find the nearest stop to start from
  let startIndex = 0;
  if (startLocation && stops.length > 0) {
    let minDistance = Infinity;
    stops.forEach((stop, index) => {
      const dist = calculateDistance(startLocation, stop.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        startIndex = index;
      }
    });
  }

  // Apply optimization based on constraints
  if (respectTimeBlocks) {
    optimizedStops = optimizeWithTimeBlocks(stops);
  } else {
    optimizedStops = nearestNeighborTSP(stops, startIndex);
  }

  // Apply 2-opt improvement if requested
  if (use2Opt && optimizedStops.length > 3) {
    optimizedStops = twoOptImprovement(optimizedStops);
  }

  // Calculate optimized route distance
  const optimizedDistance = calculateRouteDistance(optimizedStops);

  // Calculate improvement metrics
  const distanceSaved = Math.max(0, originalDistance - optimizedDistance);
  const percentImprovement =
    originalDistance > 0 ? (distanceSaved / originalDistance) * 100 : 0;
  const timeSaved = Math.round((distanceSaved / 5) * 60); // Assuming 5 km/h walking speed

  return {
    originalRoute: {
      stops,
      totalDistance: originalDistance,
      order: stops.map((s) => s.id),
    },
    optimizedRoute: {
      stops: optimizedStops,
      totalDistance: optimizedDistance,
      order: optimizedStops.map((s) => s.id),
    },
    improvement: {
      distanceSaved,
      percentImprovement,
      timeSaved,
    },
  };
}

/**
 * Check if a route can benefit from optimization
 * Returns true if optimization would likely improve the route
 */
export function shouldOptimize(stops: RouteStop[]): boolean {
  // Need at least 3 stops to optimize
  if (stops.length < 3) return false;

  // Check for obvious inefficiencies
  // If the route has significant backtracking, optimization can help
  let hasBacktracking = false;

  for (let i = 0; i < stops.length - 2; i++) {
    const dist1 = calculateDistance(stops[i].coordinates, stops[i + 1].coordinates);
    const dist2 = calculateDistance(stops[i + 1].coordinates, stops[i + 2].coordinates);
    const directDist = calculateDistance(stops[i].coordinates, stops[i + 2].coordinates);

    // If going through the middle point is much longer than going direct,
    // there might be inefficiency
    if (dist1 + dist2 > directDist * 1.5) {
      hasBacktracking = true;
      break;
    }
  }

  return hasBacktracking || stops.length >= 4;
}

/**
 * Estimate optimization savings without actually optimizing
 * Useful for showing potential benefits before running optimization
 */
export function estimateOptimizationSavings(stops: RouteStop[]): {
  potentialSavings: number; // km
  confidence: 'low' | 'medium' | 'high';
} {
  if (stops.length < 3) {
    return { potentialSavings: 0, confidence: 'low' };
  }

  const currentDistance = calculateRouteDistance(stops);

  // Calculate average distance between all pairs
  let totalPairDistance = 0;
  let pairCount = 0;

  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      totalPairDistance += calculateDistance(stops[i].coordinates, stops[j].coordinates);
      pairCount++;
    }
  }

  const avgPairDistance = totalPairDistance / pairCount;

  // Estimate optimal distance as a proportion of average pair distance
  // This is a rough heuristic
  const estimatedOptimalDistance = avgPairDistance * (stops.length - 1) * 0.7;

  const potentialSavings = Math.max(0, currentDistance - estimatedOptimalDistance);
  const savingsPercent = (potentialSavings / currentDistance) * 100;

  let confidence: 'low' | 'medium' | 'high';
  if (savingsPercent > 20) confidence = 'high';
  else if (savingsPercent > 10) confidence = 'medium';
  else confidence = 'low';

  return { potentialSavings, confidence };
}
