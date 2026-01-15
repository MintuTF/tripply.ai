import type { PackingList } from '@/types/packing';

const STORAGE_KEY = 'voyagr_packing_lists';
const CURRENT_LIST_KEY = 'voyagr_current_packing_list';

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Save all packing lists
export function savePackingLists(lists: PackingList[]): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Failed to save packing lists:', error);
  }
}

// Load all packing lists
export function loadPackingLists(): PackingList[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PackingList[];
  } catch (error) {
    console.error('Failed to load packing lists:', error);
    return [];
  }
}

// Save a single packing list (updates or adds)
export function savePackingList(list: PackingList): void {
  if (!isBrowser()) return;

  const lists = loadPackingLists();
  const existingIndex = lists.findIndex((l) => l.id === list.id);

  if (existingIndex >= 0) {
    lists[existingIndex] = list;
  } else {
    lists.push(list);
  }

  savePackingLists(lists);
}

// Delete a packing list
export function deletePackingList(listId: string): void {
  if (!isBrowser()) return;

  const lists = loadPackingLists();
  const filtered = lists.filter((l) => l.id !== listId);
  savePackingLists(filtered);

  // Clear current if it was the deleted one
  const currentId = getCurrentListId();
  if (currentId === listId) {
    clearCurrentList();
  }
}

// Get a specific packing list by ID
export function getPackingListById(listId: string): PackingList | undefined {
  const lists = loadPackingLists();
  return lists.find((l) => l.id === listId);
}

// Set current active packing list
export function setCurrentList(listId: string): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(CURRENT_LIST_KEY, listId);
  } catch (error) {
    console.error('Failed to set current list:', error);
  }
}

// Get current list ID
export function getCurrentListId(): string | null {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(CURRENT_LIST_KEY);
  } catch (error) {
    console.error('Failed to get current list ID:', error);
    return null;
  }
}

// Get current active packing list
export function getCurrentList(): PackingList | undefined {
  const currentId = getCurrentListId();
  if (!currentId) return undefined;
  return getPackingListById(currentId);
}

// Clear current list selection
export function clearCurrentList(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(CURRENT_LIST_KEY);
  } catch (error) {
    console.error('Failed to clear current list:', error);
  }
}

// Get lists by destination
export function getListsByDestination(destination: string): PackingList[] {
  const lists = loadPackingLists();
  const searchTerm = destination.toLowerCase();
  return lists.filter((l) =>
    l.destination.toLowerCase().includes(searchTerm)
  );
}

// Get templates only
export function getTemplates(): PackingList[] {
  const lists = loadPackingLists();
  return lists.filter((l) => l.isTemplate);
}

// Get non-template lists only
export function getTrips(): PackingList[] {
  const lists = loadPackingLists();
  return lists.filter((l) => !l.isTemplate);
}

// Get recent lists (last 5)
export function getRecentLists(limit: number = 5): PackingList[] {
  const lists = loadPackingLists();
  return lists
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

// Export packing list as JSON
export function exportPackingList(list: PackingList): string {
  return JSON.stringify(list, null, 2);
}

// Import packing list from JSON
export function importPackingList(json: string): PackingList | null {
  try {
    const list = JSON.parse(json) as PackingList;
    // Validate required fields
    if (!list.id || !list.name || !list.items) {
      throw new Error('Invalid packing list format');
    }
    return list;
  } catch (error) {
    console.error('Failed to import packing list:', error);
    return null;
  }
}

// Export packing list as plain text (for sharing/printing)
export function exportAsText(list: PackingList): string {
  const lines: string[] = [
    `# ${list.name}`,
    `Destination: ${list.destination}`,
    `Duration: ${list.duration} days`,
    '',
  ];

  // Group items by category
  const grouped = list.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof list.items>);

  for (const [category, items] of Object.entries(grouped)) {
    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    for (const item of items) {
      const checkbox = item.isPacked ? '[x]' : '[ ]';
      const essential = item.isEssential ? '*' : '';
      const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
      lines.push(`${checkbox} ${essential}${item.name}${qty}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Clear all packing data (for testing/reset)
export function clearAllPackingData(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_LIST_KEY);
  } catch (error) {
    console.error('Failed to clear packing data:', error);
  }
}

// Get storage statistics
export function getStorageStats(): {
  totalLists: number;
  templates: number;
  trips: number;
  totalItems: number;
  packedItems: number;
} {
  const lists = loadPackingLists();
  const templates = lists.filter((l) => l.isTemplate).length;
  const trips = lists.filter((l) => !l.isTemplate).length;
  const totalItems = lists.reduce((sum, l) => sum + l.items.length, 0);
  const packedItems = lists.reduce(
    (sum, l) => sum + l.items.filter((i) => i.isPacked).length,
    0
  );

  return {
    totalLists: lists.length,
    templates,
    trips,
    totalItems,
    packedItems,
  };
}
