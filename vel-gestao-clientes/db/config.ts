import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'gestao_clientes.db';
export const DB_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('✅ Banco de dados conectado com sucesso');
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('✅ Banco de dados fechado');
  }
};

export const executeQuery = async (
  query: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult> => {
  const database = await getDatabase();
  try {
    const result = await database.runAsync(query, params);
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar query:', query, error);
    throw error;
  }
};

export const executeSelect = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const database = await getDatabase();
  try {
    const result = await database.getAllAsync(query, params);
    return result as T[];
  } catch (error) {
    console.error('❌ Erro ao executar select:', query, error);
    throw error;
  }
};

export const executeSelectFirst = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> => {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync(query, params);
    return result as T | null;
  } catch (error) {
    console.error('❌ Erro ao executar select first:', query, error);
    throw error;
  }
};

// Função para executar transações
export const executeTransaction = async (
  queries: Array<{ query: string; params?: any[] }>
): Promise<void> => {
  const database = await getDatabase();
  try {
    await database.withTransactionAsync(async () => {
      for (const { query, params = [] } of queries) {
        await database.runAsync(query, params);
      }
    });
    console.log('✅ Transação executada com sucesso');
  } catch (error) {
    console.error('❌ Erro na transação:', error);
    throw error;
  }
};