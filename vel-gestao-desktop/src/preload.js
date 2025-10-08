const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    // Client operations
    clients: {
        getAll: () => ipcRenderer.invoke('clients:getAll'),
        getById: (id) => ipcRenderer.invoke('clients:getById', id),
        create: (client) => ipcRenderer.invoke('clients:create', client),
        update: (id, client) => ipcRenderer.invoke('clients:update', id, client),
        delete: (id) => ipcRenderer.invoke('clients:delete', id)
    },

    // Project operations
    projects: {
        getAll: () => ipcRenderer.invoke('projects:getAll'),
        getById: (id) => ipcRenderer.invoke('projects:getById', id),
        create: (project) => ipcRenderer.invoke('projects:create', project),
        update: (id, project) => ipcRenderer.invoke('projects:update', id, project),
        delete: (id) => ipcRenderer.invoke('projects:delete', id)
    },

    // Bills operations
    bills: {
        getAll: () => ipcRenderer.invoke('bills:getAll'),
        getById: (id) => ipcRenderer.invoke('bills:getById', id),
        create: (bill) => ipcRenderer.invoke('bills:create', bill),
        update: (id, bill) => ipcRenderer.invoke('bills:update', id, bill),
        delete: (id) => ipcRenderer.invoke('bills:delete', id)
    },

    // Meetings operations
    meetings: {
        getAll: () => ipcRenderer.invoke('meetings:getAll'),
        getById: (id) => ipcRenderer.invoke('meetings:getById', id),
        create: (meeting) => ipcRenderer.invoke('meetings:create', meeting),
        update: (id, meeting) => ipcRenderer.invoke('meetings:update', id, meeting),
        delete: (id) => ipcRenderer.invoke('meetings:delete', id)
    },

    // Leads operations
    leads: {
        getAll: () => ipcRenderer.invoke('leads:getAll'),
        getById: (id) => ipcRenderer.invoke('leads:getById', id),
        create: (lead) => ipcRenderer.invoke('leads:create', lead),
        update: (id, lead) => ipcRenderer.invoke('leads:update', id, lead),
        delete: (id) => ipcRenderer.invoke('leads:delete', id)
    },

    // Marketing campaigns operations
    campaigns: {
        getAll: () => ipcRenderer.invoke('campaigns:getAll'),
        getById: (id) => ipcRenderer.invoke('campaigns:getById', id),
        create: (campaign) => ipcRenderer.invoke('campaigns:create', campaign),
        update: (id, campaign) => ipcRenderer.invoke('campaigns:update', id, campaign),
        delete: (id) => ipcRenderer.invoke('campaigns:delete', id)
    }
});