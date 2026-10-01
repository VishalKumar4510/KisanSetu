import * as React from 'react';
import { FarmerNavigation } from '@/components/navigation/FarmerNavigation';
import { FarmerAIAssistant } from '@/components/farmer/FarmerAIAssistant';

export function FarmerLayout({ children }: { children: React.ReactNode }) {
  return (
    <FarmerNavigation>
      {children}
      <FarmerAIAssistant />
    </FarmerNavigation>
  );
}

export default FarmerLayout;
