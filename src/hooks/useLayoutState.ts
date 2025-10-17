'use client';

import { create } from 'zustand';

/**
 * Layout state management for chat UI transitions
 * Handles the centered (landing) -> active (docked) -> focus modes
 */

export type LayoutMode = 'landing' | 'active' | 'focus';

interface LayoutState {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  activate: () => void;
  focusChat: () => void;
  reset: () => void;
}

export const useLayoutState = create<LayoutState>((set) => ({
  mode: 'landing',

  setMode: (mode) => set({ mode }),

  // Transition from landing to active (after first message)
  activate: () => set({ mode: 'active' }),

  // Transition to focus mode (full screen chat)
  focusChat: () => set({ mode: 'focus' }),

  // Reset to landing
  reset: () => set({ mode: 'landing' }),
}));
