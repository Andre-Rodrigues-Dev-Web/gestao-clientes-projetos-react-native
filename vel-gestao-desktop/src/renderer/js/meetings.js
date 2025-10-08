class MeetingsModule {
    constructor() {
        this.meetings = [];
        this.clients = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.filters = {
            search: '',
            status: 'all',
            client: 'all',
            dateRange: 'all'
        };
        this.currentMeeting = null;
        this.currentView = 'list'; // 'list' or 'calendar'
    }

    async init() {
        console.log('Inicializando módulo de reuniões...');
        await this.loadClients();
        await this.loadMeetings();
        this.setupEventListeners();
        this.updateStats();
        this.renderMeetings();
    }

    async loadMeetings() {
        try {
            this.meetings = await window.api.meetings.getAll();
            this.updatePagination();
        } catch (error) {
            console.error('Erro ao carregar reuniões:', error);
            window.showError('Erro ao carregar reuniões');
        }
    }

    async loadClients() {
        try {
            this.clients = await window.api.clients.getAll();
            this.populateClientFilters();
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    }

    setupEventListeners() {
        // Botão adicionar reunião
        const addMeetingBtn = document.getElementById('addMeetingBtn');
        if (addMeetingBtn) {
            addMeetingBtn.addEventListener('click', () => this.showMeetingForm());
        }

        // Busca
        const searchInput = document.getElementById('meetingsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderMeetings();
            }, 300));
        }

        // Filtros
        const statusFilter = document.getElementById('meetingsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderMeetings();
            });
        }

        const clientFilter = document.getElementById('meetingsClientFilter');
        if (clientFilter) {
            clientFilter.addEventListener('change', (e) => {
                this.filters.client = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderMeetings();
            });
        }

        const dateRangeFilter = document.getElementById('meetingsDateRangeFilter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderMeetings();
            });
        }

        // Alternância de visualização
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.switchView('list'));
        }
        
        if (calendarViewBtn) {
            calendarViewBtn.addEventListener('click', () => this.switchView('calendar'));
        }

        // Formulário
        const meetingForm = document.getElementById('meetingForm');
        if (meetingForm) {
            meetingForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const cancelBtn = document.getElementById('cancelMeetingBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideMeetingForm());
        }
    }

    populateClientFilters() {
        const clientFilter = document.getElementById('meetingsClientFilter');
        if (!clientFilter) return;

        // Limpar opções existentes (exceto "Todos")
        while (clientFilter.children.length > 1) {
            clientFilter.removeChild(clientFilter.lastChild);
        }

        // Adicionar clientes
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientFilter.appendChild(option);
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Atualizar botões
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        
        if (listViewBtn && calendarViewBtn) {
            listViewBtn.classList.toggle('active', view === 'list');
            calendarViewBtn.classList.toggle('active', view === 'calendar');
        }

        // Renderizar visualização
        if (view === 'list') {
            this.renderMeetings();
        } else {
            this.renderCalendar();
        }
    }

    filterAndRenderMeetings() {
        this.updateStats();
        if (this.currentView === 'list') {
            this.renderMeetings();
        } else {
            this.renderCalendar();
        }
    }

    getFilteredMeetings() {
        let filtered = [...this.meetings];

        // Filtro de busca
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(meeting => 
                meeting.title.toLowerCase().includes(search) ||
                meeting.description?.toLowerCase().includes(search) ||
                meeting.location?.toLowerCase().includes(search)
            );
        }

        // Filtro de status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(meeting => meeting.status === this.filters.status);
        }

        // Filtro de cliente
        if (this.filters.client !== 'all') {
            filtered = filtered.filter(meeting => meeting.client_id == this.filters.client);
        }

        // Filtro de data
        if (this.filters.dateRange !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(meeting => {
                const meetingDate = new Date(meeting.date);
                const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
                
                switch (this.filters.dateRange) {
                    case 'today':
                        return meetingDay.getTime() === today.getTime();
                    case 'week':
                        const weekFromNow = new Date(today);
                        weekFromNow.setDate(weekFromNow.getDate() + 7);
                        return meetingDay >= today && meetingDay <= weekFromNow;
                    case 'month':
                        const monthFromNow = new Date(today);
                        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
                        return meetingDay >= today && meetingDay <= monthFromNow;
                    case 'past':
                        return meetingDay < today;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }

    updateStats() {
        const filtered = this.getFilteredMeetings();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const stats = {
            total: filtered.length,
            scheduled: filtered.filter(m => m.status === 'scheduled').length,
            completed: filtered.filter(m => m.status === 'completed').length,
            cancelled: filtered.filter(m => m.status === 'cancelled').length,
            upcoming: filtered.filter(m => {
                const meetingDate = new Date(m.date);
                const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
                return meetingDay >= today && m.status === 'scheduled';
            }).length
        };

        // Atualizar elementos do DOM
        const elements = {
            totalMeetingsCount: stats.total,
            scheduledMeetingsCount: stats.scheduled,
            completedMeetingsCount: stats.completed,
            upcomingMeetingsCount: stats.upcoming
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updatePagination() {
        const filtered = this.getFilteredMeetings();
        this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    renderMeetings() {
        const container = document.getElementById('meetingsList');
        if (!container) return;

        const filtered = this.getFilteredMeetings();
        this.updatePagination();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>Nenhuma reunião encontrada</h3>
                    <p>Não há reuniões que correspondam aos filtros selecionados.</p>
                </div>
            `;
            return;
        }

        // Paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedMeetings = filtered.slice(startIndex, endIndex);

        const meetingsHtml = paginatedMeetings.map(meeting => {
            const client = this.clients.find(c => c.id === meeting.client_id);
            const clientName = client ? client.name : 'Cliente não encontrado';
            
            const meetingDate = new Date(meeting.date);
            const now = new Date();
            const isUpcoming = meetingDate > now && meeting.status === 'scheduled';
            const isPast = meetingDate < now;
            
            let rowClass = '';
            if (isUpcoming) rowClass = 'upcoming-row';
            else if (isPast && meeting.status === 'scheduled') rowClass = 'overdue-row';

            return `
                <tr class="${rowClass}">
                    <td>
                        <div class="meeting-info">
                            <div class="meeting-title">${meeting.title}</div>
                            ${meeting.description ? `<div class="meeting-description">${Utils.truncate(meeting.description, 50)}</div>` : ''}
                        </div>
                    </td>
                    <td>${clientName}</td>
                    <td>
                        <div class="meeting-datetime">
                            <div class="meeting-date">${Utils.formatDate(meeting.date)}</div>
                            <div class="meeting-time">${meeting.time}</div>
                        </div>
                    </td>
                    <td>${meeting.location || '-'}</td>
                    <td>
                        <span class="status-badge ${meeting.status}">
                            ${this.getStatusLabel(meeting.status)}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="btn-icon" onclick="meetingsModule.viewMeeting(${meeting.id})" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="meetingsModule.editMeeting(${meeting.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${meeting.status === 'scheduled' ? `
                            <button class="btn-icon success" onclick="meetingsModule.markAsCompleted(${meeting.id})" title="Marcar como Realizada">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon danger" onclick="meetingsModule.deleteMeeting(${meeting.id})" title="Excluir">
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
                            <th>Reunião</th>
                            <th>Cliente</th>
                            <th>Data/Hora</th>
                            <th>Local</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meetingsHtml}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    }

    renderCalendar() {
        const container = document.getElementById('meetingsList');
        if (!container) return;

        const filtered = this.getFilteredMeetings();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Agrupar reuniões por data
        const meetingsByDate = {};
        filtered.forEach(meeting => {
            const date = meeting.date.split('T')[0]; // Pegar apenas a data
            if (!meetingsByDate[date]) {
                meetingsByDate[date] = [];
            }
            meetingsByDate[date].push(meeting);
        });

        // Gerar calendário simples
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let calendarHtml = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h3>${Utils.getMonthName(currentMonth)} ${currentYear}</h3>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-weekdays">
                        <div class="weekday">Dom</div>
                        <div class="weekday">Seg</div>
                        <div class="weekday">Ter</div>
                        <div class="weekday">Qua</div>
                        <div class="weekday">Qui</div>
                        <div class="weekday">Sex</div>
                        <div class="weekday">Sáb</div>
                    </div>
                    <div class="calendar-days">
        `;

        // Dias vazios no início
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHtml += '<div class="calendar-day empty"></div>';
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayMeetings = meetingsByDate[date] || [];
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

            calendarHtml += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${dayMeetings.length > 0 ? 'has-meetings' : ''}">
                    <div class="day-number">${day}</div>
                    <div class="day-meetings">
                        ${dayMeetings.slice(0, 3).map(meeting => `
                            <div class="meeting-item ${meeting.status}" onclick="meetingsModule.viewMeeting(${meeting.id})">
                                <span class="meeting-time">${meeting.time}</span>
                                <span class="meeting-title">${Utils.truncate(meeting.title, 15)}</span>
                            </div>
                        `).join('')}
                        ${dayMeetings.length > 3 ? `<div class="more-meetings">+${dayMeetings.length - 3} mais</div>` : ''}
                    </div>
                </div>
            `;
        }

        calendarHtml += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = calendarHtml;
    }

    renderPagination() {
        if (this.totalPages <= 1) return '';

        let paginationHtml = '<div class="pagination">';
        
        // Botão anterior
        if (this.currentPage > 1) {
            paginationHtml += `<button class="pagination-btn" onclick="meetingsModule.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Números das páginas
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHtml += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHtml += `<button class="pagination-btn" onclick="meetingsModule.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < this.totalPages) {
            paginationHtml += `<button class="pagination-btn" onclick="meetingsModule.goToPage(${this.currentPage + 1})">Próximo</button>`;
        }

        paginationHtml += '</div>';
        return paginationHtml;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderMeetings();
    }

    getStatusLabel(status) {
        const labels = {
            scheduled: 'Agendada',
            completed: 'Realizada',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    }

    showMeetingForm(meeting = null) {
        this.currentMeeting = meeting;
        const modal = document.getElementById('meetingModal');
        const title = document.getElementById('meetingModalTitle');
        const form = document.getElementById('meetingForm');

        if (meeting) {
            title.textContent = 'Editar Reunião';
            this.populateForm(meeting);
        } else {
            title.textContent = 'Nova Reunião';
            form.reset();
            // Definir data padrão como hoje
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('meetingDate').value = today;
        }

        modal.style.display = 'block';
    }

    hideMeetingForm() {
        const modal = document.getElementById('meetingModal');
        modal.style.display = 'none';
        this.currentMeeting = null;
    }

    populateForm(meeting) {
        document.getElementById('meetingTitle').value = meeting.title || '';
        document.getElementById('meetingClient').value = meeting.client_id || '';
        document.getElementById('meetingDate').value = meeting.date ? meeting.date.split('T')[0] : '';
        document.getElementById('meetingTime').value = meeting.time || '';
        document.getElementById('meetingLocation').value = meeting.location || '';
        document.getElementById('meetingStatus').value = meeting.status || 'scheduled';
        document.getElementById('meetingDescription').value = meeting.description || '';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const meetingData = {
            title: formData.get('title'),
            client_id: parseInt(formData.get('client_id')),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            status: formData.get('status'),
            description: formData.get('description')
        };

        // Validação
        if (!meetingData.title || !meetingData.client_id || !meetingData.date || !meetingData.time) {
            window.showError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            if (this.currentMeeting) {
                await window.api.meetings.update(this.currentMeeting.id, meetingData);
                window.showSuccess('Reunião atualizada com sucesso!');
            } else {
                await window.api.meetings.create(meetingData);
                window.showSuccess('Reunião criada com sucesso!');
            }

            this.hideMeetingForm();
            await this.loadMeetings();
            this.filterAndRenderMeetings();
        } catch (error) {
            console.error('Erro ao salvar reunião:', error);
            window.showError('Erro ao salvar reunião');
        }
    }

    async viewMeeting(id) {
        const meeting = this.meetings.find(m => m.id === id);
        if (!meeting) return;

        const client = this.clients.find(c => c.id === meeting.client_id);
        const clientName = client ? client.name : 'Cliente não encontrado';

        const content = `
            <div class="meeting-details">
                <h3>${meeting.title}</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Cliente:</label>
                        <span>${clientName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Data:</label>
                        <span>${Utils.formatDate(meeting.date)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Horário:</label>
                        <span>${meeting.time}</span>
                    </div>
                    <div class="detail-item">
                        <label>Local:</label>
                        <span>${meeting.location || 'Não informado'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${meeting.status}">${this.getStatusLabel(meeting.status)}</span>
                    </div>
                    ${meeting.description ? `
                        <div class="detail-item full-width">
                            <label>Descrição:</label>
                            <p>${meeting.description}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        window.showModal('Detalhes da Reunião', content);
    }

    async editMeeting(id) {
        const meeting = this.meetings.find(m => m.id === id);
        if (meeting) {
            this.showMeetingForm(meeting);
        }
    }

    async markAsCompleted(id) {
        if (confirm('Marcar esta reunião como realizada?')) {
            try {
                await window.api.meetings.update(id, { status: 'completed' });
                window.showSuccess('Reunião marcada como realizada!');
                await this.loadMeetings();
                this.filterAndRenderMeetings();
            } catch (error) {
                console.error('Erro ao atualizar reunião:', error);
                window.showError('Erro ao atualizar reunião');
            }
        }
    }

    async deleteMeeting(id) {
        if (confirm('Tem certeza que deseja excluir esta reunião?')) {
            try {
                await window.api.meetings.delete(id);
                window.showSuccess('Reunião excluída com sucesso!');
                await this.loadMeetings();
                this.filterAndRenderMeetings();
            } catch (error) {
                console.error('Erro ao excluir reunião:', error);
                window.showError('Erro ao excluir reunião');
            }
        }
    }
}

// Instância global
const meetingsModule = new MeetingsModule();