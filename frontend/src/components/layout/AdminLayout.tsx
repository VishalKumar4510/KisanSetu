import * as React from 'react';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminNavigation>{children}</AdminNavigation>;
}

export default AdminLayout;
