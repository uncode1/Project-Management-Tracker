import React, { useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card as CardType, User } from '../types';

interface CardProps {
  card: CardType;
  index: number;
  assignee?: User;
  onEdit: (card: CardType) => void;
  onDelete: (id: number) => void;
}

const Card: React.FC<CardProps> = ({ card, index, assignee, onEdit, onDelete }) => {
  const dueStatus = useMemo(() => {
    if (!card.dueDate) return '';
    const today = new Date();
    const dueDate = new Date(card.dueDate);
    return dueDate < today ? 'overdue' : 'upcoming';
  }, [card.dueDate]);

  const formattedDueDate = useMemo(() => {
    if (!card.dueDate) return '';
    const date = new Date(card.dueDate);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [card.dueDate]);

  const priorityLabel = card.priority ? card.priority.charAt(0).toUpperCase() + card.priority.slice(1) : null;

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided) => (
        <div
          className="card"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(card)}
        >
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Task</p>
              <div className="card-title-row">
                <h4 className="card-title">{card.title}</h4>
              </div>
              {assignee && (
                <div className="assignee-chip">
                  <div className="avatar" aria-hidden="true">
                    {assignee.name
                      .split(' ')
                      .slice(0, 2)
                      .map(part => part[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="assignee-label">Owner</p>
                    <p className="assignee-name">{assignee.name}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="card-actions">
              <button
                className="ghost-icon"
                type="button"
                aria-label="Edit card"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
              >
                ✎
              </button>
              <button
                className="ghost-icon danger"
                type="button"
                aria-label="Delete card"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                }}
              >
                ×
              </button>
            </div>
          </div>
          {card.description && (
            <p className="card-description">{card.description}</p>
          )}
          <div className="card-labels">
            {card.labels && card.labels.map((label, idx) => (
              <span key={idx} className={`label-pill color-${label.color}`}>
                {label.name || label.color}
              </span>
            ))}
            {card.status && <span className="label-pill">{card.status}</span>}
            {priorityLabel && <span className={`label-pill priority-${card.priority}`}>Priority: {priorityLabel}</span>}
          </div>
          {card.dueDate && (
            <div className={`card-due-date ${dueStatus}`}>
              <span className="status-dot" aria-hidden="true" />
              Due {formattedDueDate}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card;