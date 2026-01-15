import { TravelProvider } from './context/TravelContext';

export const metadata = {
  title: 'Travel Research | Voyagr',
  description: 'Discover and plan your next adventure with AI-powered travel recommendations',
};

export default function TravelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TravelProvider>
      {children}
    </TravelProvider>
  );
}
