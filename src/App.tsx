import { RouterProvider } from 'react-router';
import { AppDataProvider } from '@/context/app-data/AppDataProvider';
import { PeriodProvider } from '@/context/period/PeriodProvider';
import { ToastProvider } from '@/context/toast/ToastProvider';
import { router } from './router';

export function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <PeriodProvider>
          <RouterProvider router={router} />
        </PeriodProvider>
      </AppDataProvider>
    </ToastProvider>
  );
}
