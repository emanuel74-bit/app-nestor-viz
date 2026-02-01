import { useState } from 'react';
import { InfrastructureProvider } from '@/context/InfrastructureContext';
import { MainLayout } from '@/components/MainLayout';
import { SourcesView } from '@/components/SourcesView';
import { VMsView } from '@/components/VMsView';

const Index = () => {
  const [currentView, setCurrentView] = useState<'sources' | 'vms'>('sources');

  return (
    <InfrastructureProvider>
      <MainLayout currentView={currentView} onViewChange={setCurrentView}>
        {currentView === 'sources' ? <SourcesView /> : <VMsView />}
      </MainLayout>
    </InfrastructureProvider>
  );
};

export default Index;
