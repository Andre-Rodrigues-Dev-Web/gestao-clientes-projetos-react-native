const { ipcRenderer } = require('electron');

class API {
    constructor() {
        this.clients = new ClientsAPI();
        this.projects = new ProjectsAPI();
        this.bills = new BillsAPI();
        this.meetings = new MeetingsAPI();
        this.campaigns = new CampaignsAPI();
        this.leads = new LeadsAPI();
    }
}

class ClientsAPI {
    async getAll() {
        return await ipcRenderer.invoke('clients:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('clients:getById', id);
    }

    async create(client) {
        return await ipcRenderer.invoke('clients:create', client);
    }

    async update(id, client) {
        return await ipcRenderer.invoke('clients:update', id, client);
    }

    async delete(id) {
        return await ipcRenderer.invoke('clients:delete', id);
    }
}

class ProjectsAPI {
    async getAll() {
        return await ipcRenderer.invoke('projects:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('projects:getById', id);
    }

    async create(project) {
        return await ipcRenderer.invoke('projects:create', project);
    }

    async update(id, project) {
        return await ipcRenderer.invoke('projects:update', id, project);
    }

    async delete(id) {
        return await ipcRenderer.invoke('projects:delete', id);
    }
}

class BillsAPI {
    async getAll() {
        return await ipcRenderer.invoke('bills:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('bills:getById', id);
    }

    async create(bill) {
        return await ipcRenderer.invoke('bills:create', bill);
    }

    async update(id, bill) {
        return await ipcRenderer.invoke('bills:update', id, bill);
    }

    async delete(id) {
        return await ipcRenderer.invoke('bills:delete', id);
    }
}

class MeetingsAPI {
    async getAll() {
        return await ipcRenderer.invoke('meetings:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('meetings:getById', id);
    }

    async create(meeting) {
        return await ipcRenderer.invoke('meetings:create', meeting);
    }

    async update(id, meeting) {
        return await ipcRenderer.invoke('meetings:update', id, meeting);
    }

    async delete(id) {
        return await ipcRenderer.invoke('meetings:delete', id);
    }
}

class CampaignsAPI {
    async getAll() {
        return await ipcRenderer.invoke('campaigns:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('campaigns:getById', id);
    }

    async create(campaign) {
        return await ipcRenderer.invoke('campaigns:create', campaign);
    }

    async update(id, campaign) {
        return await ipcRenderer.invoke('campaigns:update', id, campaign);
    }

    async delete(id) {
        return await ipcRenderer.invoke('campaigns:delete', id);
    }
}

class LeadsAPI {
    async getAll() {
        return await ipcRenderer.invoke('leads:getAll');
    }

    async getById(id) {
        return await ipcRenderer.invoke('leads:getById', id);
    }

    async create(lead) {
        return await ipcRenderer.invoke('leads:create', lead);
    }

    async update(id, lead) {
        return await ipcRenderer.invoke('leads:update', id, lead);
    }

    async delete(id) {
        return await ipcRenderer.invoke('leads:delete', id);
    }
}

// Initialize API instance
window.api = new API();