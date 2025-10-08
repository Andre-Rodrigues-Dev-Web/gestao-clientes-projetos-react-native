import { executeQuery, executeSelect, executeTransaction } from './config';

export interface Migration {
  version: number;
  name: string;
  up: string[];
  down: string[];
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: [
      // Tabela de clientes
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        telefone TEXT NOT NULL,
        empresa TEXT,
        observacoes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabela de projetos
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        cliente_id INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'pausado')),
        inicio_previsto DATE,
        fim_previsto DATE,
        custo_estimado REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clients (id) ON DELETE CASCADE
      )`,
      
      // Tabela de eventos
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data_inicio DATETIME NOT NULL,
        data_fim DATETIME,
        local TEXT,
        tipo TEXT NOT NULL CHECK (tipo IN ('reuniao', 'entrega', 'cobranca', 'outro')),
        projeto_id INTEGER,
        cliente_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projeto_id) REFERENCES projects (id) ON DELETE SET NULL,
        FOREIGN KEY (cliente_id) REFERENCES clients (id) ON DELETE SET NULL
      )`,
      
      // Tabela de controle de caixa
      `CREATE TABLE IF NOT EXISTS cashflow (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
        valor REAL NOT NULL,
        categoria TEXT NOT NULL CHECK (categoria IN ('servico', 'licenca', 'infra', 'marketing', 'outros')),
        descricao TEXT,
        data DATE NOT NULL,
        projeto_id INTEGER,
        cliente_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (projeto_id) REFERENCES projects (id) ON DELETE SET NULL,
        FOREIGN KEY (cliente_id) REFERENCES clients (id) ON DELETE SET NULL
      )`,
      
      // Tabela para controle de versões das migrations
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Índices para performance
      `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_cliente_id ON projects (cliente_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_data_inicio ON events (data_inicio)`,
      `CREATE INDEX IF NOT EXISTS idx_events_projeto_id ON events (projeto_id)`,
      `CREATE INDEX IF NOT EXISTS idx_events_cliente_id ON events (cliente_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cashflow_data ON cashflow (data)`,
      `CREATE INDEX IF NOT EXISTS idx_cashflow_tipo ON cashflow (tipo)`,
      `CREATE INDEX IF NOT EXISTS idx_cashflow_categoria ON cashflow (categoria)`,
      `CREATE INDEX IF NOT EXISTS idx_cashflow_projeto_id ON cashflow (projeto_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cashflow_cliente_id ON cashflow (cliente_id)`,
      
      // Triggers para atualizar updated_at automaticamente
      `CREATE TRIGGER IF NOT EXISTS update_clients_updated_at 
       AFTER UPDATE ON clients
       BEGIN
         UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
       
      `CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
       AFTER UPDATE ON projects
       BEGIN
         UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
       
      `CREATE TRIGGER IF NOT EXISTS update_events_updated_at 
       AFTER UPDATE ON events
       BEGIN
         UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
       
      `CREATE TRIGGER IF NOT EXISTS update_cashflow_updated_at 
       AFTER UPDATE ON cashflow
       BEGIN
         UPDATE cashflow SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,
    ],
    down: [
      'DROP TRIGGER IF EXISTS update_cashflow_updated_at',
      'DROP TRIGGER IF EXISTS update_events_updated_at',
      'DROP TRIGGER IF EXISTS update_projects_updated_at',
      'DROP TRIGGER IF EXISTS update_clients_updated_at',
      'DROP INDEX IF EXISTS idx_cashflow_cliente_id',
      'DROP INDEX IF EXISTS idx_cashflow_projeto_id',
      'DROP INDEX IF EXISTS idx_cashflow_categoria',
      'DROP INDEX IF EXISTS idx_cashflow_tipo',
      'DROP INDEX IF EXISTS idx_cashflow_data',
      'DROP INDEX IF EXISTS idx_events_cliente_id',
      'DROP INDEX IF EXISTS idx_events_projeto_id',
      'DROP INDEX IF EXISTS idx_events_data_inicio',
      'DROP INDEX IF EXISTS idx_projects_cliente_id',
      'DROP INDEX IF EXISTS idx_projects_status',
      'DROP TABLE IF EXISTS cashflow',
      'DROP TABLE IF EXISTS events',
      'DROP TABLE IF EXISTS projects',
      'DROP TABLE IF EXISTS clients',
      'DROP TABLE IF EXISTS schema_migrations',
    ],
  },
];

export const getCurrentVersion = async (): Promise<number> => {
  try {
    const result = await executeSelect<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_migrations'
    );
    return result[0]?.version || 0;
  } catch (error) {
    // Se a tabela não existir, retorna 0
    return 0;
  }
};

export const runMigrations = async (): Promise<void> => {
  console.log('🔄 Iniciando migrations...');
  
  try {
    const currentVersion = await getCurrentVersion();
    console.log(`📊 Versão atual do banco: ${currentVersion}`);
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Banco de dados já está atualizado');
      return;
    }
    
    console.log(`🔄 Executando ${pendingMigrations.length} migration(s)...`);
    
    for (const migration of pendingMigrations) {
      console.log(`🔄 Executando migration ${migration.version}: ${migration.name}`);
      
      const queries = migration.up.map(query => ({ query }));
      queries.push({
        query: 'INSERT INTO schema_migrations (version) VALUES (?)',
        params: [migration.version]
      });
      
      await executeTransaction(queries);
      console.log(`✅ Migration ${migration.version} executada com sucesso`);
    }
    
    console.log('✅ Todas as migrations foram executadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    throw error;
  }
};

export const rollbackMigration = async (targetVersion: number): Promise<void> => {
  console.log(`🔄 Fazendo rollback para versão ${targetVersion}...`);
  
  try {
    const currentVersion = await getCurrentVersion();
    
    if (currentVersion <= targetVersion) {
      console.log('✅ Já está na versão desejada ou anterior');
      return;
    }
    
    const migrationsToRollback = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Ordem decrescente
    
    for (const migration of migrationsToRollback) {
      console.log(`🔄 Fazendo rollback da migration ${migration.version}: ${migration.name}`);
      
      const queries = migration.down.map(query => ({ query }));
      queries.push({
        query: 'DELETE FROM schema_migrations WHERE version = ?',
        params: [migration.version]
      });
      
      await executeTransaction(queries);
      console.log(`✅ Rollback da migration ${migration.version} executado com sucesso`);
    }
    
    console.log('✅ Rollback executado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao fazer rollback:', error);
    throw error;
  }
};