import * as React from 'react';
import { OfficerNavigation } from '@/components/navigation/OfficerNavigation';

export function OfficerLayout({ children }: { children: React.ReactNode }) {
  return <OfficerNavigation>{children}</OfficerNavigation>;
}

export default OfficerLayout;
