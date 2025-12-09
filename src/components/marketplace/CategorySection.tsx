'use client';

import { useState } from 'react';
import { Product, ProductRecommendation, CategoryKit } from '@/types/marketplace';
import { ProductGrid } from './ProductGrid';
import { ChevronDown, ChevronUp, Package, Plane, Cloud, CloudRain, Sun, Snowflake, Mountain, Activity, Shirt, Smartphone, Droplet, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySectionProps {
  title: string;
  description?: string;
  icon?: string;
  products: (Product | ProductRecommendation)[];
  showReasons?: boolean;
  defaultExpanded?: boolean;
  maxItems?: number;
  isAIGenerated?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="h-5 w-5" />,
  Plane: <Plane className="h-5 w-5" />,
  Cloud: <Cloud className="h-5 w-5" />,
  CloudRain: <CloudRain className="h-5 w-5" />,
  Sun: <Sun className="h-5 w-5" />,
  Snowflake: <Snowflake className="h-5 w-5" />,
  Mountain: <Mountain className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Shirt: <Shirt className="h-5 w-5" />,
  Smartphone: <Smartphone className="h-5 w-5" />,
  Droplet: <Droplet className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
};

export function CategorySection({
  title,
  description,
  icon,
  products,
  showReasons = false,
  defaultExpanded = true,
  maxItems = 8,
  isAIGenerated = false,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  if (products.length === 0) {
    return null;
  }

  const displayedProducts = showAll ? products : products.slice(0, maxItems);
  const hasMore = products.length > maxItems;

  return (
    <div className="border-b border-border/50 pb-6 last:border-0">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              isAIGenerated
                ? 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {iconMap[icon] || <Package className="h-5 w-5" />}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {title}
              </h3>
              {isAIGenerated && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  AI Curated
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{products.length} items</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <ProductGrid products={displayedProducts} showReasons={showReasons} columns={4} />

          {/* Show More/Less Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${products.length} items`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface KitSectionProps {
  kit: CategoryKit;
  products: Product[];
  showReasons?: boolean;
}

export function KitSection({ kit, products, showReasons = false }: KitSectionProps) {
  const kitProducts = products.filter((p) => kit.products.includes(p.id));

  return (
    <CategorySection
      title={kit.name}
      description={kit.description}
      icon={kit.icon}
      products={kitProducts}
      showReasons={showReasons}
      isAIGenerated={kit.isAIGenerated}
      maxItems={6}
    />
  );
}
