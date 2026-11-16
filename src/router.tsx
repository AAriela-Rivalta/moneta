import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { RouteError } from '@/features/not-found/RouteError';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage'));
const BudgetsPage = lazy(() => import('@/features/budgets/BudgetsPage'));
const StatisticsPage = lazy(() => import('@/features/statistics/StatisticsPage'));
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage'));
const AssistantPage = lazy(() => import('@/features/assistant/AssistantPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/features/not-found/NotFoundPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'movimientos', element: <TransactionsPage /> },
      { path: 'presupuestos', element: <BudgetsPage /> },
      { path: 'estadisticas', element: <StatisticsPage /> },
      { path: 'objetivos', element: <GoalsPage /> },
      { path: 'asistente', element: <AssistantPage /> },
      { path: 'configuracion', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
