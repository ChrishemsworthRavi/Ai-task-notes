"use client";

import { useState, useRef, useEffect } from 'react';
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

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && onUpdate) {
      onUpdate(id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleContentChange = (newContent: string) => {
    onUpdate?.(id, { content: newContent });
  };

  // Add event listeners when dragging
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  const renderElement = () => {
    const baseClasses = `absolute transition-all duration-200 ${
      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
    }`;

    const scaleAdjustment = 100 / zoom;

    switch (type) {
      case 'frame':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} border-2 border-dashed border-slate-400 bg-transparent rounded-lg cursor-move hover:border-slate-500`}
            style={{
              left: x,
              top: y,
              width,
              height,
              borderColor: color
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <div className="absolute -top-6 left-0 text-xs text-slate-600 font-medium bg-white px-2 py-1 rounded">
              Frame
            </div>
            {isSelected && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
              </>
            )}
          </div>
        );

      case 'rectangle':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} border-2 rounded-lg cursor-move hover:shadow-md`}
            style={{
              left: x,
              top: y,
              width,
              height,
              backgroundColor: color + '20',
              borderColor: color
            }}
            onMouseDown={handleMouseDown}
          >
            {isSelected && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
              </>
            )}
          </div>
        );

      case 'circle':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} border-2 rounded-full cursor-move hover:shadow-md`}
            style={{
              left: x,
              top: y,
              width,
              height,
              backgroundColor: color + '20',
              borderColor: color
            }}
            onMouseDown={handleMouseDown}
          >
            {isSelected && (
              <>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-n-resize"></div>
                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-e-resize"></div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-s-resize"></div>
                <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full cursor-w-resize"></div>
              </>
            )}
          </div>
        );

      case 'text':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} cursor-move min-w-[100px] min-h-[40px] ${
              isEditing ? 'border-2 border-blue-300' : 'border-2 border-transparent hover:border-slate-300'
            }`}
            style={{
              left: x,
              top: y,
              width: width === 100 ? 'auto' : width,
              height: height === 100 ? 'auto' : height
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <textarea
                className="w-full h-full outline-none resize-none bg-transparent text-slate-900 font-medium p-2"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
              />
            ) : (
              <div className="p-2 text-slate-900 font-medium whitespace-pre-wrap">
                {content || 'Double-click to edit'}
              </div>
            )}
          </div>
        );

      case 'sticky':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} rounded-lg shadow-md cursor-move hover:shadow-lg`}
            style={{
              left: x,
              top: y,
              width,
              height,
              backgroundColor: color || '#fef08a'
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <textarea
                className="w-full h-full p-3 outline-none resize-none bg-transparent text-slate-900 text-sm"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                placeholder="Type your note..."
                autoFocus
              />
            ) : (
              <div 
                className="w-full h-full p-3 text-slate-900 text-sm whitespace-pre-wrap overflow-hidden"
                onClick={() => setIsEditing(true)}
              >
                {content || 'Double-click to edit'}
              </div>
            )}
            {isSelected && (
              <>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
              </>
            )}
          </div>
        );

      case 'line':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} cursor-move`}
            style={{ left: x, top: y }}
            onMouseDown={handleMouseDown}
          >
            <svg width={width} height="4">
              <line
                x1="0"
                y1="2"
                x2={width}
                y2="2"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            </svg>
          </div>
        );

      case 'arrow':
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} cursor-move`}
            style={{ left: x, top: y }}
            onMouseDown={handleMouseDown}
          >
            <svg width={width} height="20">
              <defs>
                <marker
                  id={`arrowhead-${id}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={color}
                  />
                </marker>
              </defs>
              <line
                x1="0"
                y1="10"
                x2={width - 10}
                y2="10"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                markerEnd={`url(#arrowhead-${id})`}
              />
            </svg>
          </div>
        );

      case 'pen':
        if (points.length < 2) return null;
        
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxX = Math.max(...points.map(p => p.x));
        const maxY = Math.max(...points.map(p => p.y));
        
        return (
          <div
            ref={elementRef}
            className={`${baseClasses} cursor-move`}
            style={{
              left: minX,
              top: minY,
              width: maxX - minX,
              height: maxY - minY
            }}
            onMouseDown={handleMouseDown}
          >
            <svg width={maxX - minX} height={maxY - minY}>
              <path
                d={`M ${points.map(p => `${p.x - minX},${p.y - minY}`).join(' L ')}`}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {renderElement()}
    </motion.div>
  );
}