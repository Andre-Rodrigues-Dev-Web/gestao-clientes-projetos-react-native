export * from './config';
export * from './migrations';
export * from './seed';
export * from './services';

import { runMigrations } from './migrations';
import { seedDatabase } from './seed';

export const initializeDatabase = async (): Promise<void> => {
  console.log('🔄 Inicializando banco de dados...');
  
  try {
    await runMigrations();
    await seedDatabase();
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};