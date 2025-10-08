class ProjectsModule {
    constructor() {
        this.projects = [];
        this.clients = [];
        this.filteredProjects = [];
        this.currentProject = null;
        this.isEditing = false;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            status: 'all',
            client: 'all'
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderProjectsList();
        this.updateStats();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('projectsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('projectsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        const clientFilter = document.getElementById('projectsClientFilter');
        if (clientFilter) {
            clientFilter.addEventListener('change', (e) => {
                this.filters.client = e.target.value;
                this.applyFilters();
            });
        }

        // Add project button
        const addButton = document.getElementById('addProjectBtn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showProjectForm());
        }

        // Form submit
        const form = document.getElementById('projectForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelButton = document.getElementById('cancelProjectBtn');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.hideProjectForm());
        }
    }

    async loadData() {
        try {
            const [projects, clients] = await Promise.all([
                window.api.projects.getAll(),
                window.api.clients.getAll()
            ]);

            this.projects = projects;
            this.clients = clients;
            this.filteredProjects = [...this.projects];
            this.populateClientFilter();
        } catch (error) {
            console.error('Error loading projects data:', error);
            window.showError('Erro ao carregar dados dos projetos');
        }
    }

    populateClientFilter() {
        const clientFilter = document.getElementById('projectsClientFilter');
        if (!clientFilter) return;

        const activeClients = this.clients.filter(client => client.status === 'active');
        
        clientFilter.innerHTML = `
            <option value="all">Todos os Clientes</option>
            ${activeClients.map(client => 
                `<option value="${client.id}">${client.name}</option>`
            ).join('')}
        `;
    }

    applyFilters() {
        this.filteredProjects = this.projects.filter(project => {
            const matchesSearch = !this.filters.search || 
                project.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                project.description.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                (project.client_name && project.client_name.toLowerCase().includes(this.filters.search.toLowerCase()));

            const matchesStatus = this.filters.status === 'all' || project.status === this.filters.status;
            const matchesClient = this.filters.client === 'all' || project.client_id === this.filters.client;

            return matchesSearch && matchesStatus && matchesClient;
        });

        this.currentPage = 1;
        this.renderProjectsList();
        this.updateStats();
    }

    renderProjectsList() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        if (this.filteredProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>Nenhum projeto encontrado</h3>
                    <p>Crie seu primeiro projeto ou ajuste os filtros</p>
                    <button class="btn btn-primary" onclick="projectsModule.showProjectForm()">
                        <i class="fas fa-plus"></i> Novo Projeto
                    </button>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);

        container.innerHTML = `
            <div class="projects-grid">
                ${paginatedProjects.map(project => this.renderProjectCard(project)).join('')}
            </div>
            ${this.renderPagination()}
        `;
    }

    renderProjectCard(project) {
        const progressPercentage = project.progress || 0;
        const statusClass = this.getStatusClass(project.status);
        const priorityClass = this.getPriorityClass(project.priority);

        return `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-title">
                        <h3>${project.name}</h3>
                        <div class="project-badges">
                            ${Utils.getStatusBadge(project.status)}
                            <span class="priority-badge ${priorityClass}">
                                ${this.getPriorityLabel(project.priority)}
                            </span>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-sm btn-outline" onclick="projectsModule.viewProject('${project.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="projectsModule.editProject('${project.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="projectsModule.deleteProject('${project.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="project-info">
                    <p class="project-description">${Utils.truncate(project.description, 100)}</p>
                    
                    <div class="project-details">
                        ${project.client_name ? `
                            <div class="detail-item">
                                <i class="fas fa-user"></i>
                                <span>${project.client_name}</span>
                            </div>
                        ` : ''}
                        
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Início: ${Utils.formatDate(project.start_date)}</span>
                        </div>
                        
                        ${project.end_date ? `
                            <div class="detail-item">
                                <i class="fas fa-calendar-check"></i>
                                <span>Fim: ${Utils.formatDate(project.end_date)}</span>
                            </div>
                        ` : ''}
                        
                        ${project.budget ? `
                            <div class="detail-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>${Utils.formatCurrency(project.budget)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="project-progress">
                    <div class="progress-header">
                        <span>Progresso</span>
                        <span>${progressPercentage}%</span>
                    </div>
                    ${Utils.getProgressBar(progressPercentage)}
                </div>
            </div>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination">';
        
        // Previous button
        pagination += `
            <button class="btn btn-sm ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="projectsModule.goToPage(${this.currentPage - 1})" 
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
                            onclick="projectsModule.goToPage(${i})">
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
                    onclick="projectsModule.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination += '</div>';
        return pagination;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderProjectsList();
        }
    }

    updateStats() {
        const totalProjects = this.projects.length;
        const activeProjects = this.projects.filter(p => ['planning', 'in-progress'].includes(p.status)).length;
        const completedProjects = this.projects.filter(p => p.status === 'completed').length;
        const onHoldProjects = this.projects.filter(p => p.status === 'on-hold').length;

        document.getElementById('totalProjectsCount').textContent = totalProjects;
        document.getElementById('activeProjectsCount').textContent = activeProjects;
        document.getElementById('completedProjectsCount').textContent = completedProjects;
        document.getElementById('onHoldProjectsCount').textContent = onHoldProjects;
    }

    showProjectForm(project = null) {
        this.currentProject = project;
        this.isEditing = !!project;

        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const title = document.getElementById('projectModalTitle');

        title.textContent = this.isEditing ? 'Editar Projeto' : 'Novo Projeto';

        // Populate client select
        this.populateClientSelect();

        if (this.isEditing) {
            this.populateForm(project);
        } else {
            form.reset();
        }

        modal.style.display = 'flex';
    }

    hideProjectForm() {
        const modal = document.getElementById('projectModal');
        modal.style.display = 'none';
        this.currentProject = null;
        this.isEditing = false;
    }

    populateClientSelect() {
        const clientSelect = document.getElementById('projectClient');
        if (!clientSelect) return;

        const activeClients = this.clients.filter(client => client.status === 'active');
        
        clientSelect.innerHTML = `
            <option value="">Selecione um cliente...</option>
            ${activeClients.map(client => 
                `<option value="${client.id}">${client.name}</option>`
            ).join('')}
        `;
    }

    populateForm(project) {
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectClient').value = project.client_id || '';
        document.getElementById('projectStartDate').value = project.start_date ? project.start_date.split('T')[0] : '';
        document.getElementById('projectEndDate').value = project.end_date ? project.end_date.split('T')[0] : '';
        document.getElementById('projectBudget').value = project.budget || '';
        document.getElementById('projectStatus').value = project.status || 'planning';
        document.getElementById('projectPriority').value = project.priority || 'medium';
        document.getElementById('projectProgress').value = project.progress || 0;
        document.getElementById('projectNotes').value = project.notes || '';
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const projectData = {
            name: formData.get('name'),
            description: formData.get('description'),
            client_id: formData.get('client_id') || null,
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date') || null,
            budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
            status: formData.get('status'),
            priority: formData.get('priority'),
            progress: parseInt(formData.get('progress')) || 0,
            notes: formData.get('notes')
        };

        // Validation
        if (!this.validateProjectData(projectData)) {
            return;
        }

        try {
            window.showLoading();

            if (this.isEditing) {
                await window.api.projects.update(this.currentProject.id, projectData);
                window.showSuccess('Projeto atualizado com sucesso!');
            } else {
                await window.api.projects.create(projectData);
                window.showSuccess('Projeto criado com sucesso!');
            }

            await this.loadData();
            this.applyFilters();
            this.hideProjectForm();
        } catch (error) {
            console.error('Error saving project:', error);
            window.showError('Erro ao salvar projeto');
        } finally {
            window.hideLoading();
        }
    }

    validateProjectData(data) {
        if (!data.name.trim()) {
            window.showError('Nome do projeto é obrigatório');
            return false;
        }

        if (!data.description.trim()) {
            window.showError('Descrição do projeto é obrigatória');
            return false;
        }

        if (!data.start_date) {
            window.showError('Data de início é obrigatória');
            return false;
        }

        if (data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
            window.showError('Data de fim deve ser posterior à data de início');
            return false;
        }

        if (data.progress < 0 || data.progress > 100) {
            window.showError('Progresso deve estar entre 0 e 100%');
            return false;
        }

        return true;
    }

    async viewProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Show project details modal or navigate to detail view
        console.log('View project:', project);
    }

    async editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        this.showProjectForm(project);
    }

    async deleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        const confirmed = confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`);
        if (!confirmed) return;

        try {
            window.showLoading();
            await window.api.projects.delete(projectId);
            window.showSuccess('Projeto excluído com sucesso!');
            await this.loadData();
            this.applyFilters();
        } catch (error) {
            console.error('Error deleting project:', error);
            window.showError('Erro ao excluir projeto');
        } finally {
            window.hideLoading();
        }
    }

    getStatusClass(status) {
        const statusClasses = {
            'planning': 'info',
            'in-progress': 'warning',
            'completed': 'success',
            'on-hold': 'secondary',
            'cancelled': 'danger'
        };
        return statusClasses[status] || 'secondary';
    }

    getPriorityClass(priority) {
        const priorityClasses = {
            'low': 'success',
            'medium': 'warning',
            'high': 'danger'
        };
        return priorityClasses[priority] || 'secondary';
    }

    getPriorityLabel(priority) {
        const priorityLabels = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };
        return priorityLabels[priority] || 'Média';
    }

    async refresh() {
        await this.loadData();
        this.applyFilters();
    }
}

// Initialize projects module
window.projectsModule = new ProjectsModule();