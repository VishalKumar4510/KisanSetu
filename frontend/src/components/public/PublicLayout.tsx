import React, { useEffect } from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function PublicLayout({
  children,
  title = 'KisanSetu — Smart Mandi Procurement Platform',
  description = 'KisanSetu digitizes agricultural mandi procurement: capacity-aware slot booking, digital tokens, live queue tracking, automated weighment, Agmarknet quality checks, and direct DBT payments.',
}: PublicLayoutProps) {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F5] text-[#17201A]">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
