'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star, CheckCircle, Plane } from 'lucide-react';
import { HeroSearch, TrendingCarousel, CuratedCollections, HowItWorks } from '@/components/home';
import { AdSlot } from '@/components/ads/AdSlot';
import { AdSlotAutoRefresh } from '@/components/ads/AdSlotAutoRefresh';
import { AD_SLOTS } from '@/lib/adsense/config';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Glassmorphism style */}
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
                href="/discover"
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

      {/* Hero Section with Full-Screen Image */}
      <HeroSearch />

      {/* Social Proof Strip */}
      <section className="py-8 bg-accent/50 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>4.9/5 from 10,000+ travelers</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Free to use</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-powered recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Destinations Carousel */}
      <TrendingCarousel />

      {/* Curated Collections */}
      <CuratedCollections />

      {/* How It Works */}
      <HowItWorks />

      {/* Section Divider Ad */}
      <section className="py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlot
            slot={AD_SLOTS.HOMEPAGE_SECTION_DIVIDER}
            format="horizontal"
            responsive={true}
            layout="display"
            priority="normal"
          />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg mx-auto mb-8">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Ready for your next
              <br />
              <span className="text-primary">adventure?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of travelers who use Voyagr to discover new destinations,
              get AI-powered recommendations, and create unforgettable experiences.
            </p>
            <Link
              href="/plan"
              className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Planning Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Advertisement Section - Auto-refresh for high traffic */}
      <section className="py-8 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlotAutoRefresh
            slot={AD_SLOTS.HOMEPAGE_FOOTER_LEADERBOARD}
            format="horizontal"
            responsive={true}
            layout="display"
            priority="high"
            enableAutoRefresh={true}
            refreshInterval={45000}
            maxRefreshes={8}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">Voyagr</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI-powered travel companion for discovering and planning amazing trips.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/plan" className="hover:text-foreground transition-colors">Plan a Trip</Link></li>
                <li><Link href="/discover" className="hover:text-foreground transition-colors">Destinations</Link></li>
                <li><Link href="/trips" className="hover:text-foreground transition-colors">My Trips</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Voyagr. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made with AI, for travelers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
