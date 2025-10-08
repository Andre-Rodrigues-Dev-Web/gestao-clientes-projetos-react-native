import { ReactNode } from "react";

// Tipos base
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// Cliente
export interface Client extends BaseEntity {
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  observacoes?: string;
}

export interface CreateClientData {
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  observacoes?: string;
}

// Projeto
export type ProjectStatus = 'planejado' | 'em_andamento' | 'concluido' | 'pausado';

export interface Project extends BaseEntity {
  titulo: string;
  descricao?: string;
  cliente_id: number;
  status: ProjectStatus;
  inicio_previsto?: string;
  fim_previsto?: string;
  custo_estimado?: number;
  client?: Client; // Para joins
}

export interface CreateProjectData {
  titulo: string;
  descricao?: string;
  cliente_id: number;
  status: ProjectStatus;
  inicio_previsto?: string;
  fim_previsto?: string;
  custo_estimado?: number;
}

// Evento
export type EventType = 'reuniao' | 'entrega' | 'cobranca' | 'outro';

export interface Event extends BaseEntity {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  tipo: EventType;
  projeto_id?: number;
  cliente_id?: number;
  project?: Project; // Para joins
  client?: Client; // Para joins
}

export interface CreateEventData {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  tipo: EventType;
  projeto_id?: number;
  cliente_id?: number;
}

// Controle de Caixa
export type CashflowType = 'entrada' | 'saida';
export type CashflowCategory = 'servico' | 'licenca' | 'infra' | 'marketing' | 'outros';

export interface Cashflow extends BaseEntity {
  tipo: CashflowType;
  valor: number;
  categoria: CashflowCategory;
  descricao?: string;
  data: string;
  projeto_id?: number;
  cliente_id?: number;
  project?: Project; // Para joins
  client?: Client; // Para joins
}

export interface CreateCashflowData {
  tipo: CashflowType;
  valor: number;
  categoria: CashflowCategory;
  descricao?: string;
  data: string;
  projeto_id?: number;
  cliente_id?: number;
}

// KPIs e Dashboard
export interface DashboardKPIs {
  totalProjects: ReactNode;
  upcomingEvents: ReactNode;
  totalClientes: number;
  projetosAtivos: number;
  projetosConcluidos: number;
  proximosEventos: number;
  saldoMesAtual: number;
  totalEntradas: number;
  totalSaidas: number;
}

export interface ChartData {
  x: string | number;
  y: number;
  label?: string;
}

export interface CashflowChartData {
  date: string;
  entradas: number;
  saidas: number;
}

export interface ProjectStatusDistribution {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

// Filtros
export interface ProjectFilters {
  status?: ProjectStatus;
  cliente_id?: number;
  search?: string;
}

export interface EventFilters {
  tipo?: EventType;
  projeto_id?: number;
  cliente_id?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

export interface CashflowFilters {
  tipo?: CashflowType;
  categoria?: CashflowCategory;
  projeto_id?: number;
  cliente_id?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

// Ordenação
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

// Paginação
export interface PaginationConfig {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tema
export type Theme = 'light' | 'dark';

// Busca global
export interface GlobalSearchResult {
  type: 'client' | 'project' | 'event' | 'cashflow';
  id: number;
  title: string;
  subtitle?: string;
  data: any;
}

// Backup e Export
export interface BackupData {
  version: string;
  timestamp: string;
  clients: Client[];
  projects: Project[];
  events: Event[];
  cashflow: Cashflow[];
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: any;
}