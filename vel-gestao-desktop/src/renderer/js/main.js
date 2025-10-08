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
        console.log('Setting up navigation...');
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = link.getAttribute('data-module');
                console.log('Navigation clicked:', module);
                this.navigateToModule(module);
            });
        });
    }

    navigateToModule(moduleName) {
        console.log('Navigating to module:', moduleName);
        
        // Hide all modules
        const modules = document.querySelectorAll('.module-content');
        console.log('Found modules:', modules.length);
        modules.forEach(module => {
            module.style.display = 'none';
        });

        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Show selected module - using correct ID format
        const targetModule = document.getElementById(`${moduleName}-content`);
        console.log('Target module element:', targetModule);
        
        if (targetModule) {
            targetModule.style.display = 'block';
            this.loadModuleContent(moduleName);
        } else {
            console.error(`Module element not found: ${moduleName}-content`);
        }
    }

    async loadModuleContent(module) {
        this.showLoading();

        try {
            switch (module) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'clients':
                    await this.loadModuleHTML('clients');
                    if (window.clientsModule) {
                        await window.clientsModule.init();
                    }
                    break;
                case 'projects':
                    await this.loadModuleHTML('projects');
                    if (window.projectsModule) {
                        await window.projectsModule.init();
                    }
                    break;
                case 'bills':
                    await this.loadModuleHTML('bills');
                    if (window.billsModule) {
                        await window.billsModule.init();
                    }
                    break;
                case 'meetings':
                    await this.loadModuleHTML('meetings');
                    if (window.meetingsModule) {
                        await window.meetingsModule.init();
                    }
                    break;
                case 'campaigns':
                    await this.loadModuleHTML('campaigns');
                    if (window.campaignsModule) {
                        await window.campaignsModule.init();
                    }
                    break;
                case 'leads':
                    await this.loadModuleHTML('leads');
                    if (window.leadsModule) {
                        await window.leadsModule.init();
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${module}:`, error);
            this.showError(`Erro ao carregar ${module}`);
        } finally {
            this.hideLoading();
        }
    }

    async loadModuleHTML(module) {
        const moduleContent = document.getElementById(`${module}-content`);
        
        // Check if content is already loaded
        if (moduleContent.innerHTML.trim() !== '') {
            return;
        }

        try {
            const response = await fetch(`modules/${module}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${module}.html`);
            }
            const html = await response.text();
            moduleContent.innerHTML = html;
        } catch (error) {
            console.error(`Error loading ${module} HTML:`, error);
            moduleContent.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar módulo</h3>
                    <p>Não foi possível carregar o conteúdo de ${module}</p>
                </div>
            `;
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
    console.log('DOM loaded, initializing modules...');
    
    // Initialize modules first
    try {
        window.dashboardModule = window.dashboardModule || new DashboardModule();
        window.clientsModule = new ClientsModule();
        window.projectsModule = new ProjectsModule();
        window.billsModule = new BillsModule();
        window.meetingsModule = new MeetingsModule();
        window.campaignsModule = new CampaignsModule();
        window.leadsModule = new LeadsModule();
        
        console.log('All modules initialized successfully');
        
        // Then initialize the app
        window.app = new App();
        
        // Make notification functions globally available
        window.showError = (message) => window.app.showError(message);
        window.showSuccess = (message) => window.app.showSuccess(message);
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing modules:', error);
    }
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