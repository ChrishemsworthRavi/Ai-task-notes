'use client';

import { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text } from 'react-konva';

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

interface BoardCanvasProps {
  selectedTool: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function BoardCanvas({ selectedTool, zoom }: BoardCanvasProps) {
  const [elements, setElements] = useState<CanvasElementData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCanvasClick = useCallback((e: any) => {
    if (selectedTool === 'select' || selectedTool === 'hand') return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const elementDefaults: Record<string, Partial<CanvasElementData>> = {
      rectangle: { width: 120, height: 80, color: '#3b82f6' },
      circle: { width: 100, height: 100, color: '#10b981' },
      frame: { width: 200, height: 150, color: '#6366f1' },
      text: { content: 'Type here...' },
      sticky: { width: 120, height: 120, color: '#fef08a', content: '' },
      line: { points: [pointer, pointer], color: '#374151', strokeWidth: 2 },
      arrow: { points: [pointer, pointer], color: '#374151', strokeWidth: 2 }
    };

    const newElement: CanvasElementData = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedTool as CanvasElementData['type'],
      x: pointer.x,
      y: pointer.y,
      ...elementDefaults[selectedTool]
    };

    setElements(prev => [...prev, newElement]);
  }, [selectedTool]);

  const handleMouseDown = useCallback((e: any) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        setCurrentPath([pointer]);
      }
    }
  }, [selectedTool]);

  const handleMouseMove = useCallback((e: any) => {
    if (isDrawing && selectedTool === 'pen') {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        setCurrentPath(prev => [...prev, pointer]);
      }
    }
  }, [isDrawing, selectedTool]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length > 1) {
      const newElement: CanvasElementData = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'pen',
        x: 0,
        y: 0,
        points: currentPath,
        color: '#374151',
        strokeWidth: 2
      };
      setElements(prev => [...prev, newElement]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath]);

  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      scaleX={zoom / 100}
      scaleY={zoom / 100}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ background: '#fff' }}
    >
      <Layer>
        {elements.map(el => {
          if (el.type === 'rectangle') {
            return <Rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} fill={el.color} />;
          }
          if (el.type === 'circle') {
            return <Circle key={el.id} x={el.x} y={el.y} radius={el.width ? el.width / 2 : 50} fill={el.color} />;
          }
          if (el.type === 'pen') {
            return <Line key={el.id} points={el.points!.flatMap(p => [p.x, p.y])} stroke={el.color} strokeWidth={el.strokeWidth} lineCap="round" lineJoin="round" />;
          }
          if (el.type === 'text' || el.type === 'sticky') {
            return <Text key={el.id} text={el.content || ''} x={el.x} y={el.y} fontSize={16} fill={el.color || '#000'} />;
          }
          return null;
        })}
        {isDrawing && currentPath.length > 1 && (
          <Line points={currentPath.flatMap(p => [p.x, p.y])} stroke="#374151" strokeWidth={2} lineCap="round" lineJoin="round" />
        )}
      </Layer>
    </Stage>
  );
}
