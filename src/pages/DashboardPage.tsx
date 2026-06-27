import React from 'react';
import Dashboard from '../components/Dashboard';
import AIAssistant from '../components/AIAssistant';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

const DashboardPage: React.FC = () => {
  const workspace = useWorkspaceContext();
  const { board } = workspace;

  if (!board) {
    return (
      <section>
        <div className="board-hero">
          <div>
            <p className="eyebrow">Insights</p>
            <h2>Project Dashboard</h2>
            <p className="subtitle">Create a board first to see analytics and AI summaries.</p>
          </div>
        </div>
      </section>
    );
  }

  const defaultListId = board.lists[0]?.id;

  return (
    <section className="dashboard-page">
      <Dashboard board={board} />
      <AIAssistant
        boardId={board.id}
        lists={board.lists}
        defaultListId={defaultListId}
        onCreateCard={(listId, title, description) => workspace.createCard(listId, title, description)}
        onCreateWorkflow={(options) => workspace.createWorkflowFromIdeas(options)}
      />
    </section>
  );
};

export default DashboardPage;
