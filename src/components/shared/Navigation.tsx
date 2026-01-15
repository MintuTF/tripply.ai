'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const handleDestinationsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.getElementById('explore-destinations');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Voyagr
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={isHomePage ? '#explore-destinations' : '/#explore-destinations'}
              onClick={handleDestinationsClick}
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Destinations
            </Link>
            <Link
              href="/trips"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Trips
            </Link>
            <Link
              href="/plan"
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Planning
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
