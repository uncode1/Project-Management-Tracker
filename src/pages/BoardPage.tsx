import React, { useState } from 'react';
import Board from '../components/Board';
import Modal from '../components/Modal';
import AIAssistant from '../components/AIAssistant';
import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import type { Card, List } from '../types';

const BoardPage: React.FC = () => {
  const workspace = useWorkspaceContext();
  const { board, users, createList, createCard, deleteCard, deleteList, updateCard, updateList, moveCard, reorderLists } = workspace;
  const [modalItem, setModalItem] = useState<Card | List | null>(null);
  const [modalType, setModalType] = useState<'card' | 'list'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!board) {
    return (
      <section>
        <div className="board-hero">
          <div>
            <p className="eyebrow">Kanban Board</p>
            <h2>Delivery Roadmap</h2>
            <p className="subtitle">A new board will be created automatically once you add your first list.</p>
          </div>
        </div>
      </section>
    );
  }

  const handleEditCard = (card: Card) => {
    setModalItem(card);
    setModalType('card');
    setIsModalOpen(true);
  };

  const handleEditList = (list: List) => {
    setModalItem(list);
    setModalType('list');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (item: Card | List) => {
    if (modalType === 'card') {
      const card = item as Card;
      await updateCard(card.id, card);
    } else {
      const list = item as List;
      await updateList(list.id, { title: list.title });
    }
    setIsModalOpen(false);
    setModalItem(null);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setIsModalOpen(false);
  };

  const assistantLane = (
    <AIAssistant
      boardId={board.id}
      lists={board.lists}
      layout="lane"
      defaultListId={board.lists[0]?.id}
      onCreateCard={(listId, title, description) => workspace.createCard(listId, title, description)}
      onCreateWorkflow={(options) => workspace.createWorkflowFromIdeas(options)}
    />
  );

  return (
    <section>
      <div className="board-hero">
        <div>
          <p className="eyebrow">Kanban Board</p>
          <h2>{board.name}</h2>
          <p className="subtitle">Organize initiatives, collaborate with teammates, and keep delivery on schedule.</p>
        </div>
      </div>
      <Board
        board={board}
        users={users}
        isBusy={workspace.isBusy}
        onAddList={createList}
        onAddCard={createCard}
        onDeleteCard={deleteCard}
        onDeleteList={deleteList}
        onEditCard={handleEditCard}
        onEditList={handleEditList}
        onMoveCard={moveCard}
        onReorderLists={reorderLists}
        utilityLane={assistantLane}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        item={modalItem}
        type={modalType}
        users={users}
      />
    </section>
  );
};

export default BoardPage;
