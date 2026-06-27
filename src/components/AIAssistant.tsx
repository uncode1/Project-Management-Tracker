import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { AiIdea } from '../api/types';
import type { List } from '../types';

interface AIAssistantProps {
  boardId: number;
  defaultListId?: number;
  onCreateCard: (listId: number, title: string, description?: string) => Promise<void>;
  lists: List[];
  onCreateWorkflow: (options: { listId?: number; listName?: string; ideas: Array<{ title: string; description?: string }> }) => Promise<void>;
  layout?: 'panel' | 'lane';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ boardId, defaultListId, lists, onCreateCard, onCreateWorkflow, layout = 'panel' }) => {
  const [summary, setSummary] = useState<{ text: string; insights: string[]; blockers: string[]; recommendations: string[]; provider: string } | null>(null);
  const [ideas, setIdeas] = useState<AiIdea[]>([]);
  const [prompt, setPrompt] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [listMode, setListMode] = useState<'existing' | 'new'>('existing');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState('AI Workflow Plan');

  useEffect(() => {
    if (defaultListId) {
      setSelectedListId(String(defaultListId));
    } else if (lists[0]) {
      setSelectedListId(String(lists[0].id));
    }
  }, [defaultListId, lists]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAiSummary(boardId);
      setSummary({
        text: response.summary,
        insights: response.insights,
        blockers: response.blockers,
        recommendations: response.recommendations,
        provider: response.provider,
      });
    } catch (err) {
      setError('Unable to generate AI summary right now.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handlePrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setIdeaLoading(true);
    setError(null);
    try {
      const response = await apiClient.generateAiIdeas(prompt, boardId);
      setIdeas(response.ideas);
    } catch (err) {
      setError('Unable to process your prompt right now.');
    } finally {
      setIdeaLoading(false);
    }
  };

  const handleAddIdea = async (idea: AiIdea) => {
    if (!defaultListId) return;
    await onCreateCard(defaultListId, idea.title, idea.description);
  };

  const listOptions = useMemo(() => lists.map((list) => ({ id: list.id, title: list.title })), [lists]);

  const handleCreateWorkflow = async () => {
    if (!ideas.length) {
      setWorkflowStatus({ type: 'error', message: 'Generate ideas first, then create a workflow.' });
      return;
    }

    if (listMode === 'existing' && !selectedListId) {
      setWorkflowStatus({ type: 'error', message: 'Select a list to send the workflow to.' });
      return;
    }

    if (listMode === 'new' && !newListName.trim()) {
      setWorkflowStatus({ type: 'error', message: 'Provide a name for the new workflow list.' });
      return;
    }

    setWorkflowLoading(true);
    setWorkflowStatus(null);
    try {
      await onCreateWorkflow({
        ideas: ideas.map((idea) => ({ title: idea.title, description: idea.description })),
        ...(listMode === 'existing'
          ? { listId: Number(selectedListId) }
          : { listName: newListName.trim() }),
      });
      setWorkflowStatus({ type: 'success', message: 'Workflow created on your board.' });
    } catch (err) {
      setWorkflowStatus({ type: 'error', message: 'Unable to create workflow right now.' });
    } finally {
      setWorkflowLoading(false);
    }
  };

  if (layout === 'lane') {
    return (
      <div className="list ai-lane">
        <div className="list-header">
          <div>
            <p className="list-eyebrow">AI Copilot</p>
            <h3>Workflow ideas</h3>
            <p className="list-subtitle">Summaries and next steps arrive in seconds.</p>
          </div>
          <button className="ghost-button" type="button" onClick={handleGenerateSummary} disabled={summaryLoading}>
            {summaryLoading ? 'Summarizing…' : 'Refresh'}
          </button>
        </div>
        <div className="ai-lane-summary">
          {summary ? (
            <p>{summary.text}</p>
          ) : (
            <p className="empty-state">Generate a briefing to align the team.</p>
          )}
        </div>
        <form className="prompt-form" onSubmit={handlePrompt}>
          <label className="form-label" htmlFor="lane-ai-prompt">Ask for a workflow</label>
          <textarea
            id="lane-ai-prompt"
            className="form-textarea"
            rows={3}
            placeholder="Example: Plan QA rollout for mobile v2"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={ideaLoading}>
            {ideaLoading ? 'Thinking…' : 'Generate tasks'}
          </button>
        </form>
        {ideas.length ? (
          <div className="ai-ideas compact">
            {ideas.map((idea, index) => (
              <div key={idea.title + index} className="ai-idea">
                <h4>{idea.title}</h4>
                <p>{idea.description}</p>
                <div className="idea-actions">
                  <span className="label-pill">Impact: {idea.impact}</span>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => defaultListId && handleAddIdea(idea)}
                    disabled={!defaultListId}
                  >
                    Add card
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Ideas will appear here after your prompt.</p>
        )}
        <button className="btn btn-secondary" type="button" onClick={() => void handleCreateWorkflow()} disabled={workflowLoading}>
          {workflowLoading ? 'Drafting workflow…' : 'Create workflow lane'}
        </button>
        {workflowStatus && (
          <p className={workflowStatus.type === 'success' ? 'form-success' : 'form-error'} role="status">
            {workflowStatus.message}
          </p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ai-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI Summary</p>
            <h3>Executive Brief</h3>
          </div>
          <button className="btn btn-secondary" type="button" onClick={handleGenerateSummary} disabled={summaryLoading}>
            {summaryLoading ? 'Summarizing…' : 'Generate Summary'}
          </button>
        </div>
        {summary ? (
          <div className="ai-summary">
            <p className="summary-text">{summary.text}</p>
            <div className="summary-columns">
              <div>
                <p className="eyebrow">Highlights</p>
                <ul>
                  {summary.insights.map((item, index) => (
                    <li key={`insight-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">Blockers</p>
                <ul>
                  {summary.blockers.map((item, index) => (
                    <li key={`blocker-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">Next Steps</p>
                <ul>
                  {summary.recommendations.map((item, index) => (
                    <li key={`rec-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-state">Use AI to draft a weekly status update in seconds.</p>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI Planning</p>
            <h3>Ask for task ideas</h3>
          </div>
        </div>
        <form className="prompt-form" onSubmit={handlePrompt}>
          <label className="form-label" htmlFor="ai-prompt">What do you need?</label>
          <textarea
            id="ai-prompt"
            className="form-textarea"
            placeholder="Example: Draft a risk mitigation plan for the auth migration."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={ideaLoading}>
            {ideaLoading ? 'Generating…' : 'Generate tasks'}
          </button>
        </form>
        {ideas.length ? (
          <div className="ai-ideas">
            {ideas.map((idea, index) => (
              <div key={idea.title + index} className="ai-idea">
                <div>
                  <p className="eyebrow">Suggestion</p>
                  <h4>{idea.title}</h4>
                  <p>{idea.description}</p>
                  <p className="label-pill">Impact: {idea.impact}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!defaultListId}
                  onClick={() => defaultListId && handleAddIdea(idea)}
                >
                  Add to board
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Ask for blockers, meeting agendas, or rollout plans.</p>
        )}
        <div className="workflow-builder">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workflow Builder</p>
              <h3>Send ideas to the board</h3>
            </div>
          </div>
          <div className="workflow-options">
            <label className="radio-option">
              <input
                type="radio"
                name="workflow-mode"
                value="existing"
                checked={listMode === 'existing'}
                onChange={() => setListMode('existing')}
              />
              <span>Use existing list</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="workflow-mode"
                value="new"
                checked={listMode === 'new'}
                onChange={() => setListMode('new')}
              />
              <span>Create new list</span>
            </label>
          </div>
          {listMode === 'existing' ? (
            <div className="form-group">
              <label className="form-label" htmlFor="workflow-list">Select list</label>
              <select
                id="workflow-list"
                className="form-input"
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
              >
                <option value="">Select a list</option>
                {listOptions.map((list) => (
                  <option key={list.id} value={list.id}>{list.title}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="workflow-name">List name</label>
              <input
                id="workflow-name"
                className="form-input"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="AI Workflow Plan"
              />
            </div>
          )}
          <button className="btn btn-primary" type="button" onClick={() => void handleCreateWorkflow()} disabled={workflowLoading}>
            {workflowLoading ? 'Creating workflow…' : 'Create workflow'}
          </button>
          {workflowStatus && (
            <p className={workflowStatus.type === 'success' ? 'form-success' : 'form-error'} role="status">
              {workflowStatus.message}
            </p>
          )}
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
};

export default AIAssistant;
