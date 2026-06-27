import { useOutletContext } from 'react-router-dom';
import type { WorkspaceController } from './useWorkspace';

export const useWorkspaceContext = (): WorkspaceController => {
  const ctx = useOutletContext<WorkspaceController>();
  if (!ctx) {
    throw new Error('Workspace context is unavailable outside WorkspaceLayout');
  }
  return ctx;
};
