import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

describe('Navbar Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login and signup buttons when user is not logged in', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/LOGIN/i)).toBeInTheDocument();
    expect(screen.getByText(/SIGN UP/i)).toBeInTheDocument();
  });

  it('renders username when valid token is in localStorage', () => {
    const payload = btoa(JSON.stringify({ username: 'streamer_pro' }));
    localStorage.setItem('token', `header.${payload}.signature`);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText('streamer_pro')).toBeInTheDocument();
  });

  it('handles invalid token gracefully and falls back to login/signup', () => {
    localStorage.setItem('token', 'invalid.token');

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/LOGIN/i)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
