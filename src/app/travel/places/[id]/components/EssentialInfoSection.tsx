'use client';

import { MapPin, Clock, Check, AlertCircle, ExternalLink } from 'lucide-react';
import type { TravelPlace } from '@/lib/travel/types';
import { cn } from '@/lib/utils';

interface EssentialInfoSectionProps {
  place: TravelPlace;
}

interface CrowdBarProps {
  day: string;
  level: number; // 0-100
}

function CrowdBar({ day, level }: CrowdBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{day}</span>
        <span className="text-sm font-medium text-gray-900">{level}%</span>
      </div>
      <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            level < 40
              ? 'bg-gradient-to-r from-purple-400 to-purple-500'
              : level < 70
              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-pink-500 to-pink-600'
          )}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

export function EssentialInfoSection({ place }: EssentialInfoSectionProps) {
  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-purple-100/50 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Essential Information
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/30">
                <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-700 leading-relaxed">
                  {place.description || 'Discover this amazing destination and create unforgettable memories during your trip.'}
                </p>
              </div>

              {/* Address & Contact */}
              {place.address && (
                <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/30">
                  <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 mb-2">{place.address}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Opening Hours */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/30">
                <h3 className="font-semibold text-gray-900 mb-3">Hours</h3>
                <div className="text-gray-700">
                  {place.openNow !== undefined ? (
                    <div className="flex items-center gap-2 mb-3">
                      {place.openNow ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-medium text-purple-600">Open now</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-pink-500" />
                          <span className="font-medium text-pink-600">Closed</span>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Opening hours list */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Monday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Tuesday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Wednesday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Thursday</span>
                      <span className="font-medium">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Friday</span>
                      <span className="font-medium">9:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-purple-100/50">
                      <span className="text-gray-600">Saturday</span>
                      <span className="font-medium">10:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Sunday</span>
                      <span className="font-medium text-pink-600">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Tips & Good to Know */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/30">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Tips & Good to Know
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">
                      Arrive early to avoid crowds and get the best experience
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">
                      Photography is welcome, perfect for capturing memories
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">
                      Allow {place.duration || '2-3 hours'} to fully explore
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-pink-600" />
                    </div>
                    <span className="text-sm text-gray-700">
                      Check weather conditions before visiting
                    </span>
                  </li>
                </ul>
              </div>

              {/* Crowd Level */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 border border-purple-100/30">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Typical Crowd Level
                </h3>
                <div className="space-y-3">
                  <CrowdBar day="Weekdays" level={45} />
                  <CrowdBar day="Weekends" level={85} />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Based on typical visitor patterns
                </p>
              </div>

              {/* Best Time to Visit */}
              <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 rounded-xl p-4 border border-purple-200/50 shadow-sm shadow-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-200">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Best Time to Visit
                    </h4>
                    <p className="text-sm text-gray-700">
                      Morning hours (9 AM - 12 PM) offer the best experience with fewer crowds and optimal lighting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
