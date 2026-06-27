import { NavLink, Outlet } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import { useAuth } from '../context/useAuth';

const WorkspaceLayout: React.FC = () => {
  const workspace = useWorkspace();
  const { user, logout } = useAuth();

  if (workspace.isLoading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <p>Loading your workspace…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>Project Management Tracker</h1>
          </div>
        </div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Board</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Teams
          </NavLink>
        </div>
        <div className="nav-user">
          <div>
            <p className="nav-user-name">{user?.fullName}</p>
            <p className="nav-user-role">{user?.role}</p>
          </div>
          <button className="ghost-button" type="button" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="page-content">
        {workspace.error && (
          <div className="alert" role="status">
            {workspace.error}
          </div>
        )}
        {workspace.isBusy && <div className="inline-loader">Syncing latest changes…</div>}
        <Outlet context={workspace} />
      </main>
    </div>
  );
};

export default WorkspaceLayout;


