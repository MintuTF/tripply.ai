'use client';

import Link from 'next/link';
import { Plane, ArrowLeft } from 'lucide-react';
import { Navigation } from '@/components/shared/Navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Content */}
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-4">Last updated: December 2024</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Tripply, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of Services</h2>
              <p className="text-muted-foreground">
                You may use Tripply for personal, non-commercial travel planning purposes.
                You agree not to misuse our services, violate any laws, or infringe on the
                rights of others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Responsibilities</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account. Please
                notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Content and AI Recommendations</h2>
              <p className="text-muted-foreground">
                Tripply provides AI-powered travel recommendations for informational purposes.
                While we strive for accuracy, we cannot guarantee the completeness or accuracy
                of all information. Always verify important details before making travel decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of Tripply are owned by us and are
                protected by intellectual property laws. You may not copy, modify, or distribute
                our content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Tripply is provided &quot;as is&quot; without warranties of any kind. We shall not
                be liable for any indirect, incidental, or consequential damages arising
                from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of Tripply after
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please visit our{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tripply. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
