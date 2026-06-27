import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient, ApiError } from '../api/client';
import type {
  ApiBoard,
  ApiCard,
  ApiList,
  ApiTeam,
  ApiUserDirectory,
} from '../api/types';
import type { Board, Card, List, Team, User } from '../types';

export interface WorkspaceController {
  board: Board | null;
  boardId: number | null;
  teams: Team[];
  users: User[];
  isLoading: boolean;
  isBusy: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  refreshBoard: () => Promise<void>;
  createList: (title: string) => Promise<void>;
  updateList: (listId: number, payload: Partial<Pick<List, 'title' | 'position'>>) => Promise<void>;
  deleteList: (listId: number) => Promise<void>;
  reorderLists: (order: Array<{ id: number; position: number }>) => Promise<void>;
  createCard: (listId: number, title: string, description?: string) => Promise<void>;
  createWorkflowFromIdeas: (options: { listId?: number; listName?: string; ideas: Array<{ title: string; description?: string }> }) => Promise<void>;
  updateCard: (cardId: number, payload: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: number) => Promise<void>;
  moveCard: (cardId: number, listId: number) => Promise<void>;
  createTeam: (payload: { name: string; description?: string }) => Promise<void>;
  createUser: (payload: { name: string; email: string; teamId?: number | null }) => Promise<void>;
  assignUserTeam: (userId: number, teamId?: number | null) => Promise<void>;
}

const defaultBoardPayload = {
  name: 'Delivery Roadmap',
  description: 'Project-wide Kanban board.',
  visibility: 'private',
};

const toCard = (card: ApiCard): Card => ({
  id: card.id,
  title: card.title,
  description: card.description ?? undefined,
  dueDate: card.due_date ?? undefined,
  priority: card.priority ?? undefined,
  status: card.status,
  assigneeId: card.assignee_id ?? null,
  reporterId: card.reporter_id ?? null,
  labels: card.labels ?? [],
});

const toList = (list: ApiList): List => ({
  id: list.id,
  title: list.title,
  position: list.position,
  cards: list.cards.map(toCard),
});

const toBoard = (board: ApiBoard): Board => ({
  id: board.id,
  name: board.name,
  description: board.description ?? null,
  lists: board.lists.map(toList),
});

const toTeam = (team: ApiTeam): Team => ({
  id: team.id,
  name: team.name,
  description: team.description ?? null,
  leadUserId: team.lead_user_id ?? null,
  memberCount: team.member_count,
});

const toUser = (user: ApiUserDirectory): User => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  teamId: user.team_id ?? null,
  role: user.role,
});

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    const message =
      (typeof error.data === 'object' && error.data && 'message' in error.data
        ? String((error.data as Record<string, unknown>).message)
        : null) || error.message;
    return message || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
};

export const useWorkspace = (): WorkspaceController => {
  const [board, setBoard] = useState<Board | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async (targetBoardId: number) => {
    const data = await apiClient.getBoard(targetBoardId);
    setBoard(toBoard(data));
  }, []);

  const loadTeams = useCallback(async () => {
    const data = await apiClient.getTeams();
    setTeams(data.map(toTeam));
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await apiClient.getUsers();
    setUsers(data.map(toUser));
  }, []);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const boards = await apiClient.getBoards();
      const firstBoard = boards.length ? boards[0] : null;
      let activeBoardId = firstBoard?.id ?? null;
      if (!activeBoardId) {
        const created = await apiClient.createBoard(defaultBoardPayload);
        activeBoardId = created.id;
      }
      setBoardId(activeBoardId);
      await Promise.all([
        loadBoard(activeBoardId),
        loadTeams(),
        loadUsers(),
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [loadBoard, loadTeams, loadUsers]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const runAction = useCallback(async (fn: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!boardId) return;
    await runAction(async () => {
      await Promise.all([
        loadBoard(boardId),
        loadTeams(),
        loadUsers(),
      ]);
    });
  }, [boardId, loadBoard, loadTeams, loadUsers, runAction]);

  const refreshBoard = useCallback(async () => {
    if (!boardId) return;
    await runAction(async () => loadBoard(boardId));
  }, [boardId, loadBoard, runAction]);

  const createList = useCallback(async (title: string) => {
    if (!boardId) return;
    await runAction(async () => {
      await apiClient.createList(boardId, {
        title,
        position: board?.lists.length ?? 0,
      });
      await loadBoard(boardId);
    });
  }, [board?.lists.length, boardId, loadBoard, runAction]);

  const updateList = useCallback(async (listId: number, payload: Partial<Pick<List, 'title' | 'position'>>) => {
    await runAction(async () => {
      await apiClient.updateList(listId, payload);
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const deleteList = useCallback(async (listId: number) => {
    await runAction(async () => {
      await apiClient.deleteList(listId);
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const createCard = useCallback(async (listId: number, title: string, description?: string) => {
    await runAction(async () => {
      await apiClient.createCard(listId, {
        title,
        description: description || undefined,
        status: 'todo',
      });
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const createWorkflowFromIdeas = useCallback(async ({ listId, listName, ideas }: { listId?: number; listName?: string; ideas: Array<{ title: string; description?: string }> }) => {
    if (!boardId || !ideas.length) return;
    await runAction(async () => {
      let targetListId = listId;
      if (!targetListId) {
        const name = (listName && listName.trim()) || `AI Workflow (${new Date().toLocaleDateString()})`;
        const createdList = await apiClient.createList(boardId, {
          title: name,
          position: board?.lists.length ?? 0,
        });
        targetListId = createdList.id;
      }

      for (const idea of ideas) {
        await apiClient.createCard(targetListId, {
          title: idea.title,
          description: idea.description,
          status: 'todo',
        });
      }

      await loadBoard(boardId);
    });
  }, [board?.lists.length, boardId, loadBoard, runAction]);

  const updateCard = useCallback(async (cardId: number, payload: Partial<Card>) => {
    await runAction(async () => {
      await apiClient.updateCard(cardId, {
        title: payload.title,
        description: payload.description,
        due_date: payload.dueDate,
        priority: payload.priority,
        status: payload.status,
        assignee_id: payload.assigneeId,
        labels: payload.labels,
      });
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const deleteCard = useCallback(async (cardId: number) => {
    await runAction(async () => {
      await apiClient.deleteCard(cardId);
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const moveCard = useCallback(async (cardId: number, listId: number) => {
    await runAction(async () => {
      await apiClient.updateCard(cardId, { list_id: listId });
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const reorderLists = useCallback(async (order: Array<{ id: number; position: number }>) => {
    if (!order.length) return;
    await runAction(async () => {
      await Promise.all(order.map(({ id, position }) => apiClient.updateList(id, { position })));
      if (boardId) {
        await loadBoard(boardId);
      }
    });
  }, [boardId, loadBoard, runAction]);

  const createTeam = useCallback(async ({ name, description }: { name: string; description?: string }) => {
    await runAction(async () => {
      await apiClient.createTeam({ name, description });
      await loadTeams();
    });
  }, [loadTeams, runAction]);

  const createUser = useCallback(async ({ name, email, teamId }: { name: string; email: string; teamId?: number | null }) => {
    await runAction(async () => {
      await apiClient.createUser({ full_name: name, email, team_id: teamId ?? null });
      await loadUsers();
    });
  }, [loadUsers, runAction]);

  const assignUserTeam = useCallback(async (userId: number, teamId?: number | null) => {
    await runAction(async () => {
      await apiClient.updateUser(userId, { team_id: teamId ?? null });
      await loadUsers();
    });
  }, [loadUsers, runAction]);

  return useMemo(() => ({
    board,
    boardId,
    teams,
    users,
    isLoading,
    isBusy,
    error,
    refreshAll,
    refreshBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    createWorkflowFromIdeas,
    updateCard,
    deleteCard,
    moveCard,
    reorderLists,
    createTeam,
    createUser,
    assignUserTeam,
  }), [
    board,
    boardId,
    teams,
    users,
    isLoading,
    isBusy,
    error,
    refreshAll,
    refreshBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    createWorkflowFromIdeas,
    updateCard,
    deleteCard,
    moveCard,
    reorderLists,
    createTeam,
    createUser,
    assignUserTeam,
  ]);
};

