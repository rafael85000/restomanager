import Sidebar from './components/Sidebar';

export default function AppLayout({ children }) {
  return (
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
  );
}
