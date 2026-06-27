import React, { useState, useEffect } from 'react';
import { Card as CardType, List as ListType, User } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CardType | ListType) => void;
  item: CardType | ListType | null;
  type: 'card' | 'list';
  users: User[];
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, item, type, users }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [labels, setLabels] = useState<Array<{ color: string; name?: string }>>([]);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      if (type === 'card') {
        const card = item as CardType;
        setDescription(card.description || '');
        setDueDate(card.dueDate || '');
        setPriority(card.priority || '');
        setStatus(card.status || 'todo');
        setAssigneeId(card.assigneeId ? String(card.assigneeId) : '');
        setLabels(card.labels || []);
      }
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('');
      setStatus('todo');
      setAssigneeId('');
      setLabels([]);
    }
  }, [item, type]);

  const handleSave = () => {
    if (!title.trim()) return;

    if (type === 'card') {
      const updatedCard: CardType = {
        ...(item as CardType),
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        priority: priority || undefined,
        status: status || undefined,
        labels,
      };
      onSave(updatedCard);
    } else {
      const updatedList: ListType = {
        ...(item as ListType),
        title: title.trim(),
      };
      onSave(updatedList);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="modal-title">Edit {type === 'card' ? 'Card' : 'List'}</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="modal-title">Title</label>
          <input
            type="text"
            className="form-input"
            id="modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        {type === 'card' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-description">Description</label>
              <textarea
                className="form-textarea"
                id="modal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-due-date">Due Date</label>
              <input
                type="date"
                className="form-input"
                id="modal-due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-priority">Priority</label>
              <select
                className="form-input"
                id="modal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">No priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-status">Status</label>
              <select
                className="form-input"
                id="modal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-assignee">Assignee</label>
              <select
                className="form-input"
                id="modal-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Labels</label>
              <div className="label-editor">
                {labels.map((label, index) => (
                  <div key={index} className="label-item">
                    <span className={`label-pill color-${label.color}`}>{label.name || label.color}</span>
                    <button
                      type="button"
                      className="ghost-icon danger"
                      onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="add-label">
                  <select
                    className="form-input"
                    onChange={(e) => {
                      if (e.target.value) {
                        setLabels([...labels, { color: e.target.value }]);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add label...</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                    <option value="blue">Blue</option>
                    <option value="sky">Sky</option>
                    <option value="lime">Lime</option>
                    <option value="pink">Pink</option>
                    <option value="black">Black</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;