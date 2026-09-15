export default function App({ authState, onLogin, onLogout }) {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Submission App</h1>
        <div>
          {!authState.isAuthenticated ? (
            <button type="button" onClick={onLogin}>Login</button>
          ) : (
            <button type="button" onClick={onLogout}>Logout</button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {!authState.isAuthenticated ? (
          <section aria-live="polite" style={styles.statusBox}>
            <strong>Sign in required</strong>
            <p>{authState.message}</p>
          </section>
        ) : (
          <>
            <section aria-live="polite" style={styles.statusBox}>
              <strong>{authState.hasServiceAccess ? 'Access ready' : 'No service access'}</strong>
              <p>{authState.message}</p>
            </section>

            <div style={styles.serviceGrid}>
              <div style={styles.serviceCard}>Service A</div>
              <div style={styles.serviceCard}>Service B</div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: 960,
    margin: '40px auto',
    padding: '0 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #dfe3e8',
    marginBottom: 24,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  statusBox: {
    border: '1px solid #dfe3e8',
    borderRadius: 8,
    padding: '16px 18px',
    background: '#f7f9fa',
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  },
  serviceCard: {
    border: '1px solid #dfe3e8',
    borderRadius: 8,
    background: '#ffffff',
    padding: '20px',
    fontWeight: 600,
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
};
