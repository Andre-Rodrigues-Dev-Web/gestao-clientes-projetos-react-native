import { create } from 'zustand';
import { Theme, GlobalSearchResult } from '@/types';

interface UIState {
  theme: Theme;
  isLoading: boolean;
  notifications: Notification[];
  modals: {
    clientForm: boolean;
    projectForm: boolean;
    eventForm: boolean;
    cashflowForm: boolean;
    globalSearch: boolean;
    backup: boolean;
    export: boolean;
  };
  globalSearch: {
    query: string;
    results: GlobalSearchResult[];
    loading: boolean;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

interface UIActions {
  // Theme management
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  
  // Loading state
  setLoading: (loading: boolean) => void;
  
  // Modal management
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Global search
  setGlobalSearchQuery: (query: string) => void;
  setGlobalSearchResults: (results: GlobalSearchResult[]) => void;
  setGlobalSearchLoading: (loading: boolean) => void;
  clearGlobalSearch: () => void;
  
  // Utility
  resetState: () => void;
}

const initialState: UIState = {
  theme: 'light',
  isLoading: false,
  notifications: [],
  modals: {
    clientForm: false,
    projectForm: false,
    eventForm: false,
    cashflowForm: false,
    globalSearch: false,
    backup: false,
    export: false,
  },
  globalSearch: {
    query: '',
    results: [],
    loading: false,
  },
};

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  ...initialState,

  setTheme: (theme) => set({ theme }),

  toggleTheme: () => {
    const { theme } = get();
    set({ theme: theme === 'light' ? 'dark' : 'light' });
  },

  setLoading: (isLoading) => set({ isLoading }),

  openModal: (modal) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: true,
      },
    }));
  },

  closeModal: (modal) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: false,
      },
    }));
  },

  closeAllModals: () => {
    set({
      modals: {
        clientForm: false,
        projectForm: false,
        eventForm: false,
        cashflowForm: false,
        globalSearch: false,
        backup: false,
        export: false,
      },
    });
  },

  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove notification after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      get().removeNotification(notification.id);
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  setGlobalSearchQuery: (query) => {
    set((state) => ({
      globalSearch: {
        ...state.globalSearch,
        query,
      },
    }));
  },

  setGlobalSearchResults: (results) => {
    set((state) => ({
      globalSearch: {
        ...state.globalSearch,
        results,
      },
    }));
  },

  setGlobalSearchLoading: (loading) => {
    set((state) => ({
      globalSearch: {
        ...state.globalSearch,
        loading,
      },
    }));
  },

  clearGlobalSearch: () => {
    set((state) => ({
      globalSearch: {
        ...state.globalSearch,
        query: '',
        results: [],
        loading: false,
      },
    }));
  },

  resetState: () => set(initialState),
}));