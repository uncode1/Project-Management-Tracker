import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

describe('Login page', () => {
  it('renders the sign-in page', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>,
    );

    const heading = await screen.findByRole('heading', { name: /sign in to workspace/i });
    expect(heading).toBeInTheDocument();
  });
});
