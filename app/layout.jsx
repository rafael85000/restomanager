import Sidebar from './components/Sidebar';
import './globals.css';

export const metadata = {
  title: 'RestoManager',
  description: 'Gestion de restaurant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{
            marginLeft: '240px',
            flex: 1,
            minHeight: '100vh',
            padding: '24px',
            background: '#f8f7f4',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}