class CampaignsModule {
    constructor() {
        this.campaigns = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: 'all',
            type: 'all',
            dateRange: 'all'
        };
        this.currentCampaign = null;
    }

    async init() {
        console.log('Inicializando módulo de campanhas...');
        await this.loadCampaigns();
        this.setupEventListeners();
        this.updateStats();
        this.renderCampaigns();
    }

    async loadCampaigns() {
        try {
            this.campaigns = await window.api.campaigns.getAll();
            this.updatePagination();
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error);
            window.showError('Erro ao carregar campanhas');
        }
    }

    setupEventListeners() {
        // Botão adicionar campanha
        const addCampaignBtn = document.getElementById('addCampaignBtn');
        if (addCampaignBtn) {
            addCampaignBtn.addEventListener('click', () => this.showCampaignForm());
        }

        // Busca
        const searchInput = document.getElementById('campaignsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            }, 300));
        }

        // Filtros
        const statusFilter = document.getElementById('campaignsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        const typeFilter = document.getElementById('campaignsTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        const dateRangeFilter = document.getElementById('campaignsDateRangeFilter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        // Formulário
        const campaignForm = document.getElementById('campaignForm');
        if (campaignForm) {
            campaignForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelCampaignBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCampaignForm());
        }
    }

    filterAndRenderCampaigns() {
        this.updateStats();
        this.renderCampaigns();
    }

    getFilteredCampaigns() {
        let filtered = [...this.campaigns];

        // Filtro de busca
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(campaign => 
                campaign.name.toLowerCase().includes(search) ||
                campaign.description?.toLowerCase().includes(search) ||
                campaign.target_audience?.toLowerCase().includes(search)
            );
        }

        // Filtro de status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(campaign => campaign.status === this.filters.status);
        }

        // Filtro de tipo
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(campaign => campaign.type === this.filters.type);
        }

        // Filtro de data
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(campaign => {
                const startDate = new Date(campaign.start_date);
                const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
                
                switch (this.filters.dateRange) {
                    case 'active':
                        return startDate <= today && (!endDate || endDate >= today) && campaign.status === 'active';
                    case 'upcoming':
                        return startDate > today;
                    case 'completed':
                        return endDate && endDate < today;
                    case 'this_month':
                        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                        return startDate >= thisMonth && startDate < nextMonth;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }

    updateStats() {
        const filtered = this.getFilteredCampaigns();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const stats = {
            total: filtered.length,
            active: filtered.filter(c => {
                const startDate = new Date(c.start_date);
                const endDate = c.end_date ? new Date(c.end_date) : null;
                return startDate <= today && (!endDate || endDate >= today) && c.status === 'active';
            }).length,
            completed: filtered.filter(c => c.status === 'completed').length,
            planned: filtered.filter(c => c.status === 'planned').length,
            totalBudget: filtered.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0),
            totalLeads: filtered.reduce((sum, c) => sum + (parseInt(c.leads_generated) || 0), 0)
        };

        // Atualizar elementos do DOM
        const elements = {
            totalCampaignsCount: stats.total,
            activeCampaignsCount: stats.active,
            completedCampaignsCount: stats.completed,
            plannedCampaignsCount: stats.planned,
            totalBudget: Utils.formatCurrency(stats.totalBudget),
            totalLeadsGenerated: stats.totalLeads
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updatePagination() {
        const filtered = this.getFilteredCampaigns();
        this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    renderCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        const filtered = this.getFilteredCampaigns();
        this.updatePagination();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <h3>Nenhuma campanha encontrada</h3>
                    <p>Não há campanhas que correspondam aos filtros selecionados.</p>
                </div>
            `;
            return;
        }

        // Paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedCampaigns = filtered.slice(startIndex, endIndex);

        const campaignsHtml = paginatedCampaigns.map(campaign => {
            const startDate = new Date(campaign.start_date);
            const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
            const now = new Date();
            
            let statusClass = campaign.status;
            let statusIcon = 'fas fa-circle';
            
            // Determinar status visual baseado nas datas
            if (campaign.status === 'active') {
                if (startDate <= now && (!endDate || endDate >= now)) {
                    statusClass = 'active';
                    statusIcon = 'fas fa-play-circle';
                } else if (startDate > now) {
                    statusClass = 'upcoming';
                    statusIcon = 'fas fa-clock';
                } else if (endDate && endDate < now) {
                    statusClass = 'expired';
                    statusIcon = 'fas fa-stop-circle';
                }
            }

            const progress = this.calculateProgress(campaign);
            const roi = this.calculateROI(campaign);

            return `
                <tr class="campaign-row ${statusClass}">
                    <td>
                        <div class="campaign-info">
                            <div class="campaign-name">${campaign.name}</div>
                            <div class="campaign-type">${this.getTypeLabel(campaign.type)}</div>
                        </div>
                    </td>
                    <td>
                        <div class="campaign-dates">
                            <div class="start-date">${Utils.formatDate(campaign.start_date)}</div>
                            ${endDate ? `<div class="end-date">até ${Utils.formatDate(campaign.end_date)}</div>` : '<div class="end-date">Sem data fim</div>'}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i class="${statusIcon}"></i>
                            ${this.getStatusLabel(campaign.status)}
                        </span>
                    </td>
                    <td class="budget-cell">
                        <div class="budget-info">
                            <div class="budget">${Utils.formatCurrency(campaign.budget)}</div>
                            ${campaign.spent ? `<div class="spent">Gasto: ${Utils.formatCurrency(campaign.spent)}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="metrics">
                            <div class="leads">${campaign.leads_generated || 0} leads</div>
                            ${roi !== null ? `<div class="roi">ROI: ${roi}%</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <span class="progress-text">${progress}%</span>
                        </div>
                    </td>
                    <td class="actions">
                        <button class="btn-icon" onclick="campaignsModule.viewCampaign(${campaign.id})" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="campaignsModule.editCampaign(${campaign.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${campaign.status === 'planned' ? `
                            <button class="btn-icon success" onclick="campaignsModule.startCampaign(${campaign.id})" title="Iniciar">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${campaign.status === 'active' ? `
                            <button class="btn-icon warning" onclick="campaignsModule.pauseCampaign(${campaign.id})" title="Pausar">
                                <i class="fas fa-pause"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon danger" onclick="campaignsModule.deleteCampaign(${campaign.id})" title="Excluir">
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
                            <th>Campanha</th>
                            <th>Período</th>
                            <th>Status</th>
                            <th>Orçamento</th>
                            <th>Resultados</th>
                            <th>Progresso</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaignsHtml}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    }

    calculateProgress(campaign) {
        if (campaign.status === 'completed') return 100;
        if (campaign.status === 'planned') return 0;
        
        const startDate = new Date(campaign.start_date);
        const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
        const now = new Date();
        
        if (!endDate) return 50; // Campanha sem data fim
        
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        
        if (elapsed <= 0) return 0;
        if (elapsed >= totalDuration) return 100;
        
        return Math.round((elapsed / totalDuration) * 100);
    }

    calculateROI(campaign) {
        const budget = parseFloat(campaign.budget) || 0;
        const revenue = parseFloat(campaign.revenue) || 0;
        
        if (budget === 0) return null;
        
        return Math.round(((revenue - budget) / budget) * 100);
    }

    renderPagination() {
        if (this.totalPages <= 1) return '';

        let paginationHtml = '<div class="pagination">';
        
        // Botão anterior
        if (this.currentPage > 1) {
            paginationHtml += `<button class="pagination-btn" onclick="campaignsModule.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Números das páginas
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHtml += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHtml += `<button class="pagination-btn" onclick="campaignsModule.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < this.totalPages) {
            paginationHtml += `<button class="pagination-btn" onclick="campaignsModule.goToPage(${this.currentPage + 1})">Próximo</button>`;
        }

        paginationHtml += '</div>';
        return paginationHtml;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderCampaigns();
    }

    getStatusLabel(status) {
        const labels = {
            planned: 'Planejada',
            active: 'Ativa',
            paused: 'Pausada',
            completed: 'Concluída',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    }

    getTypeLabel(type) {
        const labels = {
            email: 'Email Marketing',
            social_media: 'Redes Sociais',
            google_ads: 'Google Ads',
            facebook_ads: 'Facebook Ads',
            content: 'Marketing de Conteúdo',
            seo: 'SEO',
            influencer: 'Influenciadores',
            event: 'Eventos',
            print: 'Mídia Impressa',
            radio: 'Rádio',
            tv: 'TV',
            outdoor: 'Outdoor',
            other: 'Outros'
        };
        return labels[type] || type;
    }

    showCampaignForm(campaign = null) {
        this.currentCampaign = campaign;
        const modal = document.getElementById('campaignModal');
        const title = document.getElementById('campaignModalTitle');
        const form = document.getElementById('campaignForm');

        if (campaign) {
            title.textContent = 'Editar Campanha';
            this.populateForm(campaign);
        } else {
            title.textContent = 'Nova Campanha';
            form.reset();
            // Definir data padrão como hoje
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('campaignStartDate').value = today;
        }

        modal.style.display = 'block';
    }

    hideCampaignForm() {
        const modal = document.getElementById('campaignModal');
        modal.style.display = 'none';
        this.currentCampaign = null;
    }

    populateForm(campaign) {
        document.getElementById('campaignName').value = campaign.name || '';
        document.getElementById('campaignType').value = campaign.type || '';
        document.getElementById('campaignStartDate').value = campaign.start_date ? campaign.start_date.split('T')[0] : '';
        document.getElementById('campaignEndDate').value = campaign.end_date ? campaign.end_date.split('T')[0] : '';
        document.getElementById('campaignBudget').value = campaign.budget || '';
        document.getElementById('campaignStatus').value = campaign.status || 'planned';
        document.getElementById('campaignTargetAudience').value = campaign.target_audience || '';
        document.getElementById('campaignObjectives').value = campaign.objectives || '';
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('campaignLeadsGenerated').value = campaign.leads_generated || '';
        document.getElementById('campaignRevenue').value = campaign.revenue || '';
        document.getElementById('campaignSpent').value = campaign.spent || '';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const campaignData = {
            name: formData.get('name'),
            type: formData.get('type'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date') || null,
            budget: parseFloat(formData.get('budget')) || 0,
            status: formData.get('status'),
            target_audience: formData.get('target_audience'),
            objectives: formData.get('objectives'),
            description: formData.get('description'),
            leads_generated: parseInt(formData.get('leads_generated')) || 0,
            revenue: parseFloat(formData.get('revenue')) || 0,
            spent: parseFloat(formData.get('spent')) || 0
        };

        // Validação
        if (!campaignData.name || !campaignData.type || !campaignData.start_date) {
            window.showError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Validar datas
        if (campaignData.end_date && campaignData.end_date <= campaignData.start_date) {
            window.showError('A data de fim deve ser posterior à data de início.');
            return;
        }

        try {
            if (this.currentCampaign) {
                await window.api.campaigns.update(this.currentCampaign.id, campaignData);
                window.showSuccess('Campanha atualizada com sucesso!');
            } else {
                await window.api.campaigns.create(campaignData);
                window.showSuccess('Campanha criada com sucesso!');
            }

            this.hideCampaignForm();
            await this.loadCampaigns();
            this.filterAndRenderCampaigns();
        } catch (error) {
            console.error('Erro ao salvar campanha:', error);
            window.showError('Erro ao salvar campanha');
        }
    }

    async viewCampaign(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (!campaign) return;

        const progress = this.calculateProgress(campaign);
        const roi = this.calculateROI(campaign);

        const content = `
            <div class="campaign-details">
                <h3>${campaign.name}</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Tipo:</label>
                        <span>${this.getTypeLabel(campaign.type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${campaign.status}">${this.getStatusLabel(campaign.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Data de Início:</label>
                        <span>${Utils.formatDate(campaign.start_date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Data de Fim:</label>
                        <span>${campaign.end_date ? Utils.formatDate(campaign.end_date) : 'Não definida'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Orçamento:</label>
                        <span>${Utils.formatCurrency(campaign.budget)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Gasto:</label>
                        <span>${Utils.formatCurrency(campaign.spent || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Leads Gerados:</label>
                        <span>${campaign.leads_generated || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Receita:</label>
                        <span>${Utils.formatCurrency(campaign.revenue || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Progresso:</label>
                        <span>${progress}%</span>
                    </div>
                    ${roi !== null ? `
                        <div class="detail-item">
                            <label>ROI:</label>
                            <span class="${roi >= 0 ? 'positive' : 'negative'}">${roi}%</span>
                        </div>
                    ` : ''}
                    ${campaign.target_audience ? `
                        <div class="detail-item full-width">
                            <label>Público-Alvo:</label>
                            <p>${campaign.target_audience}</p>
                        </div>
                    ` : ''}
                    ${campaign.objectives ? `
                        <div class="detail-item full-width">
                            <label>Objetivos:</label>
                            <p>${campaign.objectives}</p>
                        </div>
                    ` : ''}
                    ${campaign.description ? `
                        <div class="detail-item full-width">
                            <label>Descrição:</label>
                            <p>${campaign.description}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        window.showModal('Detalhes da Campanha', content);
    }

    async editCampaign(id) {
        const campaign = this.campaigns.find(c => c.id === id);
        if (campaign) {
            this.showCampaignForm(campaign);
        }
    }

    async startCampaign(id) {
        if (confirm('Iniciar esta campanha?')) {
            try {
                await window.api.campaigns.update(id, { status: 'active' });
                window.showSuccess('Campanha iniciada com sucesso!');
                await this.loadCampaigns();
                this.filterAndRenderCampaigns();
            } catch (error) {
                console.error('Erro ao iniciar campanha:', error);
                window.showError('Erro ao iniciar campanha');
            }
        }
    }

    async pauseCampaign(id) {
        if (confirm('Pausar esta campanha?')) {
            try {
                await window.api.campaigns.update(id, { status: 'paused' });
                window.showSuccess('Campanha pausada com sucesso!');
                await this.loadCampaigns();
                this.filterAndRenderCampaigns();
            } catch (error) {
                console.error('Erro ao pausar campanha:', error);
                window.showError('Erro ao pausar campanha');
            }
        }
    }

    async deleteCampaign(id) {
        if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            try {
                await window.api.campaigns.delete(id);
                window.showSuccess('Campanha excluída com sucesso!');
                await this.loadCampaigns();
                this.filterAndRenderCampaigns();
            } catch (error) {
                console.error('Erro ao excluir campanha:', error);
                window.showError('Erro ao excluir campanha');
            }
        }
    }
}

// Instância global
const campaignsModule = new CampaignsModule();