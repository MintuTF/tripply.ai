'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Plane,
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  Clock,
  Star,
  Utensils,
  Home,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { getTravelGuide, travelGuides } from '@/data/travel-guides';

export default function GuideDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const guide = getTravelGuide(slug);

  if (!guide) {
    notFound();
  }

  const otherGuides = travelGuides.filter((g) => g.slug !== slug).slice(0, 2);

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
            <Link
              href="/guides"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Guides
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16">
        <div className="relative h-[50vh] sm:h-[60vh]">
          <Image
            src={guide.heroImage}
            alt={`${guide.city}, ${guide.country}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-white rounded-full mb-4">
                  {guide.region}
                </span>
                <h1 className="text-4xl sm:text-6xl font-bold text-white mb-2">
                  {guide.city}
                </h1>
                <p className="text-2xl text-white/90 mb-2">{guide.country}</p>
                <p className="text-xl text-white/70">{guide.tagline}</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-8 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Time</p>
                <p className="font-medium text-sm">{guide.bestTime.split(',')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="font-medium text-sm">{guide.currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Language</p>
                <p className="font-medium text-sm">{guide.language}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timezone</p>
                <p className="font-medium text-sm">{guide.timezone}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Overview
            </h2>
            <div className="prose prose-lg max-w-none">
              {guide.overview.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Attractions */}
      <section className="py-12 px-4 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" />
              Top Attractions
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {guide.topAttractions.map((attraction, index) => (
                <motion.div
                  key={attraction.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl border border-border bg-card"
                >
                  <h3 className="text-xl font-semibold mb-2">{attraction.name}</h3>
                  <p className="text-muted-foreground mb-4">{attraction.description}</p>
                  <div className="flex items-start gap-2 text-sm bg-primary/10 text-primary p-3 rounded-xl">
                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{attraction.tip}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Food & Drink */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Utensils className="h-6 w-6 text-primary" />
              Food & Drink
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {guide.foodAndDrink.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="p-5 rounded-xl border border-border bg-card"
                >
                  <h3 className="font-semibold mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="py-12 px-4 bg-accent/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              Neighborhoods
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {guide.neighborhoods.map((neighborhood, index) => (
                <motion.div
                  key={neighborhood.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl border border-border bg-card"
                >
                  <h3 className="text-xl font-semibold mb-2">{neighborhood.name}</h3>
                  <p className="text-muted-foreground mb-3">{neighborhood.description}</p>
                  <p className="text-sm">
                    <span className="text-primary font-medium">Best for:</span>{' '}
                    <span className="text-muted-foreground">{neighborhood.bestFor}</span>
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Practical Tips */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Practical Tips
            </h2>
            <ul className="space-y-4">
              {guide.practicalTips.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Budget */}
      <section className="py-12 px-4 bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Budget Guide
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-semibold mb-2 text-green-600">Budget</h3>
                <p className="text-2xl font-bold mb-2">
                  {guide.budgetPerDay.budget.split(' ')[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {guide.budgetPerDay.budget.replace(/^\$[\d-]+\s*/, '')}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-semibold mb-2 text-yellow-600">Mid-Range</h3>
                <p className="text-2xl font-bold mb-2">
                  {guide.budgetPerDay.midRange.split(' ')[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {guide.budgetPerDay.midRange.replace(/^\$[\d-]+\s*/, '')}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card">
                <h3 className="font-semibold mb-2 text-purple-600">Luxury</h3>
                <p className="text-2xl font-bold mb-2">
                  {guide.budgetPerDay.luxury.split(' ')[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {guide.budgetPerDay.luxury.replace(/^\$[\d-]+\s*/, '')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Other Guides */}
      {otherGuides.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Explore Other Destinations</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {otherGuides.map((otherGuide, index) => (
                <motion.div
                  key={otherGuide.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/guides/${otherGuide.slug}`}>
                    <article className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <Image
                          src={otherGuide.image}
                          alt={`${otherGuide.city}, ${otherGuide.country}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <h3 className="text-xl font-bold text-white">
                            {otherGuide.city}, {otherGuide.country}
                          </h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-muted-foreground line-clamp-2">
                          {otherGuide.description}
                        </p>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to Visit {guide.city}?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start planning your trip with Voyagr. Discover places, save favorites, and create your perfect itinerary.
            </p>
            <Link
              href={`/?destination=${encodeURIComponent(guide.city)}`}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Plan Your Trip to {guide.city}
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
              <Link href="/guides" className="hover:text-foreground transition-colors">
                Guides
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
