import * as React from 'react';
import { FarmerNavigation } from '@/components/navigation/FarmerNavigation';

export function FarmerLayout({ children }: { children: React.ReactNode }) {
  return <FarmerNavigation>{children}</FarmerNavigation>;
}

export default FarmerLayout;
