'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Trip } from '@/types';
import { cn } from '@/lib/utils';
import {
  Download,
  Calendar,
  Share2,
  FileText,
  Check,
  Copy,
  Mail,
  Printer,
  Video,
  Sparkles,
} from 'lucide-react';
import { exportToPDF, exportToCalendar, generateShareLink, copyToClipboard } from '@/lib/utils/export';
import { StoryGeneratorModal } from '@/components/story/StoryGeneratorModal';

interface ExportMenuProps {
  trip: Trip;
  cards: Card[];
}

export function ExportMenu({ trip, cards }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const confirmedCount = cards.filter(c => c.labels?.includes('confirmed')).length;
  const hasConfirmedCards = confirmedCount > 0;

  const handleExportPDF = async () => {
    setLoading('pdf');
    try {
      await exportToPDF(trip, cards);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  const handleExportCalendar = async () => {
    setLoading('calendar');
    try {
      await exportToCalendar(trip, cards);
    } catch (error) {
      console.error('Calendar export failed:', error);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  const handleShare = async () => {
    const shareLink = generateShareLink(trip.id);
    const success = await copyToClipboard(shareLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl gradient-secondary px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
      >
        <Download className="h-4 w-4" />
        Export & Share
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border-2 border-border bg-card shadow-2xl"
            >
              <div className="p-2 space-y-1">
                {/* Section: Export */}
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                  Export
                </div>

                {/* Export PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={loading === 'pdf'}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                    'hover:bg-accent',
                    loading === 'pdf' && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <FileText className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Export as PDF</p>
                    <p className="text-xs text-muted-foreground">Beautiful printable itinerary</p>
                  </div>
                </button>

                {/* Export Calendar */}
                <button
                  onClick={handleExportCalendar}
                  disabled={loading === 'calendar'}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                    'hover:bg-accent',
                    loading === 'calendar' && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Export to Calendar</p>
                    <p className="text-xs text-muted-foreground">Add events to Google/Apple Calendar</p>
                  </div>
                </button>

                {/* Print */}
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-accent"
                >
                  <Printer className="h-5 w-5 text-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Print Itinerary</p>
                    <p className="text-xs text-muted-foreground">Print-friendly format</p>
                  </div>
                </button>

                <div className="my-2 h-px bg-border" />

                {/* Section: Create */}
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                  Create
                </div>

                {/* Create Story Video */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowStoryModal(true);
                  }}
                  disabled={!hasConfirmedCards}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                    hasConfirmedCards ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="relative">
                    <Video className="h-5 w-5 text-purple-500" />
                    <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Create Story Video</p>
                    <p className="text-xs text-muted-foreground">
                      {hasConfirmedCards
                        ? 'TikTok / Reels style video'
                        : 'Confirm items first'}
                    </p>
                  </div>
                </button>

                <div className="my-2 h-px bg-border" />

                {/* Section: Share */}
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                  Share
                </div>

                {/* Copy Link */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-accent"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Copy className="h-5 w-5 text-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {copied ? 'Link Copied!' : 'Copy Share Link'}
                    </p>
                    <p className="text-xs text-muted-foreground">Share with friends & family</p>
                  </div>
                </button>

                {/* Email (Future) */}
                <button
                  disabled
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left opacity-50 cursor-not-allowed"
                >
                  <Mail className="h-5 w-5 text-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Email Itinerary</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="border-t border-border p-2">
                <p className="text-xs text-center text-muted-foreground">
                  {confirmedCount} confirmed items
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Story Generator Modal */}
      <StoryGeneratorModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        tripId={trip.id}
        tripTitle={trip.title}
      />
    </div>
  );
}
