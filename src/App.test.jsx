import { render, screen } from '@testing-library/react';
import App from './App';
import { computeAuthState } from './auth';

describe('auth state logic', () => {
  it('marks unauthenticated users as requiring login', () => {
    expect(computeAuthState(null)).toMatchObject({
      isAuthenticated: false,
      hasServiceAccess: false,
      status: 'login_required',
    });
  });

  it('marks authenticated users without service access as blocked but visible', () => {
    const state = computeAuthState({
      id: 'u-1',
      serviceARoles: [],
      serviceBRoles: [],
      category: 'open',
    });

    expect(state).toMatchObject({
      isAuthenticated: true,
      hasServiceAccess: false,
      status: 'no_service_access',
    });
  });
});

describe('home page render', () => {
  it('renders login and sign-in notice for an unauthenticated user', () => {
    render(<App user={null} />);

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
  });

  it('renders logout and authenticated shell for a signed-in user', () => {
    render(
      <App
        user={{
          id: 'u-2',
          name: 'Jordan',
          serviceARoles: ['create'],
          serviceBRoles: [],
          category: 'confidential',
        }}
      />
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/service a/i)).toBeInTheDocument();
    expect(screen.getByText(/service b/i)).toBeInTheDocument();
  });
});
