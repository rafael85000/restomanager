import './globals.css';

export const metadata = {
  title: 'FIMC — Gestion food & métiers de bouche',
  description: 'Gestion de restaurant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
