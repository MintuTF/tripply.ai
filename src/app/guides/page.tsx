'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plane, ArrowLeft, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { travelGuides } from '@/data/travel-guides';

export default function GuidesPage() {
  // Group guides by region
  const regions = [...new Set(travelGuides.map((g) => g.region))];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Voyagr</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/blog"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Blog
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Travel <span className="text-primary">Guides</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive destination guides to help you plan the perfect trip. From top attractions to local tips, we&apos;ve got you covered.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Guide */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href={`/guides/${travelGuides[0].slug}`}>
              <div className="relative rounded-3xl overflow-hidden group cursor-pointer">
                <div className="aspect-[21/9] relative">
                  <Image
                    src={travelGuides[0].heroImage}
                    alt={travelGuides[0].city}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-white rounded-full mb-4">
                    Featured Guide
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                    {travelGuides[0].city}, {travelGuides[0].country}
                  </h2>
                  <p className="text-white/80 text-lg mb-4 max-w-2xl">
                    {travelGuides[0].tagline} — {travelGuides[0].description}
                  </p>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {travelGuides[0].region}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Best: {travelGuides[0].bestTime.split(',')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Guides by Region */}
      {regions.map((region, regionIndex) => (
        <section key={region} className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-8"
            >
              {region}
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {travelGuides
                .filter((guide) => guide.region === region)
                .map((guide, index) => (
                  <motion.div
                    key={guide.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link href={`/guides/${guide.slug}`}>
                      <article className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="aspect-[16/9] relative overflow-hidden">
                          <Image
                            src={guide.image}
                            alt={`${guide.city}, ${guide.country}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-2xl font-bold text-white">
                              {guide.city}
                            </h3>
                            <p className="text-white/80">{guide.country}</p>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-primary font-medium mb-2">
                            {guide.tagline}
                          </p>
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {guide.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {guide.bestTime.split(',')[0]}
                            </span>
                            <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                              Read guide
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-accent/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Use Voyagr to discover places, save favorites, and build your perfect itinerary.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Planning
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Voyagr. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
