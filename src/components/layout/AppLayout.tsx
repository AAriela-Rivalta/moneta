import { Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAppData } from '@/context/app-data/useAppData';
import { WelcomeModal } from '@/features/onboarding/WelcomeModal';
import { useAssistantReport } from '@/hooks/useAssistantReport';
import { currentMonthKey } from '@/lib/dates';
import { DemoBanner } from './DemoBanner';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('balance-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const { data } = useAppData();
  const report = useAssistantReport(currentMonthKey());
  const alertCount = report.insights.filter((insight) => insight.severity === 'critical' || insight.severity === 'warning').length;

  useEffect(() => {
    try { localStorage.setItem('balance-sidebar-collapsed', String(collapsed)); } catch { /* storage may be unavailable */ }
  }, [collapsed]);

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar alertCount={alertCount} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="min-w-0 flex-1">
        <MobileHeader alertCount={alertCount} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {data.settings.isDemo && data.settings.onboarded && <DemoBanner />}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {!data.settings.onboarded && <WelcomeModal />}
      <ScrollRestoration />
    </div>
  );
}
