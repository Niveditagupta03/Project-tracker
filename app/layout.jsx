import './globals.css';

export const metadata = {
  title: 'Project Tracker | Premium Dashboard',
  description: 'Track and manage all your projects effortlessly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>Project Tracker</h1>
            <nav>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Welcome, Admin</span>
            </nav>
          </header>
          <main style={{ padding: '0 1rem 2rem 1rem' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
