import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Multi-Agent AI Platform',
  description: 'A platform with 3 specialized AI agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <nav style={{
            backgroundColor: '#1a1d2e',
            borderBottom: '1px solid #2d3148',
            padding: '0 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                }}>🤖</div>
                <span style={{ fontWeight: '600', fontSize: '16px', color: '#e2e8f0' }}>
                  Multi-Agent AI
                </span>
              </Link>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { href: '/',           label: 'Dashboard' },
                  { href: '/history',    label: 'History'   },
                  { href: '/analytics',  label: 'Analytics' },
                ].map(link => (
                  <Link key={link.href} href={link.href} style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: '#94a3b8',
                    fontSize: '14px',
                    transition: 'all 0.15s'
                  }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{
              fontSize: '12px', color: '#64748b',
              background: '#0f1117', padding: '4px 12px',
              borderRadius: '20px', border: '1px solid #2d3148'
            }}>
              Powered by Groq + LangGraph
            </div>
          </nav>
          <main style={{ flex: 1, padding: '24px' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
