import { create } from 'zustand';
import { Event, PaginatedResult, SortConfig, EventFilters } from '@/types';
import { 
  getEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getUpcomingEvents
} from '@/db/services';

interface EventsState {
  events: Event[];
  upcomingEvents: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  error: string | null;
  filters: EventFilters;
  sortConfig: SortConfig;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface EventsActions {
  // Data fetching
  fetchEvents: () => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  
  // CRUD operations
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editEvent: (id: string, event: Partial<Event>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  
  // UI state management
  setSelectedEvent: (event: Event | null) => void;
  setFilters: (filters: Partial<EventFilters>) => void;
  setSortConfig: (sortConfig: SortConfig) => void;
  setPagination: (page: number, limit?: number) => void;
  clearError: () => void;
  
  // Utility
  resetState: () => void;
}

const initialState: EventsState = {
  events: [],
  upcomingEvents: [],
  selectedEvent: null,
  loading: false,
  error: null,
  filters: {},
  sortConfig: { field: 'date', direction: 'asc' },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

export const useEventsStore = create<EventsState & EventsActions>((set, get) => ({
  ...initialState,

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, sortConfig, pagination } = get();
      const result: PaginatedResult<Event> = await getEvents({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
      });
      
      set({
        events: result.data,
        pagination: {
          ...pagination,
          total: result.total,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar eventos',
        loading: false,
      });
    }
  },

  fetchUpcomingEvents: async () => {
    try {
      const upcomingEvents = await getUpcomingEvents();
      set({ upcomingEvents });
    } catch (error) {
      console.error('Erro ao carregar próximos eventos:', error);
    }
  },

  fetchEventById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const event = await getEventById(id);
      set({ selectedEvent: event, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar evento',
        loading: false,
      });
    }
  },

  addEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      await createEvent(eventData);
      await get().fetchEvents(); // Refresh list
      await get().fetchUpcomingEvents(); // Refresh upcoming events
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao criar evento',
        loading: false,
      });
    }
  },

  editEvent: async (id: string, eventData) => {
    set({ loading: true, error: null });
    try {
      await updateEvent(id, eventData);
      await get().fetchEvents(); // Refresh list
      await get().fetchUpcomingEvents(); // Refresh upcoming events
      
      // Update selected event if it's the one being edited
      const { selectedEvent } = get();
      if (selectedEvent?.id === id) {
        await get().fetchEventById(id);
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao atualizar evento',
        loading: false,
      });
    }
  },

  removeEvent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteEvent(id);
      await get().fetchEvents(); // Refresh list
      await get().fetchUpcomingEvents(); // Refresh upcoming events
      
      // Clear selected event if it's the one being deleted
      const { selectedEvent } = get();
      if (selectedEvent?.id === id) {
        set({ selectedEvent: null });
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir evento',
        loading: false,
      });
    }
  },

  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    get().fetchEvents();
  },

  setSortConfig: (sortConfig) => {
    set({ sortConfig });
    get().fetchEvents();
  },

  setPagination: (page, limit) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page,
        ...(limit && { limit }),
      },
    }));
    get().fetchEvents();
  },

  clearError: () => set({ error: null }),

  resetState: () => set(initialState),
}));