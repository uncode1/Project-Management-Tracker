import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import List from './List';
import { Board as BoardType, List as ListType, Card as CardType, User } from '../types';

interface BoardProps {
  board: BoardType;
  users: User[];
  isBusy: boolean;
  onAddList: (title: string) => Promise<void>;
  onAddCard: (listId: number, title: string) => Promise<void>;
  onDeleteCard: (cardId: number) => Promise<void>;
  onDeleteList: (listId: number) => Promise<void>;
  onEditCard: (card: CardType) => void;
  onEditList: (list: ListType) => void;
  onMoveCard: (cardId: number, listId: number) => Promise<void>;
  onReorderLists: (order: Array<{ id: number; position: number }>) => Promise<void>;
  utilityLane?: React.ReactNode;
}

const Board: React.FC<BoardProps> = ({
  board,
  users,
  isBusy,
  onAddList,
  onAddCard,
  onDeleteCard,
  onDeleteList,
  onEditCard,
  onEditList,
  onMoveCard,
  onReorderLists,
  utilityLane,
}) => {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [listsState, setListsState] = useState<ListType[]>(board.lists);

  useEffect(() => {
    setListsState(board.lists);
  }, [board.lists]);

  const boardMetrics = useMemo(() => {
    const allCards = board.lists.flatMap((list) => list.cards);
    const done = allCards.filter((card) => card.status?.toLowerCase() === 'done').length;
    const active = allCards.length - done;
    const overdue = allCards.filter((card) => card.dueDate && new Date(card.dueDate) < new Date()).length;

    return [
      { label: 'Lists', value: board.lists.length },
      { label: 'Active', value: active },
      { label: 'Done', value: done },
      { label: 'Overdue', value: overdue },
    ];
  }, [board.lists]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (type === 'list') {
      const ordered = Array.from(listsState);
      const [removed] = ordered.splice(source.index, 1);
      if (!removed) return;
      ordered.splice(destination.index, 0, removed);
      setListsState(ordered);
      void onReorderLists(ordered.map((list, index) => ({ id: list.id, position: index })));
      return;
    }

    const sourceListId = Number(source.droppableId);
    const destinationListId = Number(destination.droppableId);
    if (Number.isNaN(sourceListId) || Number.isNaN(destinationListId)) return;
    if (sourceListId === destinationListId) {
      return; // keep server ordering authoritative for intra-list moves
    }
    const cardId = Number(draggableId);

    setListsState((prev) => {
      const next = prev.map((list) => ({ ...list, cards: [...list.cards] }));
      const fromIndex = next.findIndex((list) => list.id === sourceListId);
      const toIndex = next.findIndex((list) => list.id === destinationListId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const [moved] = next[fromIndex].cards.splice(source.index, 1);
      if (!moved) {
        return prev;
      }
      next[toIndex].cards.splice(destination.index, 0, moved);
      return next;
    });

    void onMoveCard(cardId, destinationListId);
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    setIsSubmittingList(true);
    try {
      await onAddList(newListTitle.trim());
      setNewListTitle('');
      setIsAddingList(false);
    } finally {
      setIsSubmittingList(false);
    }
  };

  return (
    <>
      <div className="board-toolbar">
        <div>
          <p className="eyebrow">Board Health</p>
          <h3 className="toolbar-title">Throughput overview</h3>
        </div>
        <div className="board-metrics">
          {boardMetrics.map((metric) => (
            <div key={metric.label} className="metric-chip">
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          <Droppable droppableId="board" direction="horizontal" type="list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="board-container">
                {listsState.map((list, index) => (
                <List
                  key={list.id}
                  list={list}
                  index={index}
                  users={users}
                  onEditCard={onEditCard}
                  onDeleteCard={(cardId) => onDeleteCard(cardId)}
                  onAddCard={(listId, title) => onAddCard(listId, title)}
                  onEditList={onEditList}
                  onDeleteList={(listId) => onDeleteList(listId)}
                  isBusy={isBusy}
                />
              ))}
              {provided.placeholder}
            </div>
            )}
          </Droppable>
          {utilityLane && (
            <div className="board-utility-lane">
              {utilityLane}
            </div>
          )}
          {isAddingList ? (
          <div className="list new-list">
            <input
              type="text"
              className="form-input"
              placeholder="Enter list title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && void handleAddList()}
              autoFocus
            />
            <div className="button-group">
              <button className="btn btn-primary" onClick={() => void handleAddList()} disabled={isBusy || isSubmittingList}>
                {isSubmittingList ? 'Adding…' : 'Add List'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddingList(false)}
                type="button"
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="add-list"
            onClick={() => setIsAddingList(true)}
            type="button"
            disabled={isBusy}
          >
            + Add a list
          </button>
        )}
        </div>
      </DragDropContext>
    </>
  );
};

export default Board;