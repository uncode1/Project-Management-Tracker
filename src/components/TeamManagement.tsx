import React, { useMemo, useState } from 'react';
import { Team, User } from '../types';

interface TeamManagementProps {
  teams: Team[];
  users: User[];
  onCreateTeam: (name: string, description?: string) => Promise<void>;
  onCreateUser: (name: string, email: string, teamId?: number | null) => Promise<void>;
  onAssignUserTeam: (userId: number, teamId?: number | null) => Promise<void>;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  teams,
  users,
  onCreateTeam,
  onCreateUser,
  onAssignUserTeam,
}) => {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTeamId, setUserTeamId] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const teamMembers = useMemo(() => {
    return teams.map(team => ({
      ...team,
      members: users.filter(user => user.teamId === team.id),
    }));
  }, [teams, users]);

  const handleTeamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamName.trim()) return;
    setIsSubmittingTeam(true);
    try {
      await onCreateTeam(teamName, teamDescription);
      setTeamName('');
      setTeamDescription('');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setIsSubmittingUser(true);
    try {
      await onCreateUser(userName, userEmail, userTeamId ? Number(userTeamId) : null);
      setUserName('');
      setUserEmail('');
      setUserTeamId('');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  return (
    <section className="teams-page">
      <div className="board-hero">
        <div>
          <p className="eyebrow">Team Operations</p>
          <h2>People & Access</h2>
          <p className="subtitle">
            Register teammates, group them into delivery pods, and keep accountability clear when assigning tasks.
          </p>
        </div>
      </div>

      <div className="teams-grid">
        <form className="panel" onSubmit={handleTeamSubmit}>
          <p className="eyebrow">Create Team</p>
          <h3>Name your squad</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="team-name">Team Name</label>
            <input
              id="team-name"
              className="form-input"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Product Platform"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="team-description">Description</label>
            <textarea
              id="team-description"
              className="form-textarea"
              value={teamDescription}
              onChange={(event) => setTeamDescription(event.target.value)}
              placeholder="Responsible for shared infrastructure, authentication, and billing."
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmittingTeam}>
            {isSubmittingTeam ? 'Adding…' : 'Add Team'}
          </button>
        </form>

        <form className="panel" onSubmit={handleUserSubmit}>
          <p className="eyebrow">Invite Teammate</p>
          <h3>Register a collaborator</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="user-name">Full Name</label>
            <input
              id="user-name"
              className="form-input"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Jordan Lee"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="user-email">Email</label>
            <input
              id="user-email"
              className="form-input"
              type="email"
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="jordan@workspace.dev"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="user-team">Team</label>
            <select
              id="user-team"
              className="form-input"
              value={userTeamId}
              onChange={(event) => setUserTeamId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmittingUser}>
            {isSubmittingUser ? 'Adding…' : 'Add Member'}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="team-table-header">
          <div>
            <p className="eyebrow">Roster</p>
            <h3>Teams & Members</h3>
          </div>
          <p className="subtitle">Reassign teammates between pods without leaving the workspace.</p>
        </div>
        <div className="team-list">
          {teamMembers.map(team => (
            <div key={team.id} className="team-row">
              <div>
                <p className="team-name">{team.name}</p>
                {team.description && <p className="team-description">{team.description}</p>}
                <p className="team-count">{team.members.length} members</p>
              </div>
              <div className="member-chips">
                {team.members.length ? (
                  team.members.map(member => (
                    <span key={member.id} className="member-chip">
                      {member.name}
                    </span>
                  ))
                ) : (
                  <span className="empty-state">No members yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Directory</p>
        <h3>Manage Assignments</h3>
        <div className="table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-input"
                      value={user.teamId ?? ''}
                      aria-label={`Select team for ${user.name}`}
                      onChange={(event) => onAssignUserTeam(user.id, event.target.value ? Number(event.target.value) : null)}
                    >
                      <option value="">Unassigned</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default TeamManagement;
