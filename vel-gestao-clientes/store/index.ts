// Export all stores
export { useClientsStore } from './clients';
export { useProjectsStore } from './projects';
export { useEventsStore } from './events';
export { useCashflowStore } from './cashflow';
export { useUIStore } from './ui';
export { useDashboardStore } from './dashboard';

// Re-export types for convenience
export type {
  Client,
  Project,
  Event,
  Cashflow,
  DashboardKPIs,
  ChartData,
  CashflowChartData,
  ProjectStatusDistribution,
  GlobalSearchResult,
  Theme,
  SortConfig,
  PaginatedResult,
  ProjectFilters,
  EventFilters,
  CashflowFilters,
} from '@/types';