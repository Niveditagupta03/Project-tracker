import './globals.css';
import './page.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Project Tracker | Premium Dashboard',
  description: 'Track and manage all your projects effortlessly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <AppShell>
            {children}
          </AppShell>
        </div>
      </body>
    </html>
  );
}
