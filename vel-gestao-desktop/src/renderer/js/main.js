const { ipcRenderer } = require('electron');

class App {
    constructor() {
        this.currentModule = 'dashboard';
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupGlobalSearch();
        this.setupNotifications();
        await this.loadDashboard();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = link.dataset.module;
                this.navigateToModule(module);
            });
        });
    }

    async navigateToModule(module) {
        if (this.currentModule === module) return;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-module="${module}"]`).classList.add('active');

        // Hide current module content
        document.querySelectorAll('.module-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show new module content
        const moduleContent = document.getElementById(`${module}-content`);
        moduleContent.classList.add('active');

        this.currentModule = module;

        // Load module content
        await this.loadModuleContent(module);
    }

    async loadModuleContent(module) {
        this.showLoading();

        try {
            switch (module) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'clients':
                    await window.clientsModule.init();
                    break;
                case 'projects':
                    await window.projectsModule.init();
                    break;
                case 'bills':
                    await window.billsModule.init();
                    break;
                case 'meetings':
                    await window.meetingsModule.init();
                    break;
                case 'campaigns':
                    await window.campaignsModule.init();
                    break;
                case 'leads':
                    await window.leadsModule.init();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${module}:`, error);
            this.showError(`Erro ao carregar ${module}`);
        } finally {
            this.hideLoading();
        }
    }

    async loadDashboard() {
        try {
            await window.dashboardModule.init();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    setupGlobalSearch() {
        const searchInput = document.getElementById('globalSearch');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) return;

            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(query);
            }, 300);
        });
    }

    async performGlobalSearch(query) {
        try {
            // Search across all modules
            const [clients, projects, leads] = await Promise.all([
                window.api.clients.getAll(),
                window.api.projects.getAll(),
                window.api.leads.getAll()
            ]);

            const results = [];

            // Search clients
            clients.filter(client => 
                client.name.toLowerCase().includes(query.toLowerCase()) ||
                (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
                (client.company && client.company.toLowerCase().includes(query.toLowerCase()))
            ).forEach(client => {
                results.push({
                    type: 'client',
                    id: client.id,
                    title: client.name,
                    subtitle: client.company || client.email,
                    module: 'clients'
                });
            });

            // Search projects
            projects.filter(project => 
                project.name.toLowerCase().includes(query.toLowerCase()) ||
                (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
            ).forEach(project => {
                results.push({
                    type: 'project',
                    id: project.id,
                    title: project.name,
                    subtitle: project.client_name || 'Sem cliente',
                    module: 'projects'
                });
            });

            // Search leads
            leads.filter(lead => 
                lead.name.toLowerCase().includes(query.toLowerCase()) ||
                (lead.email && lead.email.toLowerCase().includes(query.toLowerCase())) ||
                (lead.company && lead.company.toLowerCase().includes(query.toLowerCase()))
            ).forEach(lead => {
                results.push({
                    type: 'lead',
                    id: lead.id,
                    title: lead.name,
                    subtitle: lead.company || lead.email,
                    module: 'leads'
                });
            });

            this.showSearchResults(results);
        } catch (error) {
            console.error('Error performing global search:', error);
        }
    }

    showSearchResults(results) {
        // Implementation for showing search results dropdown
        console.log('Search results:', results);
    }

    setupNotifications() {
        const notificationsBtn = document.getElementById('notificationsBtn');
        
        notificationsBtn.addEventListener('click', () => {
            this.showNotifications();
        });

        // Check for notifications periodically
        setInterval(() => {
            this.checkNotifications();
        }, 60000); // Check every minute
    }

    async checkNotifications() {
        try {
            // Check for overdue bills
            const bills = await window.api.bills.getAll();
            const overdueBills = bills.filter(bill => {
                const dueDate = new Date(bill.due_date);
                const today = new Date();
                return bill.status === 'pending' && dueDate < today;
            });

            // Check for upcoming meetings
            const meetings = await window.api.meetings.getAll();
            const upcomingMeetings = meetings.filter(meeting => {
                const meetingDate = new Date(meeting.meeting_date);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return meeting.status === 'scheduled' && meetingDate <= tomorrow && meetingDate >= new Date();
            });

            const notificationCount = overdueBills.length + upcomingMeetings.length;
            this.updateNotificationBadge(notificationCount);
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector('#notificationsBtn .badge');
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    showNotifications() {
        // Implementation for showing notifications panel
        console.log('Show notifications');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showError(message) {
        // Simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger-color);
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Simple success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);