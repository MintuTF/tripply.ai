'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { ChatConversation, ChatMode, Message } from '@/types';
import { generateUUID } from '@/lib/utils';

// LocalStorage keys
const STORAGE_KEY = 'voyagr_active_conversation';
const STORAGE_DESTINATION_KEY = 'voyagr_active_destination';
const GUEST_CONVERSATIONS_KEY = 'voyagr_guest_conversations';
const GUEST_MESSAGES_KEY = 'voyagr_guest_messages';

// Guest conversation type (stored in localStorage)
interface GuestConversation {
  id: string;
  destination: string;
  chat_mode: ChatMode;
  title: string;
  created_at: string;
  updated_at: string;
  messageCount: number;
}

interface GuestMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  text: string;
  chat_mode: ChatMode;
  created_at: string;
}

// ==================== TYPES ====================

interface ChatHistoryState {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  currentMessages: Message[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  // Guest mode data
  guestConversations: GuestConversation[];
  isGuest: boolean;
  guestMessageLimitReached: boolean;
}

interface ChatHistoryContextValue extends ChatHistoryState {
  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createNewConversation: (destination: string, mode: ChatMode) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<Message | null>;
  updateConversationMode: (mode: ChatMode) => Promise<void>;
  updateConversationTitle: (title: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  // Guest mode actions
  addGuestMessage: (message: { role: 'user' | 'assistant'; text: string; chat_mode: ChatMode }) => void;
  deleteGuestConversation: (id: string) => void;
  clearGuestData: () => void;
  // Computed
  currentConversation: ChatConversation | null;
  allConversations: (ChatConversation | GuestConversation)[]; // Combined list for drawer
}

// ==================== CONTEXT ====================

const ChatHistoryContext = createContext<ChatHistoryContextValue | null>(null);

// ==================== PROVIDER ====================

interface ChatHistoryProviderProps {
  children: ReactNode;
  userId?: string;
  initialDestination?: string;
}

// Helper to load guest data from localStorage
function loadGuestDataFromStorage(): { conversations: GuestConversation[]; messages: GuestMessage[] } {
  try {
    const conversationsJson = localStorage.getItem(GUEST_CONVERSATIONS_KEY);
    const messagesJson = localStorage.getItem(GUEST_MESSAGES_KEY);
    return {
      conversations: conversationsJson ? JSON.parse(conversationsJson) : [],
      messages: messagesJson ? JSON.parse(messagesJson) : [],
    };
  } catch {
    return { conversations: [], messages: [] };
  }
}

// Helper to save guest data to localStorage
function saveGuestDataToStorage(conversations: GuestConversation[], messages: GuestMessage[]) {
  try {
    localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(conversations));
    localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // localStorage might be unavailable
  }
}

export function ChatHistoryProvider({
  children,
  userId,
  initialDestination
}: ChatHistoryProviderProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Guest mode state
  const [guestConversations, setGuestConversations] = useState<GuestConversation[]>([]);
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const isGuest = !userId;

  // Track if we've attempted to restore from localStorage
  const hasRestoredRef = useRef(false);

  // Current conversation derived from state
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  // Check if guest has reached message limit (1 exchange = 2 messages)
  const guestMessageLimitReached = isGuest && guestMessages.length >= 2;

  // Combined conversations for drawer (auth + guest)
  const allConversations = isGuest
    ? guestConversations
    : conversations;

  // Load guest data on mount
  useEffect(() => {
    if (isGuest) {
      const { conversations: gConvs, messages: gMsgs } = loadGuestDataFromStorage();
      setGuestConversations(gConvs);
      setGuestMessages(gMsgs);

      // Load messages for current destination if exists
      if (initialDestination && gConvs.length > 0) {
        const matchingConv = gConvs.find(
          c => c.destination.toLowerCase() === initialDestination.toLowerCase()
        );
        if (matchingConv) {
          setCurrentConversationId(matchingConv.id);
          const convMessages = gMsgs.filter(m => m.conversationId === matchingConv.id);
          setCurrentMessages(convMessages.map(m => ({
            id: m.id,
            trip_id: null,
            role: m.role,
            text: m.text,
            chat_mode: m.chat_mode,
            created_at: m.created_at,
          })));
        }
      }
    }
  }, [isGuest, initialDestination]);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Select and load a conversation
  const selectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    setIsLoading(true);

    // Save to localStorage for persistence across refreshes
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage might be unavailable
    }

    try {
      const response = await fetch(`/api/chat/conversations/${id}`);
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Failed to load conversation ${id}: ${response.status} ${response.statusText}`, errorText);

        // If conversation not found (404), it might have been deleted
        if (response.status === 404) {
          console.warn(`Conversation ${id} not found, it may have been deleted`);
          // Remove from localStorage since it no longer exists
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === id) {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            // Ignore localStorage errors
          }
        }

        throw new Error(`Failed to load conversation: ${response.status}`);
      }
      const data = await response.json();
      setCurrentMessages(data.messages || []);

      // Update conversation in list with full data if available
      if (data.conversation) {
        setConversations(prev => prev.map(c =>
          c.id === id ? { ...c, ...data.conversation } : c
        ));
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setCurrentMessages([]); // Clear messages on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(async (
    destination: string,
    mode: ChatMode
  ): Promise<string | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, chat_mode: mode }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConversation = data.conversation;

        // Add to list and select it
        setConversations(prev => [newConversation, ...prev].slice(0, 5));
        setCurrentConversationId(newConversation.id);
        setCurrentMessages([]);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, newConversation.id);
          localStorage.setItem(STORAGE_DESTINATION_KEY, destination);
        } catch {
          // localStorage might be unavailable
        }

        return newConversation.id;
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }

    return null;
  }, [userId]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));

        // If we deleted the current conversation, clear it
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setCurrentMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [currentConversationId]);

  // Add a message to current conversation
  const addMessage = useCallback(async (
    message: Omit<Message, 'id' | 'created_at'>
  ): Promise<Message | null> => {
    if (!currentConversationId) return null;

    try {
      const response = await fetch(`/api/chat/conversations/${currentConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const data = await response.json();
        const newMessage = data.message;

        // Add to local messages
        setCurrentMessages(prev => [...prev, newMessage]);

        // Update conversation in list (for title/preview)
        if (message.role === 'user') {
          setConversations(prev => prev.map(c =>
            c.id === currentConversationId
              ? {
                  ...c,
                  title: message.text.slice(0, 50) + (message.text.length > 50 ? '...' : ''),
                  last_message_preview: message.text.slice(0, 100),
                  updated_at: new Date().toISOString(),
                }
              : c
          ));
        }

        return newMessage;
      }
    } catch (error) {
      console.error('Failed to add message:', error);
    }

    return null;
  }, [currentConversationId]);

  // Update current conversation's mode
  const updateConversationMode = useCallback(async (mode: ChatMode) => {
    if (!currentConversationId) return;

    try {
      await fetch(`/api/chat/conversations/${currentConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_mode: mode }),
      });

      setConversations(prev => prev.map(c =>
        c.id === currentConversationId ? { ...c, chat_mode: mode } : c
      ));
    } catch (error) {
      console.error('Failed to update conversation mode:', error);
    }
  }, [currentConversationId]);

  // Update current conversation's title (called after AI generates title)
  const updateConversationTitle = useCallback((title: string) => {
    if (!currentConversationId) return;

    setConversations(prev => prev.map(c =>
      c.id === currentConversationId ? { ...c, title } : c
    ));
  }, [currentConversationId]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // ==================== GUEST MODE FUNCTIONS ====================

  // Add message in guest mode (localStorage)
  const addGuestMessage = useCallback((message: { role: 'user' | 'assistant'; text: string; chat_mode: ChatMode }) => {
    if (!initialDestination) return;

    const now = new Date().toISOString();
    const messageId = generateUUID();

    // Check if we have a conversation for this destination
    let conversationId = guestConversations.find(
      c => c.destination.toLowerCase() === initialDestination.toLowerCase()
    )?.id;

    // Create new conversation if needed
    if (!conversationId) {
      conversationId = generateUUID();
      const newConversation: GuestConversation = {
        id: conversationId,
        destination: initialDestination,
        chat_mode: message.chat_mode,
        title: message.role === 'user' ? message.text.slice(0, 50) : 'New Chat',
        created_at: now,
        updated_at: now,
        messageCount: 0,
      };
      setGuestConversations(prev => {
        const updated = [newConversation, ...prev];
        saveGuestDataToStorage(updated, guestMessages);
        return updated;
      });
      setCurrentConversationId(conversationId);
    }

    // Create message
    const newMessage: GuestMessage = {
      id: messageId,
      conversationId,
      role: message.role,
      text: message.text,
      chat_mode: message.chat_mode,
      created_at: now,
    };

    // Update state and localStorage
    setGuestMessages(prev => {
      const updated = [...prev, newMessage];
      const convs = guestConversations.map(c =>
        c.id === conversationId
          ? { ...c, messageCount: updated.filter(m => m.conversationId === c.id).length, updated_at: now }
          : c
      );
      saveGuestDataToStorage(convs, updated);
      return updated;
    });

    // Update current messages for display
    setCurrentMessages(prev => [...prev, {
      id: messageId,
      trip_id: null,
      role: message.role,
      text: message.text,
      chat_mode: message.chat_mode,
      created_at: now,
    }]);

    // Update conversation title if user message
    if (message.role === 'user') {
      setGuestConversations(prev => {
        const updated = prev.map(c =>
          c.id === conversationId
            ? { ...c, title: message.text.slice(0, 50), updated_at: now }
            : c
        );
        saveGuestDataToStorage(updated, guestMessages);
        return updated;
      });
    }
  }, [initialDestination, guestConversations, guestMessages]);

  // Delete guest conversation
  const deleteGuestConversation = useCallback((id: string) => {
    setGuestConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      const updatedMessages = guestMessages.filter(m => m.conversationId !== id);
      setGuestMessages(updatedMessages);
      saveGuestDataToStorage(updated, updatedMessages);
      return updated;
    });

    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setCurrentMessages([]);
    }
  }, [currentConversationId, guestMessages]);

  // Clear all guest data
  const clearGuestData = useCallback(() => {
    setGuestConversations([]);
    setGuestMessages([]);
    setCurrentMessages([]);
    setCurrentConversationId(null);
    try {
      localStorage.removeItem(GUEST_CONVERSATIONS_KEY);
      localStorage.removeItem(GUEST_MESSAGES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Load conversations on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  // Auto-restore conversation from localStorage on mount (runs once when conversations load)
  useEffect(() => {
    // Only run once after conversations are loaded
    if (hasRestoredRef.current || conversations.length === 0) {
      return;
    }
    hasRestoredRef.current = true;

    // Try to restore from localStorage
    try {
      const savedConversationId = localStorage.getItem(STORAGE_KEY);

      if (savedConversationId) {
        const existingConv = conversations.find(c => c.id === savedConversationId);
        if (existingConv) {
          selectConversation(savedConversationId);
          return;
        }
      }

      // Fallback: find conversation for current destination
      if (initialDestination) {
        const matchingConv = conversations.find(
          c => c.destination.toLowerCase() === initialDestination.toLowerCase()
        );
        if (matchingConv) {
          selectConversation(matchingConv.id);
        }
      }
    } catch (error) {
      console.error('Failed to restore conversation:', error);
    }
  }, [conversations.length, initialDestination, selectConversation]);

  const value: ChatHistoryContextValue = {
    // State
    conversations,
    currentConversationId,
    currentMessages,
    isLoading,
    isSidebarOpen,
    // Guest mode state
    guestConversations,
    isGuest,
    guestMessageLimitReached,
    // Actions
    loadConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    addMessage,
    updateConversationMode,
    updateConversationTitle,
    toggleSidebar,
    closeSidebar,
    // Guest mode actions
    addGuestMessage,
    deleteGuestConversation,
    clearGuestData,
    // Computed
    currentConversation,
    allConversations,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

// ==================== HOOK ====================

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
}

// Optional: Hook that doesn't throw (for components that may be outside provider)
export function useChatHistoryOptional() {
  return useContext(ChatHistoryContext);
}
