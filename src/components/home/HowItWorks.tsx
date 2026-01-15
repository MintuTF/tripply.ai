'use client';

import { motion } from 'framer-motion';
import { Search, MessageSquare, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Discover',
    description: 'Search for your dream destination or browse trending places. Our AI helps you find the perfect match.',
    icon: <Search className="h-7 w-7" />,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    number: 2,
    title: 'Research',
    description: 'Chat with AI to get personalized recommendations for restaurants, attractions, and local experiences.',
    icon: <MessageSquare className="h-7 w-7" />,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    number: 3,
    title: 'Plan',
    description: 'Build your day-by-day itinerary with drag-and-drop ease. Save, share, and explore with confidence.',
    icon: <Calendar className="h-7 w-7" />,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-red-500',
  },
];

interface HowItWorksProps {
  className?: string;
}

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section className={cn('py-24 bg-background', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How Voyagr Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plan your perfect trip in three simple steps. From inspiration to itinerary, we've got you covered.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 origin-left"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-card border border-border rounded-3xl p-8 h-full hover:shadow-xl transition-shadow duration-300">
                  {/* Step Number */}
                  <div className="flex items-center justify-center mb-6">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                        step.gradient
                      )}
                    >
                      <div className="text-white">{step.icon}</div>
                    </div>
                  </div>

                  {/* Number Badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center text-sm font-bold',
                        step.color
                      )}
                      style={{ borderColor: 'currentColor' }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow (not on last item) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                      <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <a
            href="/plan"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start Planning Now
            <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
