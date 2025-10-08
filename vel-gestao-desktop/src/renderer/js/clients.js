class ClientsModule {
    constructor() {
        this.clients = [];
        this.filteredClients = [];
        this.currentClient = null;
        this.isEditing = false;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            status: 'all',
            type: 'all'
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadClients();
        this.renderClientsList();
        this.updateStats();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('clientsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('clientsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        const typeFilter = document.getElementById('clientsTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        // Add client button
        const addButton = document.getElementById('addClientBtn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showClientForm());
        }

        // Form submit
        const form = document.getElementById('clientForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelButton = document.getElementById('cancelClientBtn');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.hideClientForm());
        }
    }

    async loadClients() {
        try {
            this.clients = await window.api.clients.getAll();
            this.filteredClients = [...this.clients];
        } catch (error) {
            console.error('Error loading clients:', error);
            window.showError('Erro ao carregar clientes');
        }
    }

    applyFilters() {
        this.filteredClients = this.clients.filter(client => {
            const matchesSearch = !this.filters.search || 
                client.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                client.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                (client.company && client.company.toLowerCase().includes(this.filters.search.toLowerCase()));

            const matchesStatus = this.filters.status === 'all' || client.status === this.filters.status;
            const matchesType = this.filters.type === 'all' || client.type === this.filters.type;

            return matchesSearch && matchesStatus && matchesType;
        });

        this.currentPage = 1;
        this.renderClientsList();
        this.updateStats();
    }

    renderClientsList() {
        const container = document.getElementById('clientsList');
        if (!container) return;

        if (this.filteredClients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Adicione seu primeiro cliente ou ajuste os filtros</p>
                    <button class="btn btn-primary" onclick="clientsModule.showClientForm()">
                        <i class="fas fa-plus"></i> Adicionar Cliente
                    </button>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedClients = this.filteredClients.slice(startIndex, endIndex);

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Empresa</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Tipo</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedClients.map(client => this.renderClientRow(client)).join('')}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    }

    renderClientRow(client) {
        return `
            <tr>
                <td>
                    <div class="client-info">
                        <div class="client-avatar">
                            ${client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="client-name">${client.name}</div>
                            <div class="client-document">${Utils.formatDocument(client.document)}</div>
                        </div>
                    </div>
                </td>
                <td>${client.company || '-'}</td>
                <td>
                    <a href="mailto:${client.email}" class="email-link">${client.email}</a>
                </td>
                <td>
                    <a href="tel:${client.phone}" class="phone-link">${Utils.formatPhone(client.phone)}</a>
                </td>
                <td>
                    <span class="type-badge type-${client.type}">
                        ${client.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </span>
                </td>
                <td>${Utils.getStatusBadge(client.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="clientsModule.viewClient('${client.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="clientsModule.editClient('${client.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="clientsModule.deleteClient('${client.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination">';
        
        // Previous button
        pagination += `
            <button class="btn btn-sm ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="clientsModule.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage || i === 1 || i === totalPages || 
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                pagination += `
                    <button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : ''}" 
                            onclick="clientsModule.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                pagination += '<span class="pagination-dots">...</span>';
            }
        }

        // Next button
        pagination += `
            <button class="btn btn-sm ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="clientsModule.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination += '</div>';
        return pagination;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredClients.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderClientsList();
        }
    }

    updateStats() {
        const totalClients = this.clients.length;
        const activeClients = this.clients.filter(c => c.status === 'active').length;
        const inactiveClients = this.clients.filter(c => c.status === 'inactive').length;

        document.getElementById('totalClientsCount').textContent = totalClients;
        document.getElementById('activeClientsCount').textContent = activeClients;
        document.getElementById('inactiveClientsCount').textContent = inactiveClients;
    }

    showClientForm(client = null) {
        this.currentClient = client;
        this.isEditing = !!client;

        const modal = document.getElementById('clientModal');
        const form = document.getElementById('clientForm');
        const title = document.getElementById('clientModalTitle');

        title.textContent = this.isEditing ? 'Editar Cliente' : 'Novo Cliente';

        if (this.isEditing) {
            this.populateForm(client);
        } else {
            form.reset();
        }

        modal.style.display = 'flex';
    }

    hideClientForm() {
        const modal = document.getElementById('clientModal');
        modal.style.display = 'none';
        this.currentClient = null;
        this.isEditing = false;
    }

    populateForm(client) {
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientDocument').value = client.document || '';
        document.getElementById('clientType').value = client.type || 'individual';
        document.getElementById('clientCompany').value = client.company || '';
        document.getElementById('clientAddress').value = client.address || '';
        document.getElementById('clientCity').value = client.city || '';
        document.getElementById('clientState').value = client.state || '';
        document.getElementById('clientZipCode').value = client.zip_code || '';
        document.getElementById('clientStatus').value = client.status || 'active';
        document.getElementById('clientNotes').value = client.notes || '';
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const clientData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            document: formData.get('document'),
            type: formData.get('type'),
            company: formData.get('company'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            status: formData.get('status'),
            notes: formData.get('notes')
        };

        // Validation
        if (!this.validateClientData(clientData)) {
            return;
        }

        try {
            window.showLoading();

            if (this.isEditing) {
                await window.api.clients.update(this.currentClient.id, clientData);
                window.showSuccess('Cliente atualizado com sucesso!');
            } else {
                await window.api.clients.create(clientData);
                window.showSuccess('Cliente criado com sucesso!');
            }

            await this.loadClients();
            this.applyFilters();
            this.hideClientForm();
        } catch (error) {
            console.error('Error saving client:', error);
            window.showError('Erro ao salvar cliente');
        } finally {
            window.hideLoading();
        }
    }

    validateClientData(data) {
        if (!data.name.trim()) {
            window.showError('Nome é obrigatório');
            return false;
        }

        if (!data.email.trim() || !Utils.validateEmail(data.email)) {
            window.showError('Email válido é obrigatório');
            return false;
        }

        if (!data.phone.trim() || !Utils.validatePhone(data.phone)) {
            window.showError('Telefone válido é obrigatório');
            return false;
        }

        if (data.type === 'individual' && !Utils.validateCPF(data.document)) {
            window.showError('CPF válido é obrigatório para pessoa física');
            return false;
        }

        if (data.type === 'company' && !Utils.validateCNPJ(data.document)) {
            window.showError('CNPJ válido é obrigatório para pessoa jurídica');
            return false;
        }

        return true;
    }

    async viewClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        // Show client details modal or navigate to detail view
        console.log('View client:', client);
    }

    async editClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        this.showClientForm(client);
    }

    async deleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        const confirmed = confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`);
        if (!confirmed) return;

        try {
            window.showLoading();
            await window.api.clients.delete(clientId);
            window.showSuccess('Cliente excluído com sucesso!');
            await this.loadClients();
            this.applyFilters();
        } catch (error) {
            console.error('Error deleting client:', error);
            window.showError('Erro ao excluir cliente');
        } finally {
            window.hideLoading();
        }
    }

    async refresh() {
        await this.loadClients();
        this.applyFilters();
    }
}

// Initialize clients module
window.clientsModule = new ClientsModule();