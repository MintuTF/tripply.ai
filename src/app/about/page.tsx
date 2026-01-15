'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane, Users, Globe, Heart, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
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
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              About <span className="text-primary">Voyagr</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered travel companion, helping you discover amazing destinations
              and plan unforgettable adventures.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: 'Discover the World',
                description: 'We help travelers explore destinations they never knew existed, with AI-powered recommendations tailored to their interests.',
              },
              {
                icon: Users,
                title: 'Built for Travelers',
                description: 'Every feature is designed with real travelers in mind, from research to planning to the journey itself.',
              },
              {
                icon: Heart,
                title: 'Passion for Travel',
                description: 'Our team shares your love for exploration. We build Voyagr to make travel planning as exciting as the trip.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-accent/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              To make travel planning effortless and inspiring. We combine cutting-edge AI
              technology with beautiful design to help you create trips that match your
              unique travel style. Whether you&apos;re a solo adventurer, a family traveler,
              or exploring with friends, Voyagr is here to make your journey extraordinary.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Voyagr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
