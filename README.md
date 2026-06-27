# Project Management Tracker

A Trello-like project management and task tracking web application built with React, TypeScript, and Vite.

## Features

- **Kanban Board**: Organize tasks into lists (columns) like To Do, In Progress, Done
- **Drag and Drop**: Move cards between lists with intuitive drag-and-drop functionality
- **Task Management**: Create, edit, and delete cards with titles, descriptions, due dates, and labels
- **List Management**: Add, edit, and delete lists
- **Team Directory**: Register teammates, organize them into teams, and manage assignments from a dedicated Teams view
- **Task Assignment**: Assign each card to an individual and display ownership directly on the card
- **Dashboard**: View project metrics and KPIs including task counts, completion rates, overdue tasks, and visual charts
- **Local Storage**: Data persists in your browser's local storage
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project-management-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Testing

- Run frontend tests:
  ```bash
  npm test
  ```

- Run backend tests:
  ```bash
  cd server
  python -m pytest -q tests
  ```

### Continuous Integration

This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs linting, build, frontend tests, and backend tests on push and pull requests.

### Backend API (Flask)

The repository now includes a companion Flask backend under `server/` that exposes authentication, authorization, and persistence APIs.

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env
flask db upgrade
flask run --debug
```

Review `docs/backend-architecture.md` and `docs/compliance.md` for implementation details and GDPR/NDPR requirements.

## Usage

- **Board View**: Manage your Kanban board with drag-and-drop
- **Dashboard View**: Switch to the dashboard to view metrics and charts
- **Teams View**: Register teams, invite members, and adjust a teammate's team assignment
- **Add a List**: Click the "+ Add a list" button on the right side of the board
- **Add a Card**: Click "+ Add a card" at the bottom of any list
- **Assign Tasks**: Open a card to select an assignee from your teammate directory
- **Drag and Drop**: Drag cards between lists or reorder lists
- **Delete Items**: Use the delete button on cards and lists

## Technologies Used

- React 18
- TypeScript
- Vite
- React Beautiful DnD
- React Router
- Recharts
- CSS3

## Project Structure

```
src/
├── components/
│   ├── Board.tsx
│   ├── Card.tsx
│   ├── List.tsx
│   ├── Modal.tsx
│   ├── Dashboard.tsx
│   └── TeamManagement.tsx
├── hooks/
│   └── useLocalStorage.ts
├── styles/
│   └── index.css
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).