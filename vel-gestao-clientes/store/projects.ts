import { create } from 'zustand';
import { Project, PaginatedResult, SortConfig, ProjectFilters } from '@/types';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} from '@/db/services';

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  filters: ProjectFilters;
  sortConfig: SortConfig;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ProjectsActions {
  // Data fetching
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  
  // CRUD operations
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editProject: (id: string, project: Partial<Project>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  
  // UI state management
  setSelectedProject: (project: Project | null) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  setSortConfig: (sortConfig: SortConfig) => void;
  setPagination: (page: number, limit?: number) => void;
  clearError: () => void;
  
  // Utility
  resetState: () => void;
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
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

export const useProjectsStore = create<ProjectsState & ProjectsActions>((set, get) => ({
  ...initialState,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, sortConfig, pagination } = get();
      const result: PaginatedResult<Project> = await getProjects({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
      });
      
      set({
        projects: result.data,
        pagination: {
          ...pagination,
          total: result.total,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar projetos',
        loading: false,
      });
    }
  },

  fetchProjectById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const project = await getProjectById(id);
      set({ selectedProject: project, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar projeto',
        loading: false,
      });
    }
  },

  addProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      await createProject(projectData);
      await get().fetchProjects(); // Refresh list
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao criar projeto',
        loading: false,
      });
    }
  },

  editProject: async (id: string, projectData) => {
    set({ loading: true, error: null });
    try {
      await updateProject(id, projectData);
      await get().fetchProjects(); // Refresh list
      
      // Update selected project if it's the one being edited
      const { selectedProject } = get();
      if (selectedProject?.id === id) {
        await get().fetchProjectById(id);
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao atualizar projeto',
        loading: false,
      });
    }
  },

  removeProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteProject(id);
      await get().fetchProjects(); // Refresh list
      
      // Clear selected project if it's the one being deleted
      const { selectedProject } = get();
      if (selectedProject?.id === id) {
        set({ selectedProject: null });
      }
      
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir projeto',
        loading: false,
      });
    }
  },

  setSelectedProject: (project) => set({ selectedProject: project }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    get().fetchProjects();
  },

  setSortConfig: (sortConfig) => {
    set({ sortConfig });
    get().fetchProjects();
  },

  setPagination: (page, limit) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        page,
        ...(limit && { limit }),
      },
    }));
    get().fetchProjects();
  },

  clearError: () => set({ error: null }),

  resetState: () => set(initialState),
}));