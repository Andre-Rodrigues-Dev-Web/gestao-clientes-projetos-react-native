import { create } from 'zustand';
import { Cashflow, PaginatedResult, SortConfig, CashflowFilters, CashflowChartData } from '@/types';
import { 
  getCashflow, 
  getCashflowById, 
  createCashflow, 
  updateCashflow, 
  deleteCashflow,
  getMonthlyBalance,
  getCashflowChartData
} from '@/db/services';

interface CashflowState {
  cashflow: Cashflow[];
  selectedCashflow: Cashflow | null;
  monthlyBalance: number;
  chartData: CashflowChartData[];
  loading: boolean;
  error: string | null;
  filters: CashflowFilters;
  sortConfig: SortConfig;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface CashflowActions {
  // Data fetching
  fetchCashflow: () => Promise<void>;
  fetchCashflowById: (id: string) => Promise<void>;
  fetchMonthlyBalance: (year: number, month: number) => Promise<void>;
  fetchChartData: (startDate: string, endDate: string) => Promise<void>;
  
  // CRUD operations
  addCashflow: (cashflow: Omit<Cashflow, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editCashflow: (id: string, cashflow: Partial<Cashflow>) => Promise<void>;
  removeCashflow: (id: string) => Promise<void>;
  
  // UI state management
  setSelectedCashflow: (cashflow: Cashflow | null) => void;
  setFilters: (filters: Partial<CashflowFilters>) => void;
  setSortConfig: (sortConfig: SortConfig) => void;
  setPagination: (page: number, limit?: number) => void;
  clearError: () => void;
  
  // Utility
  resetState: () => void;
}

const initialState: CashflowState = {
  cashflow: [],
  selectedCashflow: null,
  monthlyBalance: 0,
  chartData: [],
  loading: false,
  error: null,
  filters: {},
  sortConfig: { field: 'date', direction: 'desc' },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

export const useCashflowStore = create<CashflowState & CashflowActions>((set, get) => ({
  ...initialState,

  fetchCashflow: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, sortConfig, pagination } = get();
      const result: PaginatedResult<Cashflow> = await getCashflow({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
      });
      
      set({
        cashflow: result.data,
        pagination: {
          ...pagination,
          total: result.total,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar movimentações',
        loading: false,
      });
    }
  },

  fetchCashflowById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const cashflow = await getCashflowById(id);
      set({ selectedCashflow: cashflow, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar movimentação',
        loading: false,
      });
    }
  },

  fetchMonthlyBalance: async (year: number, month: number) => {
    try {
      const balance = await getMonthlyBalance(year, month);
      set({ monthlyBalance: balance });
    } catch (error) {
      console.error('Erro ao carregar saldo mensal:', error);
    }
  },

  fetchChartData: async (startDate: string, endDate: string) => {
    try {
      const chartData = await getCashflowChartData(startDate, endDate);
      set({ chartData });
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    }
  },

  addCashflow: async (cashflowData) => {
    set({ loading: true, error: null });
    try {
      await createCashflow(cashflowData);
      await get().fetchCashflow(); // Refresh list
      
      // Refresh monthly balance if current month
      const currentDate = new Date();
      await get().fetchMonthlyBalance(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao criar movimentação',
        loading: false,
      });
    }
  },

  editCashflow: async (id: string, cashflowData) => {
    set({ loading: true, error: null });
    try {
      await updateCashflow(id, cashflowData);
      await get().fetchCashflow(); // Refresh list
      
      // Update selected cashflow if it's the one being edited
      const { selectedCashflow } = get();
      if (selectedCashflow?.id === id) {
        await get().fetchCashflowById(id);
      }
      
      // Refresh monthly balance if current month
      const currentDate = new Date();
      await get().fetchMonthlyBalance(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao atualizar movimentação',
        loading: false,
      });
    }
  },

  removeCashflow: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteCashflow(id);
      await get().fetchCashflow(); // Refresh list
      
      // Clear selected cashflow if it's the one being deleted
      const { selectedCashflow } = get();
      if (selectedCashflow?.id === id) {
        set({ selectedCashflow: null });
      }
      
      // Refresh monthly balance if current month
      const currentDate = new Date();
      await get().fetchMonthlyBalance(currentDate.getFullYear(), currentDate.getMonth() + 1);
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir movimentação',
        loading: false,
      });
    }
  },

  setSelectedCashflow: (cashflow) => set({ selectedCashflow: cashflow }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    get().fetchCashflow();
  },

  setSortConfig: (sortConfig) => {
    set({ sortConfig });
    get().fetchCashflow();
  },

  setPagination: (page, limit) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page,
        ...(limit && { limit }),
      },
    }));
    get().fetchCashflow();
  },

  clearError: () => set({ error: null }),

  resetState: () => set(initialState),
}));