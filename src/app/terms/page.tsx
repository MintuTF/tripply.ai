'use client';

import Link from 'next/link';
import { Plane, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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

      {/* Content */}
      <main className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-4">Last updated: December 2024</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Voyagr, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of Services</h2>
              <p className="text-muted-foreground">
                You may use Voyagr for personal, non-commercial travel planning purposes.
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
                Voyagr provides AI-powered travel recommendations for informational purposes.
                While we strive for accuracy, we cannot guarantee the completeness or accuracy
                of all information. Always verify important details before making travel decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of Voyagr are owned by us and are
                protected by intellectual property laws. You may not copy, modify, or distribute
                our content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Voyagr is provided &quot;as is&quot; without warranties of any kind. We shall not
                be liable for any indirect, incidental, or consequential damages arising
                from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Continued use of Voyagr after
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
            © {new Date().getFullYear()} Voyagr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
