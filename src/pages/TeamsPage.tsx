import React from 'react';
import TeamManagement from '../components/TeamManagement';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';

const TeamsPage: React.FC = () => {
  const workspace = useWorkspaceContext();

  return (
    <TeamManagement
      teams={workspace.teams}
      users={workspace.users}
      onCreateTeam={(name, description) => workspace.createTeam({ name, description })}
      onCreateUser={(name, email, teamId) => workspace.createUser({ name, email, teamId })}
      onAssignUserTeam={(userId, teamId) => workspace.assignUserTeam(userId, teamId)}
    />
  );
};

export default TeamsPage;
