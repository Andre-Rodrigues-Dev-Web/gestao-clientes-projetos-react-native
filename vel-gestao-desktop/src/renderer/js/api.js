// API wrapper using the exposed window.api from preload.js
class API {
    constructor() {
        // Check if window.api is available from preload.js
        if (!window.api) {
            console.error('window.api is not available. Make sure preload.js is loaded correctly.');
            return;
        }
        
        // Use the exposed API from preload.js
        this.clients = window.api.clients;
        this.projects = window.api.projects;
        this.bills = window.api.bills;
        this.meetings = window.api.meetings;
        this.campaigns = window.api.campaigns;
        this.leads = window.api.leads;
    }
}

// Initialize the API wrapper and make it globally available
window.apiWrapper = new API();