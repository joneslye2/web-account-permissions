import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { computeAuthState } from './auth';

describe('App (presentational)', () => {
  it('renders login and sign-in notice for an unauthenticated user, and calls onLogin when clicked', () => {
    const onLogin = vi.fn();
    const authState = computeAuthState({ isAuthenticated: false });
    render(<App authState={authState} onLogin={onLogin} onLogout={vi.fn()} />);

    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('renders logout and the service shell for an authenticated user with access, and calls onLogout when clicked', () => {
    const onLogout = vi.fn();
    const authState = computeAuthState({
      isAuthenticated: true,
      claims: { serviceARoles: ['create'], serviceBRoles: [], category: 'confidential' },
    });
    render(<App authState={authState} onLogin={vi.fn()} onLogout={onLogout} />);

    expect(screen.getByText(/service a/i)).toBeInTheDocument();
    expect(screen.getByText(/service b/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders logout-only messaging when claims failed to load', () => {
    const authState = computeAuthState({ isAuthenticated: true, claims: null, claimsError: true });
    render(<App authState={authState} onLogin={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/authorization data could not be loaded/i)).toBeInTheDocument();
  });

  it('renders a clear status for an authenticated user with no service access, not a blank screen', () => {
    const authState = computeAuthState({
      isAuthenticated: true,
      claims: { serviceARoles: [], serviceBRoles: [], category: 'open' },
    });
    render(<App authState={authState} onLogin={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByText('No service access')).toBeInTheDocument();
  });
});
