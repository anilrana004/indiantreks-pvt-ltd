import type { Metadata } from 'next';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';
import { SITE_ICON_URL } from '@/lib/brand-assets';
import './admin-globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Indian Treks Admin',
    template: '%s | Indian Treks Admin',
  },
  description: 'Internal admin console for Indian Treks.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      { url: SITE_ICON_URL, type: 'image/png' },
    ],
    shortcut: '/icon.png',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app min-h-dvh bg-[#f8fafc] text-slate-900 antialiased">
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </div>
  );
}
