import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockMsal = {
  getActiveAccount: vi.fn(() => null),
  addEventCallback: vi.fn(() => 'callback-id'),
  removeEventCallback: vi.fn(),
  loginRedirect: vi.fn(),
  logoutRedirect: vi.fn(),
};

vi.mock('./msalClient', () => ({ msalInstance: mockMsal }));

const mockFetchClaims = vi.fn();
vi.mock('./claimsApi', () => ({ fetchClaims: (...args) => mockFetchClaims(...args) }));

const { default: AuthenticatedApp } = await import('./AuthenticatedApp');

describe('AuthenticatedApp', () => {
  beforeEach(() => {
    mockMsal.getActiveAccount.mockReturnValue(null);
    mockMsal.loginRedirect.mockClear();
    mockMsal.logoutRedirect.mockClear();
    mockFetchClaims.mockReset();
  });

  it('shows login required and triggers loginRedirect on click when no account is active', () => {
    render(<AuthenticatedApp />);

    expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockMsal.loginRedirect).toHaveBeenCalledTimes(1);
  });

  it('fetches claims and shows the service shell once an account is active and claims resolve', async () => {
    mockMsal.getActiveAccount.mockReturnValue({ localAccountId: 'user-1', name: 'Jordan' });
    mockFetchClaims.mockResolvedValue({ serviceARoles: ['create'], serviceBRoles: [], category: 'confidential' });

    render(<AuthenticatedApp />);

    await waitFor(() => expect(screen.getByText(/service a/i)).toBeInTheDocument());
    expect(mockFetchClaims).toHaveBeenCalledWith('user-1');
  });

  it('shows claims_unavailable messaging when the claims fetch fails', async () => {
    mockMsal.getActiveAccount.mockReturnValue({ localAccountId: 'user-1', name: 'Jordan' });
    mockFetchClaims.mockRejectedValue(new Error('boom'));

    render(<AuthenticatedApp />);

    await waitFor(() => expect(screen.getByText(/authorization data could not be loaded/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('triggers logoutRedirect when logout is clicked', async () => {
    mockMsal.getActiveAccount.mockReturnValue({ localAccountId: 'user-1', name: 'Jordan' });
    mockFetchClaims.mockResolvedValue({ serviceARoles: ['create'], serviceBRoles: [], category: 'confidential' });

    render(<AuthenticatedApp />);

    await waitFor(() => expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockMsal.logoutRedirect).toHaveBeenCalledTimes(1);
  });
});
