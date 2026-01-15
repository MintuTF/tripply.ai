'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Compass, User, MessageSquare, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '../context/TravelContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/auth/UserMenu';
import { SignInModal } from '@/components/auth/SignInModal';
import { SavedPlacesBadge } from '@/components/shared/SavedPlacesBadge';
import { buildTravelUrl, type TravelTab as UrlTravelTab } from '@/lib/travel/url-utils';
import type { TravelTab } from '@/lib/travel/types';

interface TravelHeaderProps {
  tripName?: string | null;
  citySlug?: string;
  onOpenSavedPanel?: () => void;
}

// Map internal tab IDs to URL tab paths
const TAB_TO_URL: Record<string, UrlTravelTab> = {
  explore: 'explore',
  chat: 'chat',
  board: 'board',
  marketplace: 'shop',
};

const TABS: { id: TravelTab; urlId: UrlTravelTab; label: string; icon: React.ElementType }[] = [
  { id: 'explore', urlId: 'explore', label: 'Explore', icon: Compass },
  { id: 'chat', urlId: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'board', urlId: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'marketplace', urlId: 'shop', label: 'Shop', icon: ShoppingBag },
];

export function TravelHeader({ tripName, citySlug, onOpenSavedPanel }: TravelHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setActiveTab } = useTravel();
  const { activeTab, savedPlaceIds } = state;
  const { user, loading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const handleTabChange = (tab: TravelTab, urlTab: UrlTravelTab) => {
    // Update context state
    setActiveTab(tab);

    // Use path-based routing if we have a citySlug
    if (citySlug) {
      const url = buildTravelUrl(citySlug, urlTab, tripName || undefined);
      router.push(url);
    } else {
      // Fallback for old URL structure (landing page without city)
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`/travel?${params.toString()}`, { scroll: false });
    }
  };

  // Wrapper for UserMenu which passes just the tab string
  const handleUserMenuTabChange = (tab: string) => {
    const urlTab = TAB_TO_URL[tab] || 'explore';
    handleTabChange(tab as TravelTab, urlTab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Saved Badge */}
          <div className="flex items-center gap-4">
            <Link
              href="/travel"
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200 group-hover:shadow-purple-300 transition-shadow">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Voyagr
              </span>
            </Link>

            {/* Saved Places Badge */}
            {onOpenSavedPanel && (
              <SavedPlacesBadge
                count={savedPlaceIds.length}
                onClick={onOpenSavedPanel}
              />
            )}
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-purple-50/50 rounded-full p-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id, tab.urlId)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-purple-700'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-full shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center">
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <UserMenu onTabChange={handleUserMenuTabChange} savedCount={savedPlaceIds.length} />
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sign In Modal */}
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  );
}
