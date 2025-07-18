
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, Share2, MoreHorizontal, ZoomIn, ZoomOut, MousePointer,
  Square, Circle, Type, Pen, Minus, MessageSquare, StickyNote, Upload, 
  Undo, Redo, Play, MessageCircle, Monitor, Crown, Hand, Triangle, ArrowRight, 
  Image as ImageIcon, Grid3x3, Sparkles, Move3D, Lightbulb, Shapes, Palette, 
  FileImage, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser, User } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import GridCanvas from '@/components/canvas/grid-canvas';
import CanvasElement from '@/components/canvas/canvas-element';
import { v4 as uuidv4 } from 'uuid';
import { addCollaborator } from '@/lib/boards';
import { useBoardPresence } from '@/lib/useBoardPresence';
import { useBoardElements } from '@/lib/useBoardElements';
import CollaboratorsPanel from '@/components/CollaboratorsPanel';
import { useCursorSharing } from '@/hooks/useCursorSharing';
import CursorLayer from '@/components/dashboard/CursorOverlay';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Collaborator } from '@/components/CollaboratorsPanel';


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

function getColorFromId(id: string) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState('select');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [elements, setElements] = useState<CanvasElementData[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({});
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const userId = 'user-' + Math.floor(Math.random() * 1000);
  const userColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
  const presenceRef = useRef({ id: uuidv4(), x: 0, y: 0 });
  const { presenceUsers, updateCursor } = useBoardPresence(boardId, userId);
  const { sendCursor } = useCursorSharing(
    boardId,
    user?.id ?? '',
    user?.email ?? '',
    userColor,
    (otherUserId, x, y, name, color) => {
      setCursors(prev => ({
        ...prev,
        [otherUserId]: { x, y, name, color }
      }));
    }
  );

  const loadElements = useCallback(async () => {
    const { data, error } = await supabase
      .from('board_elements')
      .select('*')
      .eq('board_id', boardId);

    if (error) {
      console.error('Error loading elements:', error);
      return;
    }

    const loadedElements = (data || []).map(el => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width ?? 100,
      height: el.height ?? 100,
      content: el.content ?? '',
      color: el.color ?? '#000000',
      strokeWidth: el.stroke_width ?? 1,
      points: el.points ? JSON.parse(el.points) : undefined,
    }));

    setElements(loadedElements);
  }, [boardId]);

  const updateElement = useCallback(async (element: CanvasElementData) => {
    const { error } = await supabase
      .from('board_elements')
      .update({
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        color: element.color,
        stroke_width: element.strokeWidth,
        content: element.content,
        points: element.points ? JSON.stringify(element.points) : null
      })
      .eq('id', element.id);

    if (error) {
      console.error(`Error updating element ${element.id}:`, error);
    }
  }, []);

  useEffect(() => {
    const loadBoard = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: collabs, error: collabError } = await supabase
        .from('board_collaborators')
        .select('board_id')
        .eq('user_id', currentUser.id);

      if (collabError) {
        console.error('Error checking collaborators:', collabError);
        router.push('/dashboard');
        return;
      }

      const collabBoardIds = collabs?.map(c => c.board_id) || [];

      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .maybeSingle();

      if (
        boardError ||
        !boardData ||
        (boardData.owner_id !== currentUser.id && !collabBoardIds.includes(boardId))
      ) {
        console.error('Error loading board or no access:', boardError);
        router.push('/dashboard');
        return;
      }

      setBoard(boardData);
      await loadElements();
      setLoading(false);
    };

    loadBoard();
  }, [router, boardId, loadElements]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:board_elements:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_elements',
          filter: `board_id=eq.${boardId}`,
        },
        payload => {
          const { eventType, new: newEl, old: oldEl } = payload;

setElements(prev => {
  switch (eventType) {
    case 'INSERT':
      if (prev.some(el => el.id === newEl.id)) return prev;
      return [
        ...prev,
        {
          id: newEl.id,
          type: newEl.type,
          x: newEl.x,
          y: newEl.y,
          width: newEl.width ?? 100,
          height: newEl.height ?? 100,
          content: newEl.content ?? '',
          color: newEl.color ?? '#000000',
          strokeWidth: newEl.stroke_width ?? 1,
          points: newEl.points ? JSON.parse(newEl.points) : undefined,
        },
      ] as CanvasElementData[];
              case 'UPDATE':
                return prev.map(el =>
                  el.id === newEl.id ? {
                    ...el,
                    ...newEl,
                    strokeWidth: newEl.stroke_width,
                    points: newEl.points ? JSON.parse(newEl.points) : undefined
                  } : el
                );
              case 'DELETE':
                return prev.filter(el => el.id !== oldEl.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    const fetchCollaborators = async () => {
      const { data, error } = await supabase
        .from('board_collaborators')
        .select('user_id, user:users(name)')
        .eq('board_id', boardId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCollaborators(
          (data as any[]).map(c => ({
            id: c.user_id,
            name: Array.isArray(c.user) ? (c.user[0]?.name || 'Unknown') : (c.user?.name || 'Unknown'),
            color: getColorFromId(c.user_id),
          }))
        );
      }
    };
    fetchCollaborators();
  }, [boardId]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    sendCursor(x, y);
  }, [sendCursor]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElementData>) => {
    setElements(prev => {
      const updated = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      );
      const target = updated.find(el => el.id === id);
      if (target) updateElement(target);
      return updated;
    });
  }, [updateElement]);

  const saveElement = useCallback(async (element: CanvasElementData) => {
    const { error } = await supabase.from('board_elements').insert([{
      board_id: boardId,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      color: element.color,
      stroke_width: element.strokeWidth,
      content: element.content,
      points: element.points ? JSON.stringify(element.points) : null
    }]);

    if (error) {
      toast.error('Error saving element');
      console.error('Save failed:', error);
    }
  }, [boardId]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length > 1) {
      const newElement: CanvasElementData = {
        id: Math.random().toString(36).substring(2, 11),
        type: 'pen',
        x: Math.min(...currentPath.map(p => p.x)),
        y: Math.min(...currentPath.map(p => p.y)),
        points: currentPath,
        color: '#374151',
        strokeWidth: 2
      };
      setElements(prev => [...prev, newElement]);
      saveElement(newElement);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, saveElement]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setCurrentPath([point]);
    }
  }, [selectedTool]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'select' || selectedTool === 'hand') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const elementDefaults: Record<string, Partial<CanvasElementData>> = {
      rectangle: { width: 100, height: 60, color: '#f87171' },
      circle: { width: 80, height: 80, color: '#60a5fa' },
      text: { content: 'New text', width: 100, height: 30, color: '#000000' },
      sticky: { content: 'Sticky note', width: 120, height: 120, color: '#facc15' },
      frame: { width: 200, height: 150, color: '#9ca3af' },
      line: { strokeWidth: 2, color: '#374151' },
      arrow: { strokeWidth: 2, color: '#374151' },
      pen: { strokeWidth: 2, color: '#374151' }
    };

    const defaults = elementDefaults[selectedTool as keyof typeof elementDefaults] || {};

    const newElement: CanvasElementData = {
      id: uuidv4(),
      type: selectedTool as any,
      x: x - (defaults.width || 50) / 2,
      y: y - (defaults.height || 50) / 2,
      ...defaults
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setSelectedTool('select');
    saveElement(newElement);
  }, [selectedTool, saveElement]);

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

  const handleAddCollaborator = async () => {
    if (!email) {
      toast.error('Please enter an email address.');
      return;
    }

    // Lookup user by email
    const res = await fetch('/api/find-user-by-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const userData = await res.json();

    if (!res.ok) {
      toast.error(userData.error || 'User not found.');
      return;
    }

    // Check if already a collaborator
    const { data: existing, error: existingError } = await supabase
      .from('board_collaborators')
      .select('id')
      .eq('board_id', boardId)
      .eq('user_id', userData.id)
      .maybeSingle();

    if (existingError) {
      toast.error('Error checking existing collaborators.');
      return;
    }

    if (existing) {
      toast.error('This user is already a collaborator.');
      return;
    }

    // Try to add collaborator
    const { error: addError } = await supabase
      .from('board_collaborators')
      .insert([
        {
          board_id: boardId,
          user_id: userData.id,
          role: 'editor',
        },
      ]);

    if (addError) {
      // Only show this if it's NOT a duplicate error
      if (addError.code === '23505') {
        toast.error('This user is already a collaborator.');
      } else {
        toast.error('Failed to add collaborator.');
      }
      return;
    }

    toast.success('Collaborator added successfully!');
    setOpen(false);
    setEmail('');
  };

  // Only one loading/guard return, after all hooks
  if (!boardId || loading || !user || !board) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
<header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
  <div className="flex items-center space-x-4">
    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
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



    <div className="flex items-center space-x-2">
      <CollaboratorsPanel 
        collaborators={collaborators} 
        owner={board ? { id: board.owner_id, name: board.owner } : undefined} 
      />
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

 <Button
  size="sm"
  className="bg-green-600 hover:bg-green-700 text-white"
  onClick={() => setOpen(true)}
>
  + Collaborator
</Button>
  </div>
</header>

{/* Move the Add Collaborator Dialog here, outside the header for a clean modal overlay */}
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="custom-modal-center">
    <DialogHeader>
      <DialogTitle>Add Collaborator</DialogTitle>
      <DialogDescription>
        Enter the Gmail address of the collaborator you want to add.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <Input
        placeholder="Enter Gmail address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={false}
      />
    </div>
    <DialogFooter>
      <Button onClick={handleAddCollaborator} disabled={!email.trim()}>
        Add
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


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
        <div className="flex-1 relative" onMouseMove={handleMouseMove}>
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

    {/* Presence cursors */}
{presenceUsers.map(user => (
  <div
    key={user.id}
    className="absolute pointer-events-none"
    style={{
      left: user.x,
      top: user.y,
      transform: 'translate(-50%, -50%)'
    }}
  >
    <div
      className="w-3 h-3 rounded-full border border-white"
      style={{ backgroundColor: user.color }}
    ></div>
    <div className="text-xs text-slate-600">{user.name}</div>
  </div>
))}
  </div>
  <CursorLayer boardId={boardId} userId={userId} />
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

