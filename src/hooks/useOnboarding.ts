'use client';

import { useState, useEffect, useCallback } from 'react';

export type OnboardingStep =
  | 'search-places'
  | 'add-to-trip'
  | 'view-board'
  | 'save-trip';

const ONBOARDING_STORAGE_KEY = 'tripply-onboarding';

interface OnboardingState {
  completedSteps: OnboardingStep[];
  dismissed: boolean;
  startedAt?: string;
}

const defaultState: OnboardingState = {
  completedSteps: [],
  dismissed: false,
};

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OnboardingState;
        setState(parsed);
      } else {
        // First time user - start onboarding
        const initialState = {
          ...defaultState,
          startedAt: new Date().toISOString(),
        };
        setState(initialState);
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(initialState));
      }
    } catch {
      // Ignore errors
    }
    setIsHydrated(true);
  }, []);

  // Determine current step based on completed steps
  useEffect(() => {
    if (!isHydrated || state.dismissed) {
      setCurrentStep(null);
      return;
    }

    const steps: OnboardingStep[] = ['search-places', 'add-to-trip', 'view-board', 'save-trip'];
    const nextStep = steps.find(step => !state.completedSteps.includes(step));
    setCurrentStep(nextStep || null);
  }, [isHydrated, state.completedSteps, state.dismissed]);

  // Mark a step as completed
  const completeStep = useCallback((step: OnboardingStep) => {
    setState(prev => {
      if (prev.completedSteps.includes(step)) return prev;

      const newState = {
        ...prev,
        completedSteps: [...prev.completedSteps, step],
      };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Dismiss all onboarding
  const dismissOnboarding = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, dismissed: true };
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Reset onboarding (for testing)
  const resetOnboarding = useCallback(() => {
    const initialState = {
      ...defaultState,
      startedAt: new Date().toISOString(),
    };
    setState(initialState);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(initialState));
  }, []);

  // Check if a specific step should show its tooltip
  const shouldShowTooltip = useCallback((step: OnboardingStep) => {
    return isHydrated && !state.dismissed && currentStep === step;
  }, [isHydrated, state.dismissed, currentStep]);

  // Check if onboarding is complete
  const isComplete = state.completedSteps.length >= 4 || state.dismissed;

  // Progress percentage
  const progress = (state.completedSteps.length / 4) * 100;

  return {
    currentStep,
    completedSteps: state.completedSteps,
    isComplete,
    progress,
    isHydrated,
    completeStep,
    dismissOnboarding,
    resetOnboarding,
    shouldShowTooltip,
  };
}
