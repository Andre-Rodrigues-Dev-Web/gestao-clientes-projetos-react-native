// Utility functions for the application

class Utils {
    // Date formatting
    static formatDate(dateString, format = 'dd/mm/yyyy') {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'dd/mm/yyyy hh:mm':
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'relative':
                return this.getRelativeTime(date);
            default:
                return `${day}/${month}/${year}`;
        }
    }

    static getRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} meses atrás`;
        return `${Math.floor(diffInSeconds / 31536000)} anos atrás`;
    }

    // Currency formatting
    static formatCurrency(amount, currency = 'BRL') {
        if (amount === null || amount === undefined) return '';
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Phone formatting
    static formatPhone(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }

    // CPF/CNPJ formatting
    static formatDocument(document) {
        if (!document) return '';
        
        const cleaned = document.replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            // CPF
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (cleaned.length === 14) {
            // CNPJ
            return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        
        return document;
    }

    // Status badge generation
    static getStatusBadge(status, type = 'default') {
        const statusMap = {
            // General statuses
            'active': { class: 'status-active', text: 'Ativo' },
            'inactive': { class: 'status-inactive', text: 'Inativo' },
            'pending': { class: 'status-pending', text: 'Pendente' },
            'completed': { class: 'status-completed', text: 'Concluído' },
            'cancelled': { class: 'status-cancelled', text: 'Cancelado' },
            
            // Project statuses
            'planning': { class: 'status-planning', text: 'Planejamento' },
            'in-progress': { class: 'status-in-progress', text: 'Em Andamento' },
            'on-hold': { class: 'status-pending', text: 'Pausado' },
            'finished': { class: 'status-completed', text: 'Finalizado' },
            
            // Bill statuses
            'paid': { class: 'status-completed', text: 'Pago' },
            'overdue': { class: 'status-overdue', text: 'Vencido' },
            
            // Meeting statuses
            'scheduled': { class: 'status-pending', text: 'Agendado' },
            'confirmed': { class: 'status-active', text: 'Confirmado' },
            'done': { class: 'status-completed', text: 'Realizado' },
            
            // Lead statuses
            'new': { class: 'status-pending', text: 'Novo' },
            'contacted': { class: 'status-in-progress', text: 'Contatado' },
            'qualified': { class: 'status-active', text: 'Qualificado' },
            'converted': { class: 'status-completed', text: 'Convertido' },
            'lost': { class: 'status-cancelled', text: 'Perdido' }
        };
        
        const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
        return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    // Priority badge generation
    static getPriorityBadge(priority) {
        const priorityMap = {
            'low': { class: 'priority-low', text: 'Baixa', color: '#10b981' },
            'medium': { class: 'priority-medium', text: 'Média', color: '#f59e0b' },
            'high': { class: 'priority-high', text: 'Alta', color: '#ef4444' },
            'urgent': { class: 'priority-urgent', text: 'Urgente', color: '#dc2626' }
        };
        
        const priorityInfo = priorityMap[priority] || priorityMap['medium'];
        return `<span class="priority-badge ${priorityInfo.class}" style="background-color: ${priorityInfo.color}20; color: ${priorityInfo.color};">${priorityInfo.text}</span>`;
    }

    // Progress bar generation
    static getProgressBar(progress, showText = true) {
        const percentage = Math.min(Math.max(progress || 0, 0), 100);
        const color = percentage < 30 ? '#ef4444' : percentage < 70 ? '#f59e0b' : '#10b981';
        
        return `
            <div class="progress-bar" style="background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden;">
                <div class="progress-fill" style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
            </div>
            ${showText ? `<span class="progress-text" style="font-size: 12px; color: #64748b; margin-left: 8px;">${percentage}%</span>` : ''}
        `;
    }

    // Validation functions
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }

    static validateCPF(cpf) {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length !== 11) return false;
        
        // Check for repeated digits
        if (/^(\d)\1{10}$/.test(cleaned)) return false;
        
        // Validate check digits
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(10))) return false;
        
        return true;
    }

    static validateCNPJ(cnpj) {
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return false;
        
        // Check for repeated digits
        if (/^(\d)\1{13}$/.test(cleaned)) return false;
        
        // Validate check digits
        let length = cleaned.length - 2;
        let numbers = cleaned.substring(0, length);
        let digits = cleaned.substring(length);
        let sum = 0;
        let pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(0))) return false;
        
        length = length + 1;
        numbers = cleaned.substring(0, length);
        sum = 0;
        pos = length - 7;
        
        for (let i = length; i >= 1; i--) {
            sum += numbers.charAt(length - i) * pos--;
            if (pos < 2) pos = 9;
        }
        
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        if (result !== parseInt(digits.charAt(1))) return false;
        
        return true;
    }

    // String utilities
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static truncate(str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    static slugify(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Array utilities
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    }

    static sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });
    }

    // DOM utilities
    static createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Local storage utilities
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
}

// Make Utils available globally
window.Utils = Utils;