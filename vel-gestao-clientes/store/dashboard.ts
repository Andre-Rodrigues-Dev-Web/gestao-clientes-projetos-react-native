import { create } from 'zustand';
import { DashboardKPIs, ChartData, ProjectStatusDistribution } from '@/types';
import { 
  getDashboardKPIs, 
  getRecentItems,
  getProjectStatusDistribution
} from '@/db/services';

interface RecentItem {
  id: string;
  type: 'client' | 'project' | 'event' | 'cashflow';
  title: string;
  subtitle?: string;
  date: string;
  amount?: number;
}

interface DashboardState {
  kpis: DashboardKPIs | null;
  recentItems: RecentItem[];
  projectStatusDistribution: ProjectStatusDistribution[];
  chartData: ChartData[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface DashboardActions {
  // Data fetching
  fetchDashboardData: () => Promise<void>;
  fetchKPIs: () => Promise<void>;
  fetchRecentItems: () => Promise<void>;
  fetchProjectStatusDistribution: () => Promise<void>;
  
  // UI state management
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  
  // Utility
  refreshDashboard: () => Promise<void>;
  resetState: () => void;
}

const initialState: DashboardState = {
  kpis: null,
  recentItems: [],
  projectStatusDistribution: [],
  chartData: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

export const useDashboardStore = create<DashboardState & DashboardActions>((set, get) => ({
  ...initialState,

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchKPIs(),
        get().fetchRecentItems(),
        get().fetchProjectStatusDistribution(),
      ]);
      
      set({ 
        loading: false, 
        lastUpdated: Date.now() 
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard',
        loading: false,
      });
    }
  },

  fetchKPIs: async () => {
    try {
      const kpis = await getDashboardKPIs();
      set({ kpis });
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
      throw error;
    }
  },

  fetchRecentItems: async () => {
    try {
      const recentItems = await getRecentItems();
      set({ recentItems });
    } catch (error) {
      console.error('Erro ao carregar itens recentes:', error);
      throw error;
    }
  },

  fetchProjectStatusDistribution: async () => {
    try {
      const distribution = await getProjectStatusDistribution();
      set({ projectStatusDistribution: distribution });
    } catch (error) {
      console.error('Erro ao carregar distribuição de status dos projetos:', error);
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),

  clearError: () => set({ error: null }),

  refreshDashboard: async () => {
    // Force refresh all dashboard data
    await get().fetchDashboardData();
  },

  resetState: () => set(initialState),
}));