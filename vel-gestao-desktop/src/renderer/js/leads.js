class LeadsModule {
    constructor() {
        this.leads = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: 'all',
            source: 'all',
            priority: 'all'
        };
        this.currentLead = null;
    }

    async init() {
        console.log('Inicializando módulo de leads...');
        await this.loadLeads();
        this.setupEventListeners();
        this.updateStats();
        this.renderLeads();
    }

    async loadLeads() {
        try {
            this.leads = await window.api.leads.getAll();
            this.updatePagination();
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
            window.showError('Erro ao carregar leads');
        }
    }

    setupEventListeners() {
        // Botão adicionar lead
        const addLeadBtn = document.getElementById('addLeadBtn');
        if (addLeadBtn) {
            addLeadBtn.addEventListener('click', () => this.showLeadForm());
        }

        // Busca
        const searchInput = document.getElementById('leadsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderLeads();
            }, 300));
        }

        // Filtros
        const statusFilter = document.getElementById('leadsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderLeads();
            });
        }

        const sourceFilter = document.getElementById('leadsSourceFilter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.filters.source = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderLeads();
            });
        }

        const priorityFilter = document.getElementById('leadsPriorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.filters.priority = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderLeads();
            });
        }

        // Formulário
        const leadForm = document.getElementById('leadForm');
        if (leadForm) {
            leadForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelLeadBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideLeadForm());
        }
    }

    filterAndRenderLeads() {
        this.updateStats();
        this.renderLeads();
    }

    getFilteredLeads() {
        let filtered = [...this.leads];

        // Filtro de busca
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(lead => 
                lead.name.toLowerCase().includes(search) ||
                lead.email?.toLowerCase().includes(search) ||
                lead.phone?.toLowerCase().includes(search) ||
                lead.company?.toLowerCase().includes(search)
            );
        }

        // Filtro de status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(lead => lead.status === this.filters.status);
        }

        // Filtro de origem
        if (this.filters.source !== 'all') {
            filtered = filtered.filter(lead => lead.source === this.filters.source);
        }

        // Filtro de prioridade
        if (this.filters.priority !== 'all') {
            filtered = filtered.filter(lead => lead.priority === this.filters.priority);
        }

        return filtered;
    }

    updateStats() {
        const filtered = this.getFilteredLeads();
        
        const stats = {
            total: filtered.length,
            new: filtered.filter(l => l.status === 'new').length,
            contacted: filtered.filter(l => l.status === 'contacted').length,
            qualified: filtered.filter(l => l.status === 'qualified').length,
            converted: filtered.filter(l => l.status === 'converted').length,
            lost: filtered.filter(l => l.status === 'lost').length
        };

        // Atualizar elementos do DOM
        const elements = {
            totalLeadsCount: stats.total,
            newLeadsCount: stats.new,
            qualifiedLeadsCount: stats.qualified,
            convertedLeadsCount: stats.converted
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Calcular taxa de conversão
        const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : 0;
        const conversionElement = document.getElementById('conversionRate');
        if (conversionElement) conversionElement.textContent = `${conversionRate}%`;
    }

    updatePagination() {
        const filtered = this.getFilteredLeads();
        this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    renderLeads() {
        const container = document.getElementById('leadsList');
        if (!container) return;

        const filtered = this.getFilteredLeads();
        this.updatePagination();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <h3>Nenhum lead encontrado</h3>
                    <p>Não há leads que correspondam aos filtros selecionados.</p>
                </div>
            `;
            return;
        }

        // Paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLeads = filtered.slice(startIndex, endIndex);

        const leadsHtml = paginatedLeads.map(lead => {
            const createdDate = new Date(lead.created_at);
            const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
            
            return `
                <tr class="lead-row ${lead.priority}">
                    <td>
                        <div class="lead-info">
                            <div class="lead-name">${lead.name}</div>
                            ${lead.company ? `<div class="lead-company">${lead.company}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="contact-info">
                            ${lead.email ? `<div class="lead-email"><i class="fas fa-envelope"></i> ${lead.email}</div>` : ''}
                            ${lead.phone ? `<div class="lead-phone"><i class="fas fa-phone"></i> ${Utils.formatPhone(lead.phone)}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="source-badge ${lead.source.toLowerCase().replace(/\s+/g, '-')}">
                            ${this.getSourceLabel(lead.source)}
                        </span>
                    </td>
                    <td>
                        <span class="priority-badge ${lead.priority}">
                            ${this.getPriorityLabel(lead.priority)}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${lead.status}">
                            ${this.getStatusLabel(lead.status)}
                        </span>
                    </td>
                    <td>
                        <div class="lead-date">
                            <div>${Utils.formatDate(lead.created_at)}</div>
                            <div class="days-ago">${daysSinceCreated} dias atrás</div>
                        </div>
                    </td>
                    <td class="actions">
                        <button class="btn-icon" onclick="leadsModule.viewLead(${lead.id})" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="leadsModule.editLead(${lead.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${lead.status !== 'converted' ? `
                            <button class="btn-icon success" onclick="leadsModule.convertLead(${lead.id})" title="Converter">
                                <i class="fas fa-user-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon danger" onclick="leadsModule.deleteLead(${lead.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Lead</th>
                            <th>Contato</th>
                            <th>Origem</th>
                            <th>Prioridade</th>
                            <th>Status</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leadsHtml}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    }

    renderPagination() {
        if (this.totalPages <= 1) return '';

        let paginationHtml = '<div class="pagination">';
        
        // Botão anterior
        if (this.currentPage > 1) {
            paginationHtml += `<button class="pagination-btn" onclick="leadsModule.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Números das páginas
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHtml += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHtml += `<button class="pagination-btn" onclick="leadsModule.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < this.totalPages) {
            paginationHtml += `<button class="pagination-btn" onclick="leadsModule.goToPage(${this.currentPage + 1})">Próximo</button>`;
        }

        paginationHtml += '</div>';
        return paginationHtml;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderLeads();
    }

    getStatusLabel(status) {
        const labels = {
            new: 'Novo',
            contacted: 'Contatado',
            qualified: 'Qualificado',
            proposal: 'Proposta',
            negotiation: 'Negociação',
            converted: 'Convertido',
            lost: 'Perdido'
        };
        return labels[status] || status;
    }

    getSourceLabel(source) {
        const labels = {
            website: 'Website',
            social_media: 'Redes Sociais',
            email_marketing: 'Email Marketing',
            referral: 'Indicação',
            cold_call: 'Cold Call',
            event: 'Evento',
            advertisement: 'Anúncio',
            other: 'Outros'
        };
        return labels[source] || source;
    }

    getPriorityLabel(priority) {
        const labels = {
            low: 'Baixa',
            medium: 'Média',
            high: 'Alta',
            urgent: 'Urgente'
        };
        return labels[priority] || priority;
    }

    showLeadForm(lead = null) {
        this.currentLead = lead;
        const modal = document.getElementById('leadModal');
        const title = document.getElementById('leadModalTitle');
        const form = document.getElementById('leadForm');

        if (lead) {
            title.textContent = 'Editar Lead';
            this.populateForm(lead);
        } else {
            title.textContent = 'Novo Lead';
            form.reset();
        }

        modal.style.display = 'block';
    }

    hideLeadForm() {
        const modal = document.getElementById('leadModal');
        modal.style.display = 'none';
        this.currentLead = null;
    }

    populateForm(lead) {
        document.getElementById('leadName').value = lead.name || '';
        document.getElementById('leadEmail').value = lead.email || '';
        document.getElementById('leadPhone').value = lead.phone || '';
        document.getElementById('leadCompany').value = lead.company || '';
        document.getElementById('leadSource').value = lead.source || '';
        document.getElementById('leadStatus').value = lead.status || 'new';
        document.getElementById('leadPriority').value = lead.priority || 'medium';
        document.getElementById('leadNotes').value = lead.notes || '';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leadData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            source: formData.get('source'),
            status: formData.get('status'),
            priority: formData.get('priority'),
            notes: formData.get('notes')
        };

        // Validação
        if (!leadData.name) {
            window.showError('Por favor, informe o nome do lead.');
            return;
        }

        if (!leadData.email && !leadData.phone) {
            window.showError('Por favor, informe pelo menos um meio de contato (email ou telefone).');
            return;
        }

        // Validar email se fornecido
        if (leadData.email && !Utils.isValidEmail(leadData.email)) {
            window.showError('Por favor, informe um email válido.');
            return;
        }

        try {
            if (this.currentLead) {
                await window.api.leads.update(this.currentLead.id, leadData);
                window.showSuccess('Lead atualizado com sucesso!');
            } else {
                await window.api.leads.create(leadData);
                window.showSuccess('Lead criado com sucesso!');
            }

            this.hideLeadForm();
            await this.loadLeads();
            this.filterAndRenderLeads();
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            window.showError('Erro ao salvar lead');
        }
    }

    async viewLead(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;

        const createdDate = new Date(lead.created_at);
        const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

        const content = `
            <div class="lead-details">
                <h3>${lead.name}</h3>
                <div class="detail-grid">
                    ${lead.company ? `
                        <div class="detail-item">
                            <label>Empresa:</label>
                            <span>${lead.company}</span>
                        </div>
                    ` : ''}
                    ${lead.email ? `
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${lead.email}</span>
                        </div>
                    ` : ''}
                    ${lead.phone ? `
                        <div class="detail-item">
                            <label>Telefone:</label>
                            <span>${Utils.formatPhone(lead.phone)}</span>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <label>Origem:</label>
                        <span class="source-badge ${lead.source.toLowerCase().replace(/\s+/g, '-')}">${this.getSourceLabel(lead.source)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${lead.status}">${this.getStatusLabel(lead.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Prioridade:</label>
                        <span class="priority-badge ${lead.priority}">${this.getPriorityLabel(lead.priority)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Criado em:</label>
                        <span>${Utils.formatDate(lead.created_at)} (${daysSinceCreated} dias atrás)</span>
                    </div>
                    ${lead.notes ? `
                        <div class="detail-item full-width">
                            <label>Observações:</label>
                            <p>${lead.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        window.showModal('Detalhes do Lead', content);
    }

    async editLead(id) {
        const lead = this.leads.find(l => l.id === id);
        if (lead) {
            this.showLeadForm(lead);
        }
    }

    async convertLead(id) {
        if (confirm('Converter este lead em cliente? Esta ação criará um novo cliente com os dados do lead.')) {
            try {
                const lead = this.leads.find(l => l.id === id);
                if (!lead) return;

                // Criar cliente com dados do lead
                const clientData = {
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    company: lead.company,
                    type: lead.company ? 'juridica' : 'fisica',
                    status: 'active',
                    notes: `Convertido do lead em ${Utils.formatDate(new Date())}\n\nObservações do lead:\n${lead.notes || 'Nenhuma observação'}`
                };

                await window.api.clients.create(clientData);
                
                // Atualizar status do lead
                await window.api.leads.update(id, { status: 'converted' });
                
                window.showSuccess('Lead convertido em cliente com sucesso!');
                await this.loadLeads();
                this.filterAndRenderLeads();
            } catch (error) {
                console.error('Erro ao converter lead:', error);
                window.showError('Erro ao converter lead');
            }
        }
    }

    async deleteLead(id) {
        if (confirm('Tem certeza que deseja excluir este lead?')) {
            try {
                await window.api.leads.delete(id);
                window.showSuccess('Lead excluído com sucesso!');
                await this.loadLeads();
                this.filterAndRenderLeads();
            } catch (error) {
                console.error('Erro ao excluir lead:', error);
                window.showError('Erro ao excluir lead');
            }
        }
    }
}

// Instância global
const leadsModule = new LeadsModule();