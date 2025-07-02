"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Share2, 
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Square,
  Circle,
  Type,
  Pen,
  Minus,
  MessageSquare,
  StickyNote,
  Upload,
  Undo,
  Redo,
  Play,
  MessageCircle,
  Monitor,
  Crown,
  Hand,
  Triangle,
  ArrowRight,
  Image as ImageIcon,
  Grid3x3,
  Sparkles,
  Move3D,
  Lightbulb,
  Shapes,
  Palette,
  FileImage,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser, User } from '@/lib/auth';
import { Board, boardStorage } from '@/lib/boards';
import GridCanvas from '@/components/canvas/grid-canvas';
import CanvasElement from '@/components/canvas/canvas-element';

interface CanvasElementData {
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
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState('select');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [elements, setElements] = useState<CanvasElementData[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

useEffect(() => {
  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const boards = boardStorage.getBoards();
    const foundBoard = boards.find(b => b.id === boardId);

    if (!foundBoard) {
      router.push('/dashboard');
      return;
    }

    setBoard(foundBoard);
    setLoading(false);
  };

  loadUser();
}, [router, boardId]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'select' || selectedTool === 'hand') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const elementDefaults = {
      rectangle: { width: 120, height: 80, color: '#3b82f6' },
      circle: { width: 100, height: 100, color: '#10b981' },
      frame: { width: 200, height: 150, color: '#6366f1' },
      text: { width: undefined, height: undefined, content: 'Type here...' },
      sticky: { width: 120, height: 120, color: '#fef08a', content: '' },
      line: { width: 100, height: 2, color: '#374151' },
      arrow: { width: 100, height: 2, color: '#374151' }
    };

    const defaults = elementDefaults[selectedTool as keyof typeof elementDefaults] || {};

    const newElement: CanvasElementData = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedTool as any,
      x: x - (defaults.width || 50) / 2,
      y: y - (defaults.height || 50) / 2,
      ...defaults
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool('select');
  }, [selectedTool]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setCurrentPath([point]);
    }
  }, [selectedTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing && selectedTool === 'pen') {
      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setCurrentPath(prev => [...prev, point]);
    }
  }, [isDrawing, selectedTool]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length > 1) {
      const newElement: CanvasElementData = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'pen',
        x: Math.min(...currentPath.map(p => p.x)),
        y: Math.min(...currentPath.map(p => p.y)),
        points: currentPath,
        color: '#374151',
        strokeWidth: 2
      };
      setElements(prev => [...prev, newElement]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElementData>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleElementSelect = useCallback((id: string) => {
    setSelectedElement(id);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
    if (e.key === 'Escape') {
      setSelectedElement(null);
      setSelectedTool('select');
    }
  }, [selectedElement]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading || !user || !board) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Custom icon components to match Miro exactly
  const CustomIcons = {
    Select: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2L14 8L8 9L6 14L2 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Hand: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2C8.5 2 9 2.5 9 3V7H10C10.5 7 11 7.5 11 8V9H12C12.5 9 13 9.5 13 10V11C13 12.5 11.5 14 10 14H6C4.5 14 3 12.5 3 11V8C3 7.5 3.5 7 4 7V5C4 4.5 4.5 4 5 4V3C5 2.5 5.5 2 6 2H8Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Frame: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2,2"/>
      </svg>
    ),
    Rectangle: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="3" y="4" width="10" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Circle: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Text: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3H12M8 3V13M6 13H10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Pen: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M12 2L14 4L9 9L7 7L12 2ZM7 7L2 12V14H4L9 9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Line: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    Arrow: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 8H13M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Sticky: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 3H13V11L11 13H3V3Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M11 11V13L13 11H11Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Comment: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 4C3 3.5 3.5 3 4 3H12C12.5 3 13 3.5 13 4V9C13 9.5 12.5 10 12 10H6L3 13V4Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Upload: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2V10M5 5L8 2L11 5M3 12H13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    Apps: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="6.5" y="2" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="11" y="2" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="2" y="6.5" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="6.5" y="6.5" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="11" y="6.5" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="2" y="11" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="6.5" y="11" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="11" y="11" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  };

  const toolbarItems = [
    { id: 'select', icon: CustomIcons.Select, label: 'Select', color: 'text-purple-600' },
    { id: 'hand', icon: CustomIcons.Hand, label: 'Hand', color: 'text-blue-600' },
    { id: 'frame', icon: CustomIcons.Frame, label: 'Frame', color: 'text-slate-600' },
    { id: 'rectangle', icon: CustomIcons.Rectangle, label: 'Rectangle', color: 'text-slate-600' },
    { id: 'circle', icon: CustomIcons.Circle, label: 'Circle', color: 'text-slate-600' },
    { id: 'text', icon: CustomIcons.Text, label: 'Text', color: 'text-slate-600' },
    { id: 'pen', icon: CustomIcons.Pen, label: 'Pen', color: 'text-slate-600' },
    { id: 'line', icon: CustomIcons.Line, label: 'Line', color: 'text-slate-600' },
    { id: 'arrow', icon: CustomIcons.Arrow, label: 'Arrow', color: 'text-slate-600' },
    { id: 'sticky', icon: CustomIcons.Sticky, label: 'Sticky Note', color: 'text-slate-600' },
    { id: 'comment', icon: CustomIcons.Comment, label: 'Comment', color: 'text-slate-600' },
    { id: 'upload', icon: CustomIcons.Upload, label: 'Upload', color: 'text-slate-600' },
    { id: 'apps', icon: CustomIcons.Apps, label: 'Apps', color: 'text-slate-600' },
  ];

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-bold text-lg text-slate-900">miro</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-blue-500">🚀</div>
            <span className="font-medium text-slate-900">{board.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-slate-600">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" className="text-slate-700">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              {['A', 'B', 'C'].map((letter, i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className={`text-white text-xs ${
                    i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-green-500' : 'bg-purple-500'
                  }`}>
                    {letter}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-slate-600">
              <Users className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="text-slate-600">
            <MessageCircle className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="text-slate-600">
            <Monitor className="h-4 w-4" />
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="h-4 w-4 mr-2" />
            Present
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Toolbar */}
        <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-1">
          {toolbarItems.map((tool, index) => {
            const Icon = tool.icon;
            const isSelected = selectedTool === tool.id;
            
            return (
              <motion.button
                key={tool.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-100 text-blue-600 shadow-sm'
                    : `${tool.color} hover:bg-slate-100`
                }`}
                title={tool.label}
              >
                <Icon />
              </motion.button>
            );
          })}
          
          <Separator className="w-6 my-2" />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-slate-600 hover:bg-slate-100"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-slate-600 hover:bg-slate-100"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <GridCanvas 
            zoom={zoomLevel} 
            onZoomChange={setZoomLevel}
            isPanMode={selectedTool === 'hand'}
          >
            <div 
              className="w-full h-full relative"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: selectedTool === 'pen' ? 'crosshair' : 'default' }}
            >
              {elements.map(element => (
                <CanvasElement
                  key={element.id}
                  {...element}
                  onUpdate={handleElementUpdate}
                  onSelect={handleElementSelect}
                  isSelected={selectedElement === element.id}
                  zoom={zoomLevel}
                />
              ))}
              
              {/* Current drawing path */}
              {isDrawing && currentPath.length > 1 && (
                <svg className="absolute inset-0 pointer-events-none">
                  <path
                    d={`M ${currentPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    stroke="#374151"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </GridCanvas>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex items-center space-x-2 bg-white rounded-lg border border-slate-200 shadow-sm px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-sm text-slate-600 min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6"
              onClick={() => setZoomLevel(Math.min(500, zoomLevel + 10))}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Help Button */}
          <div className="absolute bottom-6 left-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 bg-white border border-slate-200 shadow-sm rounded-full text-slate-600 hover:bg-slate-50"
            >
              ?
            </Button>
          </div>

          {/* Magic Sparkle Button (top right) */}
          <div className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 bg-yellow-100 border border-yellow-200 shadow-sm rounded-full text-yellow-600 hover:bg-yellow-200"
              title="AI Magic"
            >
              <Sparkles className="h-5 w-5" />
            </Button>
          </div>

          {/* Tool Info */}
          {selectedTool !== 'select' && (
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-slate-600 border border-slate-200">
              {selectedTool === 'pen' ? 'Click and drag to draw' : 
               selectedTool === 'hand' ? 'Drag to pan the canvas' :
               `Click to add ${selectedTool}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
