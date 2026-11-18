import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAppData } from '@/context/app-data/useAppData';
import { WelcomeModal } from '@/features/onboarding/WelcomeModal';
import { useAssistantReport } from '@/hooks/useAssistantReport';
import { currentMonthKey } from '@/lib/dates';
import { AppHeader } from './AppHeader';
import { DemoBanner } from './DemoBanner';

export function AppLayout() {
  const { data } = useAppData();
  const report = useAssistantReport(currentMonthKey());
  const alertCount = report.insights.filter((insight) => insight.severity === 'critical' || insight.severity === 'warning').length;

  return (
    <div className="min-h-dvh">
      <AppHeader alertCount={alertCount} />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        {data.settings.isDemo && data.settings.onboarded && <DemoBanner />}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {!data.settings.onboarded && <WelcomeModal />}
      <ScrollRestoration />
    </div>
  );
}
