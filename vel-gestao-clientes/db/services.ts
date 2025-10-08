import { executeQuery, executeSelect, executeSelectFirst } from './config';
import {
  Client,
  CreateClientData,
  Project,
  CreateProjectData,
  Event,
  CreateEventData,
  Cashflow,
  CreateCashflowData,
  ProjectFilters,
  EventFilters,
  CashflowFilters,
  SortConfig,
  PaginationConfig,
  PaginatedResult,
  DashboardKPIs,
  CashflowChartData,
  ProjectStatusDistribution,
  GlobalSearchResult
} from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// ==================== CLIENTES ====================

export const clientService = {
  async getAll(search?: string, sort?: SortConfig, pagination?: PaginationConfig): Promise<PaginatedResult<Client>> {
    let query = 'SELECT * FROM clients';
    let countQuery = 'SELECT COUNT(*) as total FROM clients';
    const params: any[] = [];
    
    if (search) {
      const searchCondition = ' WHERE nome LIKE ? OR email LIKE ? OR empresa LIKE ?';
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (sort) {
      query += ` ORDER BY ${sort.field} ${sort.order.toUpperCase()}`;
    } else {
      query += ' ORDER BY created_at DESC';
    }
    
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT ${pagination.limit} OFFSET ${offset}`;
    }
    
    const [data, totalResult] = await Promise.all([
      executeSelect<Client>(query, params),
      executeSelect<{ total: number }>(countQuery, params)
    ]);
    
    const total = totalResult[0].total;
    const limit = pagination?.limit || total;
    const page = pagination?.page || 1;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id: number): Promise<Client | null> {
    return executeSelectFirst<Client>('SELECT * FROM clients WHERE id = ?', [id]);
  },

  async create(data: CreateClientData): Promise<number> {
    const result = await executeQuery(
      `INSERT INTO clients (nome, email, telefone, empresa, observacoes) 
       VALUES (?, ?, ?, ?, ?)`,
      [data.nome, data.email, data.telefone, data.empresa, data.observacoes]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, data: Partial<CreateClientData>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    await executeQuery(
      `UPDATE clients SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  },

  async delete(id: number): Promise<void> {
    await executeQuery('DELETE FROM clients WHERE id = ?', [id]);
  },

  async getProjectsCount(clientId: number): Promise<number> {
    const result = await executeSelectFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM projects WHERE cliente_id = ?',
      [clientId]
    );
    return result?.count || 0;
  }
};

// ==================== PROJETOS ====================

export const projectService = {
  async getAll(filters?: ProjectFilters, sort?: SortConfig, pagination?: PaginationConfig): Promise<PaginatedResult<Project>> {
    let query = `
      SELECT p.*, c.nome as client_name, c.email as client_email 
      FROM projects p 
      LEFT JOIN clients c ON p.cliente_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM projects p';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters?.status) {
      conditions.push('p.status = ?');
      params.push(filters.status);
    }
    
    if (filters?.cliente_id) {
      conditions.push('p.cliente_id = ?');
      params.push(filters.cliente_id);
    }
    
    if (filters?.search) {
      conditions.push('(p.titulo LIKE ? OR p.descricao LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }
    
    if (sort) {
      query += ` ORDER BY p.${sort.field} ${sort.order.toUpperCase()}`;
    } else {
      query += ' ORDER BY p.created_at DESC';
    }
    
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT ${pagination.limit} OFFSET ${offset}`;
    }
    
    const [data, totalResult] = await Promise.all([
      executeSelect<Project>(query, params),
      executeSelect<{ total: number }>(countQuery, params)
    ]);
    
    const total = totalResult[0].total;
    const limit = pagination?.limit || total;
    const page = pagination?.page || 1;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id: number): Promise<Project | null> {
    return executeSelectFirst<Project>(
      `SELECT p.*, c.nome as client_name, c.email as client_email 
       FROM projects p 
       LEFT JOIN clients c ON p.cliente_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
  },

  async create(data: CreateProjectData): Promise<number> {
    const result = await executeQuery(
      `INSERT INTO projects (titulo, descricao, cliente_id, status, inicio_previsto, fim_previsto, custo_estimado) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.descricao,
        data.cliente_id,
        data.status,
        data.inicio_previsto,
        data.fim_previsto,
        data.custo_estimado
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, data: Partial<CreateProjectData>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    await executeQuery(
      `UPDATE projects SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  },

  async delete(id: number): Promise<void> {
    await executeQuery('DELETE FROM projects WHERE id = ?', [id]);
  },

  async getStatusDistribution(): Promise<ProjectStatusDistribution[]> {
    const result = await executeSelect<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       GROUP BY status`
    );
    
    const total = result.reduce((sum, item) => sum + item.count, 0);
    
    return result.map(item => ({
      status: item.status as any,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));
  }
};

// ==================== EVENTOS ====================

export const eventService = {
  async getAll(filters?: EventFilters, sort?: SortConfig, pagination?: PaginationConfig): Promise<PaginatedResult<Event>> {
    let query = `
      SELECT e.*, p.titulo as project_title, c.nome as client_name 
      FROM events e 
      LEFT JOIN projects p ON e.projeto_id = p.id 
      LEFT JOIN clients c ON e.cliente_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM events e';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters?.tipo) {
      conditions.push('e.tipo = ?');
      params.push(filters.tipo);
    }
    
    if (filters?.projeto_id) {
      conditions.push('e.projeto_id = ?');
      params.push(filters.projeto_id);
    }
    
    if (filters?.cliente_id) {
      conditions.push('e.cliente_id = ?');
      params.push(filters.cliente_id);
    }
    
    if (filters?.data_inicio) {
      conditions.push('DATE(e.data_inicio) >= ?');
      params.push(filters.data_inicio);
    }
    
    if (filters?.data_fim) {
      conditions.push('DATE(e.data_inicio) <= ?');
      params.push(filters.data_fim);
    }
    
    if (filters?.search) {
      conditions.push('(e.titulo LIKE ? OR e.descricao LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }
    
    if (sort) {
      query += ` ORDER BY e.${sort.field} ${sort.order.toUpperCase()}`;
    } else {
      query += ' ORDER BY e.data_inicio ASC';
    }
    
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT ${pagination.limit} OFFSET ${offset}`;
    }
    
    const [data, totalResult] = await Promise.all([
      executeSelect<Event>(query, params),
      executeSelect<{ total: number }>(countQuery, params)
    ]);
    
    const total = totalResult[0].total;
    const limit = pagination?.limit || total;
    const page = pagination?.page || 1;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id: number): Promise<Event | null> {
    return executeSelectFirst<Event>(
      `SELECT e.*, p.titulo as project_title, c.nome as client_name 
       FROM events e 
       LEFT JOIN projects p ON e.projeto_id = p.id 
       LEFT JOIN clients c ON e.cliente_id = c.id 
       WHERE e.id = ?`,
      [id]
    );
  },

  async create(data: CreateEventData): Promise<number> {
    const result = await executeQuery(
      `INSERT INTO events (titulo, descricao, data_inicio, data_fim, local, tipo, projeto_id, cliente_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.descricao,
        data.data_inicio,
        data.data_fim,
        data.local,
        data.tipo,
        data.projeto_id,
        data.cliente_id
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, data: Partial<CreateEventData>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    await executeQuery(
      `UPDATE events SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  },

  async delete(id: number): Promise<void> {
    await executeQuery('DELETE FROM events WHERE id = ?', [id]);
  },

  async getUpcoming(days: number = 7): Promise<Event[]> {
    const endDate = format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    return executeSelect<Event>(
      `SELECT e.*, p.titulo as project_title, c.nome as client_name 
       FROM events e 
       LEFT JOIN projects p ON e.projeto_id = p.id 
       LEFT JOIN clients c ON e.cliente_id = c.id 
       WHERE DATE(e.data_inicio) BETWEEN DATE('now') AND ? 
       ORDER BY e.data_inicio ASC`,
      [endDate]
    );
  }
};

// ==================== CONTROLE DE CAIXA ====================

export const cashflowService = {
  async getAll(filters?: CashflowFilters, sort?: SortConfig, pagination?: PaginationConfig): Promise<PaginatedResult<Cashflow>> {
    let query = `
      SELECT cf.*, p.titulo as project_title, c.nome as client_name 
      FROM cashflow cf 
      LEFT JOIN projects p ON cf.projeto_id = p.id 
      LEFT JOIN clients c ON cf.cliente_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM cashflow cf';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters?.tipo) {
      conditions.push('cf.tipo = ?');
      params.push(filters.tipo);
    }
    
    if (filters?.categoria) {
      conditions.push('cf.categoria = ?');
      params.push(filters.categoria);
    }
    
    if (filters?.projeto_id) {
      conditions.push('cf.projeto_id = ?');
      params.push(filters.projeto_id);
    }
    
    if (filters?.cliente_id) {
      conditions.push('cf.cliente_id = ?');
      params.push(filters.cliente_id);
    }
    
    if (filters?.data_inicio) {
      conditions.push('cf.data >= ?');
      params.push(filters.data_inicio);
    }
    
    if (filters?.data_fim) {
      conditions.push('cf.data <= ?');
      params.push(filters.data_fim);
    }
    
    if (filters?.search) {
      conditions.push('cf.descricao LIKE ?');
      params.push(`%${filters.search}%`);
    }
    
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }
    
    if (sort) {
      query += ` ORDER BY cf.${sort.field} ${sort.order.toUpperCase()}`;
    } else {
      query += ' ORDER BY cf.data DESC';
    }
    
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      query += ` LIMIT ${pagination.limit} OFFSET ${offset}`;
    }
    
    const [data, totalResult] = await Promise.all([
      executeSelect<Cashflow>(query, params),
      executeSelect<{ total: number }>(countQuery, params)
    ]);
    
    const total = totalResult[0].total;
    const limit = pagination?.limit || total;
    const page = pagination?.page || 1;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getById(id: number): Promise<Cashflow | null> {
    return executeSelectFirst<Cashflow>(
      `SELECT cf.*, p.titulo as project_title, c.nome as client_name 
       FROM cashflow cf 
       LEFT JOIN projects p ON cf.projeto_id = p.id 
       LEFT JOIN clients c ON cf.cliente_id = c.id 
       WHERE cf.id = ?`,
      [id]
    );
  },

  async create(data: CreateCashflowData): Promise<number> {
    const result = await executeQuery(
      `INSERT INTO cashflow (tipo, valor, categoria, descricao, data, projeto_id, cliente_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.tipo,
        data.valor,
        data.categoria,
        data.descricao,
        data.data,
        data.projeto_id,
        data.cliente_id
      ]
    );
    return result.lastInsertRowId;
  },

  async update(id: number, data: Partial<CreateCashflowData>): Promise<void> {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    await executeQuery(
      `UPDATE cashflow SET ${fields} WHERE id = ?`,
      [...values, id]
    );
  },

  async delete(id: number): Promise<void> {
    await executeQuery('DELETE FROM cashflow WHERE id = ?', [id]);
  },

  async getMonthlyBalance(year?: number, month?: number): Promise<{ entradas: number; saidas: number; saldo: number }> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    
    const startDate = format(startOfMonth(new Date(targetYear, targetMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(targetYear, targetMonth - 1)), 'yyyy-MM-dd');
    
    const result = await executeSelect<{ tipo: string; total: number }>(
      `SELECT tipo, SUM(valor) as total 
       FROM cashflow 
       WHERE data BETWEEN ? AND ? 
       GROUP BY tipo`,
      [startDate, endDate]
    );
    
    const entradas = result.find(r => r.tipo === 'entrada')?.total || 0;
    const saidas = result.find(r => r.tipo === 'saida')?.total || 0;
    
    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  },

  async getChartData(year?: number, month?: number): Promise<CashflowChartData[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    
    const startDate = format(startOfMonth(new Date(targetYear, targetMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(targetYear, targetMonth - 1)), 'yyyy-MM-dd');
    
    const result = await executeSelect<{ data: string; tipo: string; total: number }>(
      `SELECT data, tipo, SUM(valor) as total 
       FROM cashflow 
       WHERE data BETWEEN ? AND ? 
       GROUP BY data, tipo 
       ORDER BY data`,
      [startDate, endDate]
    );
    
    const chartData: { [key: string]: CashflowChartData } = {};
    
    result.forEach(row => {
      if (!chartData[row.data]) {
        chartData[row.data] = {
          date: row.data,
          entradas: 0,
          saidas: 0
        };
      }
      
      if (row.tipo === 'entrada') {
        chartData[row.data].entradas = row.total;
      } else {
        chartData[row.data].saidas = row.total;
      }
    });
    
    return Object.values(chartData).sort((a, b) => a.date.localeCompare(b.date));
  }
};

// ==================== DASHBOARD ====================

export const dashboardService = {
  async getKPIs(): Promise<DashboardKPIs> {
    const [
      clientsCount,
      projectsActive,
      projectsCompleted,
      upcomingEvents,
      monthlyBalance
    ] = await Promise.all([
      executeSelectFirst<{ count: number }>('SELECT COUNT(*) as count FROM clients'),
      executeSelectFirst<{ count: number }>('SELECT COUNT(*) as count FROM projects WHERE status = "em_andamento"'),
      executeSelectFirst<{ count: number }>('SELECT COUNT(*) as count FROM projects WHERE status = "concluido"'),
      executeSelectFirst<{ count: number }>(
        `SELECT COUNT(*) as count FROM events 
         WHERE DATE(data_inicio) BETWEEN DATE('now') AND DATE('now', '+7 days')`
      ),
      cashflowService.getMonthlyBalance()
    ]);
    
    return {
      totalClientes: clientsCount?.count || 0,
      projetosAtivos: projectsActive?.count || 0,
      projetosConcluidos: projectsCompleted?.count || 0,
      proximosEventos: upcomingEvents?.count || 0,
      saldoMesAtual: monthlyBalance.saldo,
      totalEntradas: monthlyBalance.entradas,
      totalSaidas: monthlyBalance.saidas
    };
  },

  async getRecentItems(): Promise<{
    projects: Project[];
    events: Event[];
    cashflow: Cashflow[];
  }> {
    const [projects, events, cashflow] = await Promise.all([
      executeSelect<Project>(
        `SELECT p.*, c.nome as client_name 
         FROM projects p 
         LEFT JOIN clients c ON p.cliente_id = c.id 
         ORDER BY p.created_at DESC 
         LIMIT 5`
      ),
      executeSelect<Event>(
        `SELECT e.*, p.titulo as project_title, c.nome as client_name 
         FROM events e 
         LEFT JOIN projects p ON e.projeto_id = p.id 
         LEFT JOIN clients c ON e.cliente_id = c.id 
         ORDER BY e.created_at DESC 
         LIMIT 5`
      ),
      executeSelect<Cashflow>(
        `SELECT cf.*, p.titulo as project_title, c.nome as client_name 
         FROM cashflow cf 
         LEFT JOIN projects p ON cf.projeto_id = p.id 
         LEFT JOIN clients c ON cf.cliente_id = c.id 
         ORDER BY cf.created_at DESC 
         LIMIT 5`
      )
    ]);
    
    return { projects, events, cashflow };
  }
};

// ==================== BUSCA GLOBAL ====================

export const searchService = {
  async globalSearch(query: string): Promise<GlobalSearchResult[]> {
    const results: GlobalSearchResult[] = [];
    
    // Buscar clientes
    const clients = await executeSelect<Client>(
      'SELECT * FROM clients WHERE nome LIKE ? OR email LIKE ? OR empresa LIKE ? LIMIT 5',
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    
    clients.forEach(client => {
      results.push({
        type: 'client',
        id: client.id,
        title: client.nome,
        subtitle: client.empresa || client.email,
        data: client
      });
    });
    
    // Buscar projetos
    const projects = await executeSelect<Project>(
      'SELECT * FROM projects WHERE titulo LIKE ? OR descricao LIKE ? LIMIT 5',
      [`%${query}%`, `%${query}%`]
    );
    
    projects.forEach(project => {
      results.push({
        type: 'project',
        id: project.id,
        title: project.titulo,
        subtitle: project.status,
        data: project
      });
    });
    
    // Buscar eventos
    const events = await executeSelect<Event>(
      'SELECT * FROM events WHERE titulo LIKE ? OR descricao LIKE ? LIMIT 5',
      [`%${query}%`, `%${query}%`]
    );
    
    events.forEach(event => {
      results.push({
        type: 'event',
        id: event.id,
        title: event.titulo,
        subtitle: format(new Date(event.data_inicio), 'dd/MM/yyyy'),
        data: event
      });
    });
    
    // Buscar lançamentos
    const cashflow = await executeSelect<Cashflow>(
      'SELECT * FROM cashflow WHERE descricao LIKE ? LIMIT 5',
      [`%${query}%`]
    );
    
    cashflow.forEach(item => {
      results.push({
        type: 'cashflow',
        id: item.id,
        title: item.descricao || `${item.tipo} - ${item.categoria}`,
        subtitle: `R$ ${item.valor.toFixed(2)}`,
        data: item
      });
    });
    
    return results;
  }
};