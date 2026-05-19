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
          <main style={{ padding: '0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
