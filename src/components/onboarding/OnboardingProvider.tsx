'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
  progress: number;
  isHydrated: boolean;
  completeStep: (step: OnboardingStep) => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
  shouldShowTooltip: (step: OnboardingStep) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}
