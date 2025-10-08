class DashboardModule {
    constructor() {
        this.data = {
            clients: [],
            projects: [],
            bills: [],
            meetings: [],
            leads: []
        };
    }

    async init() {
        await this.loadData();
        this.updateStats();
        this.renderUpcomingMeetings();
        this.renderDueBills();
        this.renderRecentProjects();
        this.renderRecentLeads();
    }

    async loadData() {
        try {
            const [clients, projects, bills, meetings, leads] = await Promise.all([
                window.api.clients.getAll(),
                window.api.projects.getAll(),
                window.api.bills.getAll(),
                window.api.meetings.getAll(),
                window.api.leads.getAll()
            ]);

            this.data = { clients, projects, bills, meetings, leads };
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateStats() {
        // Total clients
        const activeClients = this.data.clients.filter(client => client.status === 'active').length;
        document.getElementById('totalClients').textContent = activeClients;

        // Active projects
        const activeProjects = this.data.projects.filter(project => 
            ['planning', 'in-progress'].includes(project.status)
        ).length;
        document.getElementById('totalProjects').textContent = activeProjects;

        // Pending bills
        const pendingBills = this.data.bills.filter(bill => bill.status === 'pending').length;
        document.getElementById('pendingBills').textContent = pendingBills;

        // Active leads
        const activeLeads = this.data.leads.filter(lead => 
            ['new', 'contacted', 'qualified'].includes(lead.status)
        ).length;
        document.getElementById('totalLeads').textContent = activeLeads;
    }

    renderUpcomingMeetings() {
        const container = document.getElementById('upcomingMeetings');
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingMeetings = this.data.meetings
            .filter(meeting => {
                const meetingDate = new Date(meeting.meeting_date);
                return meeting.status === 'scheduled' && meetingDate >= today && meetingDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date))
            .slice(0, 5);

        if (upcomingMeetings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Nenhuma reunião agendada</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingMeetings.map(meeting => `
            <div class="meeting-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                <div class="meeting-icon" style="width: 40px; height: 40px; background: var(--primary-color)20; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-calendar-alt" style="color: var(--primary-color);"></i>
                </div>
                <div class="meeting-info" style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${meeting.title}</h4>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-muted);">
                        <span><i class="fas fa-clock" style="margin-right: 4px;"></i>${Utils.formatDate(meeting.meeting_date, 'dd/mm/yyyy hh:mm')}</span>
                        ${meeting.client_name ? `<span><i class="fas fa-user" style="margin-right: 4px;"></i>${meeting.client_name}</span>` : ''}
                    </div>
                </div>
                <div class="meeting-actions">
                    ${Utils.getStatusBadge(meeting.status)}
                </div>
            </div>
        `).join('');
    }

    renderDueBills() {
        const container = document.getElementById('dueBills');
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const dueBills = this.data.bills
            .filter(bill => {
                const dueDate = new Date(bill.due_date);
                return bill.status === 'pending' && dueDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 5);

        if (dueBills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <p>Nenhuma conta vencendo</p>
                </div>
            `;
            return;
        }

        container.innerHTML = dueBills.map(bill => {
            const dueDate = new Date(bill.due_date);
            const isOverdue = dueDate < today;
            
            return `
                <div class="bill-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                    <div class="bill-icon" style="width: 40px; height: 40px; background: ${isOverdue ? 'var(--danger-color)' : 'var(--warning-color)'}20; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="fas fa-file-invoice-dollar" style="color: ${isOverdue ? 'var(--danger-color)' : 'var(--warning-color)'};"></i>
                    </div>
                    <div class="bill-info" style="flex: 1;">
                        <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${bill.description}</h4>
                        <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-muted);">
                            <span><i class="fas fa-calendar" style="margin-right: 4px;"></i>${Utils.formatDate(bill.due_date)}</span>
                            <span><i class="fas fa-dollar-sign" style="margin-right: 4px;"></i>${Utils.formatCurrency(bill.amount)}</span>
                        </div>
                    </div>
                    <div class="bill-actions">
                        ${Utils.getStatusBadge(isOverdue ? 'overdue' : 'pending')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecentProjects() {
        const container = document.getElementById('recentProjects');
        
        const recentProjects = this.data.projects
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (recentProjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <p>Nenhum projeto recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentProjects.map(project => `
            <div class="project-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                <div class="project-icon" style="width: 40px; height: 40px; background: var(--success-color)20; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-project-diagram" style="color: var(--success-color);"></i>
                </div>
                <div class="project-info" style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${project.name}</h4>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-muted);">
                        ${project.client_name ? `<span><i class="fas fa-user" style="margin-right: 4px;"></i>${project.client_name}</span>` : ''}
                        <span><i class="fas fa-calendar" style="margin-right: 4px;"></i>${Utils.formatDate(project.created_at, 'relative')}</span>
                    </div>
                </div>
                <div class="project-actions" style="display: flex; align-items: center; gap: 8px;">
                    ${Utils.getStatusBadge(project.status)}
                    <div style="width: 60px;">${Utils.getProgressBar(project.progress, false)}</div>
                </div>
            </div>
        `).join('');
    }

    renderRecentLeads() {
        const container = document.getElementById('recentLeads');
        
        const recentLeads = this.data.leads
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (recentLeads.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>Nenhum lead recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentLeads.map(lead => `
            <div class="lead-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                <div class="lead-icon" style="width: 40px; height: 40px; background: var(--info-color)20; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fas fa-user-plus" style="color: var(--info-color);"></i>
                </div>
                <div class="lead-info" style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${lead.name}</h4>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; color: var(--text-muted);">
                        ${lead.company ? `<span><i class="fas fa-building" style="margin-right: 4px;"></i>${lead.company}</span>` : ''}
                        <span><i class="fas fa-calendar" style="margin-right: 4px;"></i>${Utils.formatDate(lead.created_at, 'relative')}</span>
                    </div>
                </div>
                <div class="lead-actions">
                    ${Utils.getStatusBadge(lead.status)}
                </div>
            </div>
        `).join('');
    }

    async refresh() {
        await this.init();
    }
}

// Initialize dashboard module
window.dashboardModule = new DashboardModule();