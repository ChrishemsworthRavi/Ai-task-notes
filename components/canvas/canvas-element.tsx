"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CanvasElementProps {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'sticky' | 'frame' | 'line' | 'arrow' | 'pen';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  strokeWidth?: number;
  points?: { x: number; y: number }[];
  onUpdate?: (id: string, updates: Partial<CanvasElementProps>) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  zoom?: number;
}

export default function CanvasElement({
  id,
  type,
  x,
  y,
  width = 100,
  height = 100,
  content = '',
  color = '#3b82f6',
  strokeWidth = 2,
  points = [],
  onUpdate,
  onSelect,
  isSelected = false,
  zoom = 100
}: CanvasElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y
    });
    onSelect?.(id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'text' || type === 'sticky') {
      setIsEditing(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && onUpdate) {
      onUpdate(id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, onUpdate, id, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    onSelect?.(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    const startXPos = x;
    const startYPos = y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (direction.includes('e')) {
        newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX));
      }
      if (direction.includes('s')) {
        newHeight = Math.max(20, startHeight + (moveEvent.clientY - startY));
      }
      if (direction.includes('w')) {
        const diffX = moveEvent.clientX - startX;
        newWidth = Math.max(20, startWidth - diffX);
        newX = startXPos + diffX;
      }
      if (direction.includes('n')) {
        const diffY = moveEvent.clientY - startY;
        newHeight = Math.max(20, startHeight - diffY);
        newY = startYPos + diffY;
      }

      onUpdate?.(id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleContentChange = (newContent: string) => {
    onUpdate?.(id, { content: newContent });
  };

  useEffect(() => {
    const handleMouseMoveIfDragging = (e: MouseEvent) => {
      if (isDragging) handleMouseMove(e);
    };

    const handleMouseUpIfDragging = (e: MouseEvent) => {
      if (isDragging) handleMouseUp();
    };

    document.addEventListener('mousemove', handleMouseMoveIfDragging);
    document.addEventListener('mouseup', handleMouseUpIfDragging);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveIfDragging);
      document.removeEventListener('mouseup', handleMouseUpIfDragging);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const baseClasses = `absolute transition-all duration-75 ${
    isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
  }`;

  const commonStyles = {
    left: x,
    top: y,
    width,
    height
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      {type !== 'pen' && (
        <div
          ref={elementRef}
          className={baseClasses + ' cursor-move'}
          style={commonStyles}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {type === 'rectangle' && (
            <div className="w-full h-full border-2 rounded-lg" style={{ backgroundColor: color + '20', borderColor: color }} />
          )}
          {type === 'circle' && (
            <div className="w-full h-full border-2 rounded-full" style={{ backgroundColor: color + '20', borderColor: color }} />
          )}
          {type === 'frame' && (
            <>
              <div className="w-full h-full border-2 border-dashed rounded-lg" style={{ borderColor: color }} />
              <div className="absolute -top-6 left-0 text-xs text-slate-600 font-medium bg-white px-2 py-1 rounded">Frame</div>
            </>
          )}
          {type === 'sticky' && (
            <div className="w-full h-full rounded-lg shadow-md p-2 text-sm" style={{ backgroundColor: color }}>
              {isEditing ? (
                <textarea
                  className="w-full h-full outline-none resize-none bg-transparent text-slate-900"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                />
              ) : (
                <div className="whitespace-pre-wrap" onClick={() => setIsEditing(true)}>
                  {content || 'Double-click to edit'}
                </div>
              )}
            </div>
          )}
          {type === 'text' && (
            <div className="w-full h-full p-1">
              {isEditing ? (
                <textarea
                  className="w-full h-full outline-none resize-none bg-transparent text-slate-900 font-medium"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                />
              ) : (
                <div className="p-1 text-slate-900 font-medium whitespace-pre-wrap">{content || 'Double-click to edit'}</div>
              )}
            </div>
          )}

          {isSelected && (
            <>
              <div onMouseDown={(e) => handleResizeMouseDown(e, 'se')} className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
              <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
              <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"></div>
              <div onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"></div>
            </>
          )}
        </div>
      )}

      {type === 'pen' && points.length > 1 && (
        <div
          className={baseClasses}
          style={{
            left: Math.min(...points.map(p => p.x)),
            top: Math.min(...points.map(p => p.y)),
            width: Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)),
            height: Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))
          }}
        >
          <svg width="100%" height="100%">
            <path
              d={`M ${points.map(p => `${p.x - Math.min(...points.map(p => p.x))},${p.y - Math.min(...points.map(p => p.y))}`).join(' L ')}`}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}