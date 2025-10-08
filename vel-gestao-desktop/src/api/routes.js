const { getDatabase } = require('../database/database');
const { ipcMain } = require('electron');

function setupAPIRoutes() {
  // ==================== CLIENTES ====================
  
  // Listar todos os clientes
  ipcMain.handle('clients:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM clients ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Buscar cliente por ID
  ipcMain.handle('clients:getById', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });

  // Criar novo cliente
  ipcMain.handle('clients:create', async (event, client) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO clients (name, email, phone, company, address, city, state, zip_code, notes, status) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [client.name, client.email, client.phone, client.company, client.address, 
                     client.city, client.state, client.zip_code, client.notes, client.status || 'active'];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...client });
      });
    });
  });

  // Atualizar cliente
  ipcMain.handle('clients:update', async (event, id, client) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, address = ?, 
                   city = ?, state = ?, zip_code = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`;
      const params = [client.name, client.email, client.phone, client.company, client.address,
                     client.city, client.state, client.zip_code, client.notes, client.status, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...client });
      });
    });
  });

  // Deletar cliente
  ipcMain.handle('clients:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });

  // ==================== PROJETOS ====================
  
  // Listar todos os projetos
  ipcMain.handle('projects:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `SELECT p.*, c.name as client_name 
                   FROM projects p 
                   LEFT JOIN clients c ON p.client_id = c.id 
                   ORDER BY p.created_at DESC`;
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Criar novo projeto
  ipcMain.handle('projects:create', async (event, project) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO projects (name, description, client_id, status, priority, start_date, end_date, budget, progress) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [project.name, project.description, project.client_id, project.status || 'planning',
                     project.priority || 'medium', project.start_date, project.end_date, project.budget, project.progress || 0];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...project });
      });
    });
  });

  // Atualizar projeto
  ipcMain.handle('projects:update', async (event, id, project) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE projects SET name = ?, description = ?, client_id = ?, status = ?, priority = ?, 
                   start_date = ?, end_date = ?, budget = ?, progress = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`;
      const params = [project.name, project.description, project.client_id, project.status, project.priority,
                     project.start_date, project.end_date, project.budget, project.progress, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...project });
      });
    });
  });

  // Deletar projeto
  ipcMain.handle('projects:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });

  // ==================== CONTAS A PAGAR ====================
  
  // Listar todas as contas
  ipcMain.handle('bills:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bills ORDER BY due_date', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Criar nova conta
  ipcMain.handle('bills:create', async (event, bill) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO bills (description, amount, due_date, category, supplier, status, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const params = [bill.description, bill.amount, bill.due_date, bill.category, bill.supplier, 
                     bill.status || 'pending', bill.notes];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...bill });
      });
    });
  });

  // Atualizar conta
  ipcMain.handle('bills:update', async (event, id, bill) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE bills SET description = ?, amount = ?, due_date = ?, category = ?, supplier = ?, 
                   status = ?, payment_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`;
      const params = [bill.description, bill.amount, bill.due_date, bill.category, bill.supplier,
                     bill.status, bill.payment_date, bill.notes, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...bill });
      });
    });
  });

  // Deletar conta
  ipcMain.handle('bills:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM bills WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });

  // ==================== REUNIÕES ====================
  
  // Listar todas as reuniões
  ipcMain.handle('meetings:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `SELECT m.*, c.name as client_name, p.name as project_name 
                   FROM meetings m 
                   LEFT JOIN clients c ON m.client_id = c.id 
                   LEFT JOIN projects p ON m.project_id = p.id 
                   ORDER BY m.meeting_date`;
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Criar nova reunião
  ipcMain.handle('meetings:create', async (event, meeting) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO meetings (title, description, client_id, project_id, meeting_date, duration, location, meeting_type, status, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [meeting.title, meeting.description, meeting.client_id, meeting.project_id, meeting.meeting_date,
                     meeting.duration || 60, meeting.location, meeting.meeting_type || 'presencial', 
                     meeting.status || 'scheduled', meeting.notes];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...meeting });
      });
    });
  });

  // Atualizar reunião
  ipcMain.handle('meetings:update', async (event, id, meeting) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE meetings SET title = ?, description = ?, client_id = ?, project_id = ?, meeting_date = ?, 
                   duration = ?, location = ?, meeting_type = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`;
      const params = [meeting.title, meeting.description, meeting.client_id, meeting.project_id, meeting.meeting_date,
                     meeting.duration, meeting.location, meeting.meeting_type, meeting.status, meeting.notes, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...meeting });
      });
    });
  });

  // Deletar reunião
  ipcMain.handle('meetings:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM meetings WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });

  // ==================== CAMPANHAS DE MARKETING ====================
  
  // Listar todas as campanhas
  ipcMain.handle('campaigns:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM marketing_campaigns ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Criar nova campanha
  ipcMain.handle('campaigns:create', async (event, campaign) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO marketing_campaigns (name, description, type, target_audience, budget, start_date, end_date, status, objectives, leads_generated, revenue, spent) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [campaign.name, campaign.description, campaign.type, campaign.target_audience, campaign.budget,
                     campaign.start_date, campaign.end_date, campaign.status || 'planned', campaign.objectives, 
                     campaign.leads_generated || 0, campaign.revenue || 0, campaign.spent || 0];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...campaign });
      });
    });
  });

  // Atualizar campanha
  ipcMain.handle('campaigns:update', async (event, id, campaign) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE marketing_campaigns SET name = ?, description = ?, type = ?, target_audience = ?, 
                   budget = ?, start_date = ?, end_date = ?, status = ?, objectives = ?, leads_generated = ?, 
                   revenue = ?, spent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const params = [campaign.name, campaign.description, campaign.type, campaign.target_audience, campaign.budget,
                     campaign.start_date, campaign.end_date, campaign.status, campaign.objectives, 
                     campaign.leads_generated || 0, campaign.revenue || 0, campaign.spent || 0, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...campaign });
      });
    });
  });

  // Deletar campanha
  ipcMain.handle('campaigns:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM marketing_campaigns WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });

  // ==================== LEADS ====================
  
  // Listar todos os leads
  ipcMain.handle('leads:getAll', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM leads ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // Criar novo lead
  ipcMain.handle('leads:create', async (event, lead) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO leads (name, email, phone, company, source, status, interest_level, notes, assigned_to, last_contact, next_followup) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status || 'new',
                     lead.interest_level || 'medium', lead.notes, lead.assigned_to, lead.last_contact, lead.next_followup];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...lead });
      });
    });
  });

  // Atualizar lead
  ipcMain.handle('leads:update', async (event, id, lead) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      const sql = `UPDATE leads SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, 
                   interest_level = ?, notes = ?, assigned_to = ?, last_contact = ?, next_followup = ?, 
                   updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const params = [lead.name, lead.email, lead.phone, lead.company, lead.source, lead.status,
                     lead.interest_level, lead.notes, lead.assigned_to, lead.last_contact, lead.next_followup, id];
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id, ...lead });
      });
    });
  });

  // Deletar lead
  ipcMain.handle('leads:delete', async (event, id) => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM leads WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  });
}

module.exports = { setupAPIRoutes };