export interface Card {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  assigneeId?: number | null;
  reporterId?: number | null;
  labels?: Array<{ color: string; name?: string }>;
}

export interface List {
  id: number;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: number;
  name: string;
  description?: string | null;
  lists: List[];
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  leadUserId?: number | null;
  memberCount: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  teamId?: number | null;
  role: string;
}

export interface WorkspaceData {
  board: Board | null;
  teams: Team[];
  users: User[];
}