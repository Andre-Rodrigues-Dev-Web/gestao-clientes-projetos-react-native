import { executeQuery, executeSelect } from './config';
import { format, subDays, addDays, startOfMonth, endOfMonth } from 'date-fns';

const generateRandomDate = (start: Date, end: Date): string => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return format(new Date(randomTime), 'yyyy-MM-dd');
};

const generateRandomDateTime = (start: Date, end: Date): string => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return format(new Date(randomTime), 'yyyy-MM-dd HH:mm:ss');
};

const clientsData = [
  {
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1111',
    empresa: 'Silva & Associados',
    observacoes: 'Cliente desde 2020, sempre pontual nos pagamentos'
  },
  {
    nome: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    telefone: '(11) 99999-2222',
    empresa: 'Santos Consultoria',
    observacoes: 'Especialista em marketing digital'
  },
  {
    nome: 'Pedro Oliveira',
    email: 'pedro@oliveira.com.br',
    telefone: '(11) 99999-3333',
    empresa: 'Oliveira Tech',
    observacoes: 'Startup de tecnologia em crescimento'
  },
  {
    nome: 'Ana Costa',
    email: 'ana.costa@gmail.com',
    telefone: '(11) 99999-4444',
    empresa: 'Costa Design',
    observacoes: 'Designer freelancer, projetos criativos'
  },
  {
    nome: 'Carlos Ferreira',
    email: 'carlos@ferreira.com',
    telefone: '(11) 99999-5555',
    empresa: 'Ferreira Advocacia',
    observacoes: 'Escritório de advocacia empresarial'
  },
  {
    nome: 'Lucia Mendes',
    email: 'lucia.mendes@email.com',
    telefone: '(11) 99999-6666',
    empresa: 'Mendes Contabilidade',
    observacoes: 'Contadora experiente, atende PMEs'
  },
  {
    nome: 'Roberto Lima',
    email: 'roberto@lima.com.br',
    telefone: '(11) 99999-7777',
    empresa: 'Lima Engenharia',
    observacoes: 'Engenheiro civil, projetos residenciais'
  },
  {
    nome: 'Fernanda Rocha',
    email: 'fernanda.rocha@empresa.com',
    telefone: '(11) 99999-8888',
    empresa: 'Rocha Marketing',
    observacoes: 'Agência de marketing e publicidade'
  },
  {
    nome: 'Marcos Alves',
    email: 'marcos@alves.com',
    telefone: '(11) 99999-9999',
    empresa: 'Alves Desenvolvimento',
    observacoes: 'Desenvolvedor de software, foco em mobile'
  },
  {
    nome: 'Patricia Souza',
    email: 'patricia.souza@gmail.com',
    telefone: '(11) 99999-0000',
    empresa: 'Souza Arquitetura',
    observacoes: 'Arquiteta especializada em interiores'
  }
];

const projectsData = [
  {
    titulo: 'Website Institucional Silva & Associados',
    descricao: 'Desenvolvimento de website institucional com área administrativa',
    status: 'concluido',
    custo_estimado: 8500.00
  },
  {
    titulo: 'Sistema de Gestão Santos Consultoria',
    descricao: 'Sistema web para gestão de clientes e projetos',
    status: 'em_andamento',
    custo_estimado: 15000.00
  },
  {
    titulo: 'App Mobile Oliveira Tech',
    descricao: 'Aplicativo mobile para gestão de tarefas',
    status: 'em_andamento',
    custo_estimado: 25000.00
  },
  {
    titulo: 'Identidade Visual Costa Design',
    descricao: 'Criação de identidade visual e material gráfico',
    status: 'concluido',
    custo_estimado: 3500.00
  },
  {
    titulo: 'Portal Jurídico Ferreira',
    descricao: 'Portal para consulta de processos e documentos',
    status: 'planejado',
    custo_estimado: 12000.00
  },
  {
    titulo: 'Sistema Contábil Mendes',
    descricao: 'Sistema para gestão contábil e fiscal',
    status: 'em_andamento',
    custo_estimado: 18000.00
  },
  {
    titulo: 'Website Lima Engenharia',
    descricao: 'Site institucional com portfólio de projetos',
    status: 'concluido',
    custo_estimado: 6000.00
  },
  {
    titulo: 'Campanha Digital Rocha Marketing',
    descricao: 'Desenvolvimento de landing pages para campanhas',
    status: 'em_andamento',
    custo_estimado: 4500.00
  },
  {
    titulo: 'App Delivery Alves',
    descricao: 'Aplicativo de delivery para restaurantes',
    status: 'pausado',
    custo_estimado: 30000.00
  },
  {
    titulo: 'Sistema de Orçamentos Souza',
    descricao: 'Sistema para criação e gestão de orçamentos',
    status: 'planejado',
    custo_estimado: 9500.00
  },
  {
    titulo: 'E-commerce Silva & Associados',
    descricao: 'Loja virtual para venda de produtos jurídicos',
    status: 'planejado',
    custo_estimado: 20000.00
  },
  {
    titulo: 'Dashboard Analytics Santos',
    descricao: 'Dashboard para análise de dados de marketing',
    status: 'em_andamento',
    custo_estimado: 7500.00
  },
  {
    titulo: 'Sistema ERP Oliveira Tech',
    descricao: 'Sistema integrado de gestão empresarial',
    status: 'planejado',
    custo_estimado: 45000.00
  },
  {
    titulo: 'Redesign Costa Design',
    descricao: 'Redesign completo do website da empresa',
    status: 'concluido',
    custo_estimado: 5500.00
  },
  {
    titulo: 'Automação Ferreira Advocacia',
    descricao: 'Automação de processos jurídicos',
    status: 'em_andamento',
    custo_estimado: 22000.00
  }
];

export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  try {
    // Verificar se já existem dados
    const existingClients = await executeSelect('SELECT COUNT(*) as count FROM clients');
    if (existingClients[0].count > 0) {
      console.log('✅ Banco já possui dados, pulando seed');
      return;
    }
    
    console.log('🔄 Inserindo clientes...');
    // Inserir clientes
    for (const client of clientsData) {
      await executeQuery(
        `INSERT INTO clients (nome, email, telefone, empresa, observacoes) 
         VALUES (?, ?, ?, ?, ?)`,
        [client.nome, client.email, client.telefone, client.empresa, client.observacoes]
      );
    }
    
    console.log('🔄 Inserindo projetos...');
    // Inserir projetos
    for (let i = 0; i < projectsData.length; i++) {
      const project = projectsData[i];
      const clientId = (i % clientsData.length) + 1; // Distribuir projetos entre clientes
      
      const inicioDate = generateRandomDate(subDays(new Date(), 180), new Date());
      const fimDate = generateRandomDate(new Date(), addDays(new Date(), 90));
      
      await executeQuery(
        `INSERT INTO projects (titulo, descricao, cliente_id, status, inicio_previsto, fim_previsto, custo_estimado) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          project.titulo,
          project.descricao,
          clientId,
          project.status,
          inicioDate,
          fimDate,
          project.custo_estimado
        ]
      );
    }
    
    console.log('🔄 Inserindo eventos...');
    // Inserir eventos
    const eventTypes = ['reuniao', 'entrega', 'cobranca', 'outro'];
    const eventTitles = [
      'Reunião de Kickoff',
      'Apresentação do Protótipo',
      'Entrega da Primeira Versão',
      'Reunião de Feedback',
      'Entrega Final',
      'Cobrança Mensal',
      'Reunião de Planejamento',
      'Workshop de Treinamento',
      'Apresentação de Resultados',
      'Reunião de Acompanhamento'
    ];
    
    for (let i = 0; i < 20; i++) {
      const projectId = Math.floor(Math.random() * projectsData.length) + 1;
      const clientId = Math.floor(Math.random() * clientsData.length) + 1;
      const tipo = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const titulo = eventTitles[Math.floor(Math.random() * eventTitles.length)];
      
      const dataInicio = generateRandomDateTime(subDays(new Date(), 30), addDays(new Date(), 30));
      const dataFim = generateRandomDateTime(new Date(dataInicio), addDays(new Date(dataInicio), 1));
      
      await executeQuery(
        `INSERT INTO events (titulo, descricao, data_inicio, data_fim, local, tipo, projeto_id, cliente_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          titulo,
          `Descrição do evento: ${titulo}`,
          dataInicio,
          dataFim,
          Math.random() > 0.5 ? 'Escritório' : 'Online',
          tipo,
          Math.random() > 0.3 ? projectId : null,
          Math.random() > 0.3 ? clientId : null
        ]
      );
    }
    
    console.log('🔄 Inserindo lançamentos de caixa...');
    // Inserir lançamentos de caixa
    const categorias = ['servico', 'licenca', 'infra', 'marketing', 'outros'];
    const descricoes = {
      entrada: [
        'Pagamento de projeto',
        'Consultoria mensal',
        'Manutenção de sistema',
        'Desenvolvimento de funcionalidade',
        'Treinamento de usuários'
      ],
      saida: [
        'Licença de software',
        'Hospedagem de servidor',
        'Marketing digital',
        'Material de escritório',
        'Equipamentos de TI'
      ]
    };
    
    const startDate = startOfMonth(subDays(new Date(), 90));
    const endDate = endOfMonth(new Date());
    
    for (let i = 0; i < 40; i++) {
      const tipo = Math.random() > 0.6 ? 'entrada' : 'saida';
      const categoria = categorias[Math.floor(Math.random() * categorias.length)];
      const valor = tipo === 'entrada' 
        ? Math.floor(Math.random() * 10000) + 1000 
        : Math.floor(Math.random() * 2000) + 100;
      
      const descricaoOptions = descricoes[tipo];
      const descricao = descricaoOptions[Math.floor(Math.random() * descricaoOptions.length)];
      
      const data = generateRandomDate(startDate, endDate);
      const projectId = Math.floor(Math.random() * projectsData.length) + 1;
      const clientId = Math.floor(Math.random() * clientsData.length) + 1;
      
      await executeQuery(
        `INSERT INTO cashflow (tipo, valor, categoria, descricao, data, projeto_id, cliente_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tipo,
          valor,
          categoria,
          descricao,
          data,
          Math.random() > 0.4 ? projectId : null,
          Math.random() > 0.4 ? clientId : null
        ]
      );
    }
    
    console.log('✅ Seed do banco de dados concluído com sucesso!');
    console.log(`📊 Dados inseridos:`);
    console.log(`   - ${clientsData.length} clientes`);
    console.log(`   - ${projectsData.length} projetos`);
    console.log(`   - 20 eventos`);
    console.log(`   - 40 lançamentos de caixa`);
    
  } catch (error) {
    console.error('❌ Erro ao fazer seed do banco:', error);
    throw error;
  }
};