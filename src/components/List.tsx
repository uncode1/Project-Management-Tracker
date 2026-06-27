import React, { useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Card from './Card';
import { List as ListType, Card as CardType, User } from '../types';

interface ListProps {
  list: ListType;
  index: number;
  users: User[];
  isBusy: boolean;
  onEditCard: (card: CardType) => void;
  onDeleteCard: (cardId: number) => Promise<void> | void;
  onAddCard: (listId: number, title: string) => Promise<void>;
  onEditList: (list: ListType) => void;
  onDeleteList: (listId: number) => Promise<void>;
}

const List: React.FC<ListProps> = ({
  list,
  index,
  users,
  isBusy,
  onEditCard,
  onDeleteCard,
  onAddCard,
  onEditList,
  onDeleteList,
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const wipCount = list.cards.length;
  const doneCount = list.cards.filter((card) => card.status?.toLowerCase() === 'done').length;

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    setIsSubmittingCard(true);
    try {
      await onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    } finally {
      setIsSubmittingCard(false);
    }
  };

  return (
    <Draggable draggableId={String(list.id)} index={index}>
      {(provided) => (
        <div
          className="list"
          ref={provided.innerRef}
          {...provided.draggableProps}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div className="list-header" {...provided.dragHandleProps}>
            <div>
              <div className="list-label-row">
                <p className="list-eyebrow">Lane</p>
                <span className="wip-badge">WIP {wipCount}</span>
              </div>
              <h3>{list.title}</h3>
              <p className="list-subtitle">{doneCount} complete • {wipCount - doneCount} in flight</p>
            </div>
            {showActions && (
              <div className="list-actions">
                <button className="ghost-icon" type="button" onClick={() => onEditList(list)} aria-label="Edit list">
                  ✎
                </button>
                <button className="ghost-icon danger" type="button" onClick={() => onDeleteList(list.id)} aria-label="Delete list">
                  ×
                </button>
              </div>
            )}
          </div>
          <Droppable droppableId={String(list.id)} type="card">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="card-stack"
              >
                {list.cards.map((card, index) => {
                  const assignee = users.find(user => user.id === card.assigneeId);
                  return (
                    <Card
                      key={card.id}
                      card={card}
                      index={index}
                      assignee={assignee}
                      onEdit={onEditCard}
                      onDelete={(cardId) => onDeleteCard(cardId)}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {isAddingCard ? (
            <div className="new-card">
              <input
                type="text"
                className="form-input"
                placeholder="Enter card title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && void handleAddCard()}
                autoFocus
              />
              <div className="button-group">
                <button className="btn btn-primary" onClick={() => void handleAddCard()} disabled={isBusy || isSubmittingCard}>
                  {isSubmittingCard ? 'Adding…' : 'Add Card'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsAddingCard(false)}
                  type="button"
                  disabled={isBusy}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="add-card button-link"
              type="button"
              onClick={() => setIsAddingCard(true)}
              disabled={isBusy}
            >
              + Add a card
            </button>
          )}
          <div className="list-meta">
            <p className="list-meta-label">Last updated</p>
            <p className="list-meta-value">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default List;