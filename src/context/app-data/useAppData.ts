import { useContext } from 'react';
import { AppDataContext } from './AppDataContext';

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData debe usarse dentro de <AppDataProvider>.');
  return context;
}
