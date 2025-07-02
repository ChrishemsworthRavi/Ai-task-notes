export interface Board {
  id: string;
  name: string;
  type: BoardType;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  ownerId: string;
  onlineUsers: number;
  starred: boolean;
  thumbnail?: string;
}

export type BoardType = 'blank' | 'flowchart' | 'mindmap' | 'kanban' | 'retrospective' | 'brainwriting';

export interface BoardTemplate {
  id: string;
  name: string;
  type: BoardType;
  description: string;
  icon: string;
  thumbnail: string;
}

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank board',
    type: 'blank',
    description: 'Start with a clean canvas',
    icon: '➕',
    thumbnail: '/templates/blank.svg'
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    type: 'flowchart',
    description: 'Visualize processes and workflows',
    icon: '📊',
    thumbnail: '/templates/flowchart.svg'
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    type: 'mindmap',
    description: 'Organize ideas and concepts',
    icon: '🧠',
    thumbnail: '/templates/mindmap.svg'
  },
  {
    id: 'kanban',
    name: 'Kanban Framework',
    type: 'kanban',
    description: 'Manage work with Kanban boards',
    icon: '📋',
    thumbnail: '/templates/kanban.svg'
  },
  {
    id: 'retrospective',
    name: 'Quick Retrospective',
    type: 'retrospective',
    description: 'Reflect on team performance',
    icon: '🔄',
    thumbnail: '/templates/retrospective.svg'
  },
  {
    id: 'brainwriting',
    name: 'Brainwriting',
    type: 'brainwriting',
    description: 'Generate ideas collaboratively',
    icon: '💡',
    thumbnail: '/templates/brainwriting.svg'
  }
];

const BOARDS_STORAGE_KEY = 'miro_boards';

export const boardStorage = {
  getBoards: (): Board[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(BOARDS_STORAGE_KEY);
      if (stored) {
        const boards = JSON.parse(stored);
        return boards.map((board: any) => ({
          ...board,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Error reading boards from localStorage:', error);
    }
    
    return [];
  },

  saveBoards: (boards: Board[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards));
    } catch (error) {
      console.error('Error saving boards to localStorage:', error);
    }
  },

  createBoard: (name: string, type: BoardType, owner: string, ownerId: string): Board => {
    const boards = boardStorage.getBoards();
    const newBoard: Board = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner,
      ownerId,
      onlineUsers: Math.floor(Math.random() * 5) + 1,
      starred: false
    };
    
    boards.unshift(newBoard);
    boardStorage.saveBoards(boards);
    return newBoard;
  },

  updateBoard: (boardId: string, updates: Partial<Board>): Board | null => {
    const boards = boardStorage.getBoards();
    const boardIndex = boards.findIndex(board => board.id === boardId);
    
    if (boardIndex === -1) return null;
    
    boards[boardIndex] = {
      ...boards[boardIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    boardStorage.saveBoards(boards);
    return boards[boardIndex];
  },

  deleteBoard: (boardId: string): boolean => {
    const boards = boardStorage.getBoards();
    const filteredBoards = boards.filter(board => board.id !== boardId);
    
    if (filteredBoards.length === boards.length) return false;
    
    boardStorage.saveBoards(filteredBoards);
    return true;
  },

  toggleStar: (boardId: string): boolean => {
    const boards = boardStorage.getBoards();
    const board = boards.find(board => board.id === boardId);
    
    if (!board) return false;
    
    board.starred = !board.starred;
    board.updatedAt = new Date();
    
    boardStorage.saveBoards(boards);
    return board.starred;
  }
};

// Initialize with sample data if no boards exist
export const initializeSampleBoards = (userId: string, userName: string): void => {
  const existingBoards = boardStorage.getBoards();
  
  if (existingBoards.length === 0) {
    const sampleBoards: Board[] = [
      {
        id: 'sample-1',
        name: 'Untitled',
        type: 'blank',
        createdAt: new Date(Date.now() - 86400000), // Yesterday
        updatedAt: new Date(Date.now() - 86400000),
        owner: userName,
        ownerId: userId,
        onlineUsers: 1,
        starred: false
      },
      {
        id: 'sample-2',
        name: 'Kanban Framework',
        type: 'kanban',
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        owner: 'madhu',
        ownerId: 'madhu-id',
        onlineUsers: 2,
        starred: false
      },
      {
        id: 'sample-3',
        name: 'Customer Journey Map',
        type: 'mindmap',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000),
        owner: 'madhu',
        ownerId: 'madhu-id',
        onlineUsers: 0,
        starred: true
      }
    ];
    
    boardStorage.saveBoards(sampleBoards);
  }
};