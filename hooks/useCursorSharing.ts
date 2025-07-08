import { useEffect, useRef } from 'react';

export function useCursorSharing(
  boardId: string,
  userId: string,
  userName: string,
  userColor: string,
  onCursorUpdate: (
    otherUserId: string,
    x: number,
    y: number,
    name: string,
    color: string
  ) => void
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'cursor' &&
          data.boardId === boardId &&
          data.userId !== userId
        ) {
          onCursorUpdate(data.userId, data.x, data.y, data.name, data.color);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, [boardId, userId, userName, userColor, onCursorUpdate]);

  const sendCursor = (x: number, y: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'cursor',
          boardId,
          userId,
          x,
          y,
          name: userName,
          color: userColor
        })
      );
    }
  };

  return { sendCursor };
}
