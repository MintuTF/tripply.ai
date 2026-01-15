'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthProvider';
import { LogOut, Map, ChevronDown, Bookmark, Plane } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/gravatar';

interface UserMenuProps {
  onTabChange?: (tab: string) => void;
  savedCount?: number;
}

export function UserMenu({ onTabChange, savedCount = 0 }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isOnTravelPage = pathname === '/travel';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside both the button and the dropdown
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  // Use OAuth avatar if available, otherwise fall back to Gravatar
  const avatarUrl = getAvatarUrl(user.user_metadata?.avatar_url, user.email);
  const name = user.user_metadata?.full_name || user.email;

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed w-56 rounded-lg border bg-card shadow-lg z-[9999]"
      style={{ top: dropdownStyle.top, right: dropdownStyle.right }}
    >
      <div className="flex items-center gap-2 p-3 border-b">
        <img
          src={avatarUrl}
          alt={name || 'User'}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {user.email}
          </span>
        </div>
      </div>

      <div className="p-1">
        {/* Trips */}
        <button
          onClick={() => {
            setIsOpen(false);
            if (isOnTravelPage && onTabChange) {
              onTabChange('trips');
            } else {
              router.push('/travel?tab=trips');
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
        >
          <Plane className="h-4 w-4" />
          My Trips
        </button>

        {/* Saved */}
        <button
          onClick={() => {
            setIsOpen(false);
            if (isOnTravelPage && onTabChange) {
              onTabChange('saved');
            } else {
              router.push('/travel?tab=saved');
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
        >
          <span className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Places
          </span>
          {savedCount > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      <div className="border-t p-1">
        <button
          onClick={() => {
            setIsOpen(false);
            signOut();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors"
      >
        <img
          src={avatarUrl}
          alt={name || 'User'}
          className="h-9 w-9 rounded-full object-cover"
        />
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
