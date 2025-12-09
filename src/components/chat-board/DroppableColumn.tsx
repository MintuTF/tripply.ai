'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DroppableColumnProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  count?: number;
  icon?: ReactNode;
  accentColor?: string;
}

export function DroppableColumn({
  id,
  title,
  children,
  className,
  emptyMessage = 'Drop items here',
  count,
  icon,
  accentColor = 'primary',
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-200',
        isOver && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        {icon && <div className={cn('text-muted-foreground', isOver && 'text-primary')}>{icon}</div>}
        <h3 className="font-semibold text-foreground">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className={cn(
            'ml-auto px-2 py-0.5 rounded-full text-xs font-medium',
            accentColor === 'green' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
          )}>
            {count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-auto">
        {children}

        {/* Empty state */}
        {count === 0 && (
          <div className={cn(
            'flex flex-col items-center justify-center h-32 text-center transition-colors',
            isOver ? 'text-primary' : 'text-muted-foreground'
          )}>
            <p className="text-sm">{emptyMessage}</p>
            <p className="text-xs mt-1 opacity-75">
              {isOver ? 'Release to drop' : 'Drag cards here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
