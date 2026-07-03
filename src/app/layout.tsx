import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeverExpire — Enterprise Document Expiry Tracker',
  description:
    'Ensure critical business records — contracts, licenses, certificates — never expire unnoticed. Real-time expiry tracking for enterprise teams.',
  keywords: ['document tracking', 'expiry management', 'compliance', 'contract management'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
