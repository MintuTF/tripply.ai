'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt,
  Droplet,
  Laptop,
  FileText,
  Heart,
  Watch,
  Backpack,
  Package,
  Plus,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PackingList, PackingItem, PackingCategory, PackingProgress } from '@/types/packing';
import { calculatePackingProgress, CATEGORY_META } from '@/types/packing';
import { PackingItemRow } from './PackingItemRow';

// Category icons
const CATEGORY_ICONS: Record<PackingCategory, React.ReactNode> = {
  clothing: <Shirt className="h-4 w-4" />,
  toiletries: <Droplet className="h-4 w-4" />,
  electronics: <Laptop className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  accessories: <Watch className="h-4 w-4" />,
  gear: <Backpack className="h-4 w-4" />,
  misc: <Package className="h-4 w-4" />,
};

interface PackingListViewProps {
  list: PackingList;
  onUpdateList: (list: PackingList) => void;
  onAddItem?: () => void;
}

export function PackingListView({ list, onUpdateList, onAddItem }: PackingListViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<PackingCategory>>(
    new Set(CATEGORY_META.map((c) => c.id))
  );
  const [progress, setProgress] = useState<PackingProgress | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PackingCategory>('misc');

  // Calculate progress
  useEffect(() => {
    setProgress(calculatePackingProgress(list.items));
  }, [list.items]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: PackingCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Toggle item packed status
  const handleTogglePacked = useCallback(
    (itemId: string) => {
      const updatedItems = list.items.map((item) =>
        item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
      );
      onUpdateList({ ...list, items: updatedItems, updatedAt: new Date().toISOString() });
    },
    [list, onUpdateList]
  );

  // Update item quantity
  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      const updatedItems = list.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      onUpdateList({ ...list, items: updatedItems, updatedAt: new Date().toISOString() });
    },
    [list, onUpdateList]
  );

  // Remove item
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const updatedItems = list.items.filter((item) => item.id !== itemId);
      onUpdateList({ ...list, items: updatedItems, updatedAt: new Date().toISOString() });
    },
    [list, onUpdateList]
  );

  // Add new item
  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;

    const newItem: PackingItem = {
      id: `pack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: 1,
      isPacked: false,
      isEssential: false,
      customItem: true,
    };

    onUpdateList({
      ...list,
      items: [...list.items, newItem],
      updatedAt: new Date().toISOString(),
    });

    setNewItemName('');
    setShowAddItem(false);
  }, [newItemName, newItemCategory, list, onUpdateList]);

  // Group items by category
  const itemsByCategory = list.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<PackingCategory, PackingItem[]>);

  return (
    <div className="space-y-6">
      {/* Progress section */}
      {progress && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Packing Progress</h3>
            <span className="text-2xl font-bold text-primary">{progress.percentComplete}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentComplete}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{progress.packedItems}</div>
              <div className="text-xs text-muted-foreground">Packed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{progress.totalItems - progress.packedItems}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{progress.essentialItems}</div>
              <div className="text-xs text-muted-foreground">Essential</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{progress.packedEssentials}</div>
              <div className="text-xs text-muted-foreground">Essential Packed</div>
            </div>
          </div>
        </div>
      )}

      {/* Add item section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowAddItem(!showAddItem)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">Add Custom Item</span>
          </div>
          {showAddItem ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {showAddItem && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border"
            >
              <div className="p-4 space-y-4">
                <input
                  type="text"
                  placeholder="Item name..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_META.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewItemCategory(cat.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        newItemCategory === cat.id
                          ? 'bg-primary text-white'
                          : 'bg-accent hover:bg-accent/80'
                      )}
                    >
                      {CATEGORY_ICONS[cat.id]}
                      {cat.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddItem}
                    disabled={!newItemName.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items by category */}
      <div className="space-y-4">
        {CATEGORY_META.map((categoryMeta) => {
          const categoryItems = itemsByCategory[categoryMeta.id] || [];
          if (categoryItems.length === 0) return null;

          const categoryProgress = progress?.byCategory[categoryMeta.id];
          const isExpanded = expandedCategories.has(categoryMeta.id);

          return (
            <div
              key={categoryMeta.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(categoryMeta.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      categoryProgress?.percent === 100
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {categoryProgress?.percent === 100 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      CATEGORY_ICONS[categoryMeta.id]
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{categoryMeta.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {categoryProgress?.packed}/{categoryProgress?.total} packed
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {categoryProgress && categoryProgress.total > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${categoryProgress.percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right">
                        {categoryProgress.percent}%
                      </span>
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Category items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-3 space-y-2">
                      {categoryItems.map((item) => (
                        <PackingItemRow
                          key={item.id}
                          item={item}
                          onTogglePacked={handleTogglePacked}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemoveItem={handleRemoveItem}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {list.items.length === 0 && (
        <div className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
          <p className="text-muted-foreground mb-4">
            Start adding items to your packing list
          </p>
          <button
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Item
          </button>
        </div>
      )}
    </div>
  );
}
