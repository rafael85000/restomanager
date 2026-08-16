import './globals.css';

export const metadata = {
  title: 'FIMC — Gestion food & métiers de bouche',
  description: 'Gestion de restaurant',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FIMC',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#534ab7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* PWA iOS */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FIMC" />
        {/* PWA Android */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#534ab7" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {})
            })
          }
        `}} />
      </body>
    </html>
  )
}