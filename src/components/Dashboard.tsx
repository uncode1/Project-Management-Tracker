import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Board } from '../types';

interface DashboardProps {
  board: Board;
}

const Dashboard: React.FC<DashboardProps> = ({ board }) => {
  const allCards = board.lists.flatMap(list => list.cards);
  const totalTasks = allCards.length;
  const completedTasks = allCards.filter(card => card.status?.toLowerCase() === 'done').length;
  const inProgressTasks = allCards.filter(card => card.status?.toLowerCase() === 'in progress').length;
  const todoTasks = totalTasks - completedTasks - inProgressTasks;

  const today = new Date();
  const overdueTasks = allCards.filter(card => card.dueDate && new Date(card.dueDate) < today).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const listData = board.lists.map(list => ({
    name: list.title,
    tasks: list.cards.length,
  }));

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    allCards.forEach(card => {
      const key = (card.priority || 'unspecified').toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [allCards]);

  const metrics = [
    { label: 'Total Tasks', value: totalTasks },
    { label: 'Completed', value: completedTasks },
    { label: 'In Progress', value: inProgressTasks },
    { label: 'To Do', value: todoTasks },
    { label: 'Overdue', value: overdueTasks },
    { label: 'Completion Rate', value: `${completionRate}%` },
  ];

  const COLORS = ['#6366f1', '#06b6d4', '#f97316', '#f43f5e', '#14b8a6', '#84cc16'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h2>Project Dashboard</h2>
          <p className="subtitle">Track throughput, mitigate risk, and keep stakeholders aligned with live delivery metrics.</p>
        </div>
        <div className="progress-card">
          <p className="eyebrow">Completion Rate</p>
          <h3>{completionRate}%</h3>
          <progress className="progress-meter" value={completionRate} max={100} />
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map(metric => (
          <div key={metric.label} className="metric-card">
            <p>{metric.label}</p>
            <h3>{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">Workload</p>
              <h3>Tasks by List</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={listData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="tasks" radius={[8, 8, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">Focus</p>
              <h3>Tasks by Priority</h3>
            </div>
          </div>
          {priorityData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={priorityData}
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Set task priorities to visualize focus areas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;