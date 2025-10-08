import { create } from 'zustand';
import { Client, PaginatedResult, SortConfig } from '@/types';
import { 
  getClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient 
} from '@/db/services';

interface ClientFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  error: string | null;
  filters: ClientFilters;
  sortConfig: SortConfig;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ClientsActions {
  // Data fetching
  fetchClients: () => Promise<void>;
  fetchClientById: (id: string) => Promise<void>;
  
  // CRUD operations
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editClient: (id: string, client: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  
  // UI state management
  setSelectedClient: (client: Client | null) => void;
  setFilters: (filters: Partial<ClientFilters>) => void;
  setSortConfig: (sortConfig: SortConfig) => void;
  setPagination: (page: number, limit?: number) => void;
  clearError: () => void;
  
  // Utility
  resetState: () => void;
}

const initialState: ClientsState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
  filters: {},
  sortConfig: { field: 'name', direction: 'asc' },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

export const useClientsStore = create<ClientsState & ClientsActions>((set, get) => ({
  ...initialState,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, sortConfig, pagination } = get();
      const result: PaginatedResult<Client> = await getClients({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
      });
      
      set({
        clients: result.data,
        pagination: {
          ...pagination,
          total: result.total,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar clientes',
        loading: false,
      });
    }
  },

  fetchClientById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const client = await getClientById(id);
      set({ selectedClient: client, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar cliente',
        loading: false,
      });
    }
  },

  addClient: async (clientData) => {
    set({ loading: true, error: null });
    try {
      await createClient(clientData);
      await get().fetchClients(); // Refresh list
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao criar cliente',
        loading: false,
      });
    }
  },

  editClient: async (id: string, clientData) => {
    set({ loading: true, error: null });
    try {
      await updateClient(id, clientData);
      await get().fetchClients(); // Refresh list
      
      // Update selected client if it's the one being edited
      const { selectedClient } = get();
      if (selectedClient?.id === id) {
        await get().fetchClientById(id);
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao atualizar cliente',
        loading: false,
      });
    }
  },

  removeClient: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteClient(id);
      await get().fetchClients(); // Refresh list
      
      // Clear selected client if it's the one being deleted
      const { selectedClient } = get();
      if (selectedClient?.id === id) {
        set({ selectedClient: null });
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir cliente',
        loading: false,
      });
    }
  },

  setSelectedClient: (client) => set({ selectedClient: client }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    get().fetchClients();
  },

  setSortConfig: (sortConfig) => {
    set({ sortConfig });
    get().fetchClients();
  },

  setPagination: (page, limit) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page,
        ...(limit && { limit }),
      },
    }));
    get().fetchClients();
  },

  clearError: () => set({ error: null }),

  resetState: () => set(initialState),
}));