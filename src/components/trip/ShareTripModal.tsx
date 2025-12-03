'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Link2,
  Copy,
  Check,
  Mail,
  Eye,
  MessageSquare,
  Edit3,
  Loader2,
  Send,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ShareRole = 'viewer' | 'commenter' | 'editor';

interface ShareLink {
  id: string;
  token: string;
  role: ShareRole;
  expires_at?: string;
  created_at: string;
}

interface ShareTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
}

const roleConfig: Record<ShareRole, { label: string; description: string; icon: React.ReactNode }> = {
  viewer: {
    label: 'Viewer',
    description: 'Can view the trip but cannot make changes',
    icon: <Eye className="h-4 w-4" />,
  },
  commenter: {
    label: 'Commenter',
    description: 'Can view and add comments',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  editor: {
    label: 'Editor',
    description: 'Can view and edit the trip',
    icon: <Edit3 className="h-4 w-4" />,
  },
};

export function ShareTripModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
}: ShareTripModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [selectedRole, setSelectedRole] = useState<ShareRole>('viewer');
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [emailRole, setEmailRole] = useState<ShareRole>('viewer');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate share link
  const generateShareLink = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate share link');
      }

      const data = await response.json();
      setShareLink(data.shareLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (!shareLink) return;

    const url = `${window.location.origin}/shared/${shareLink.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  // Send email invitation
  const sendEmailInvitation = async () => {
    if (!email.trim()) return;

    setIsSendingEmail(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: emailRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setEmailSent(true);
      setEmail('');
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setShareLink(null);
    setError(null);
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const shareUrl = shareLink
    ? `${window.location.origin}/shared/${shareLink.token}`
    : '';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Share Trip</h2>
              <p className="text-sm text-muted-foreground">{tripTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('link')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === 'link'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Link2 className="h-4 w-4" />
            Share Link
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === 'email'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Mail className="h-4 w-4" />
            Email Invite
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'link' ? (
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Permission level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as ShareRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setShareLink(null);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                        selectedRole === role
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          selectedRole === role
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent text-muted-foreground'
                        )}
                      >
                        {roleConfig[role].icon}
                      </div>
                      <span className="text-xs font-medium">
                        {roleConfig[role].label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {roleConfig[selectedRole].description}
                </p>
              </div>

              {/* Generate/Copy Link */}
              {shareLink ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-accent rounded-xl">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-foreground truncate outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        isCopied
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setShareLink(null)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Generate new link
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateShareLink}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Generate Share Link
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Permission level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as ShareRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setEmailRole(role)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                        emailRole === role
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          emailRole === role
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent text-muted-foreground'
                        )}
                      >
                        {roleConfig[role].icon}
                      </div>
                      <span className="text-xs font-medium">
                        {roleConfig[role].label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={sendEmailInvitation}
                disabled={!email.trim() || isSendingEmail}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50',
                  emailSent
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    <Check className="h-4 w-4" />
                    Invitation Sent!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
