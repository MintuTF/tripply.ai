'use client';

import { Heart, MapPin, Plane } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-8 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Voyagr</span>
            </div>
            <p className="text-gray-400 text-sm md:text-base max-w-md">
              Discover amazing destinations, get personalized recommendations,
              and plan your perfect trip with AI-powered travel assistance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/travel" className="hover:text-white transition-colors">
                  Discover Places
                </a>
              </li>
              <li>
                <a href="/travel" className="hover:text-white transition-colors">
                  Popular Destinations
                </a>
              </li>
              <li>
                <a href="/travel" className="hover:text-white transition-colors">
                  Travel Guides
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-4 pt-4 md:mt-10 md:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Voyagr. All rights reserved.
            </p>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span>for travelers</span>
            </div>

            {/* Attribution */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Powered by Google Places</span>
              <span>•</span>
              <span>Maps by Mapbox</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
