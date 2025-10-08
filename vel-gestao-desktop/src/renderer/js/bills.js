class BillsModule {
    constructor() {
        this.bills = [];
        this.filteredBills = [];
        this.currentBill = null;
        this.isEditing = false;
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.filters = {
            search: '',
            status: 'all',
            category: 'all',
            dateRange: 'all'
        };
    }

    async init() {
        this.setupEventListeners();
        await this.loadBills();
        this.renderBillsList();
        this.updateStats();
        this.checkOverdueBills();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('billsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Filter selects
        const statusFilter = document.getElementById('billsStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        const categoryFilter = document.getElementById('billsCategoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        const dateRangeFilter = document.getElementById('billsDateRangeFilter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.applyFilters();
            });
        }

        // Add bill button
        const addButton = document.getElementById('addBillBtn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showBillForm());
        }

        // Form submit
        const form = document.getElementById('billForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Cancel button
        const cancelButton = document.getElementById('cancelBillBtn');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => this.hideBillForm());
        }
    }

    async loadBills() {
        try {
            this.bills = await window.api.bills.getAll();
            this.filteredBills = [...this.bills];
        } catch (error) {
            console.error('Error loading bills:', error);
            window.showError('Erro ao carregar contas a pagar');
        }
    }

    applyFilters() {
        this.filteredBills = this.bills.filter(bill => {
            const matchesSearch = !this.filters.search || 
                bill.description.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                bill.supplier.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                bill.category.toLowerCase().includes(this.filters.search.toLowerCase());

            const matchesStatus = this.filters.status === 'all' || bill.status === this.filters.status;
            const matchesCategory = this.filters.category === 'all' || bill.category === this.filters.category;
            
            let matchesDateRange = true;
            if (this.filters.dateRange !== 'all') {
                const today = new Date();
                const billDate = new Date(bill.due_date);
                
                switch (this.filters.dateRange) {
                    case 'overdue':
                        matchesDateRange = billDate < today && bill.status === 'pending';
                        break;
                    case 'today':
                        matchesDateRange = billDate.toDateString() === today.toDateString();
                        break;
                    case 'week':
                        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        matchesDateRange = billDate >= today && billDate <= nextWeek;
                        break;
                    case 'month':
                        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                        matchesDateRange = billDate >= today && billDate <= nextMonth;
                        break;
                }
            }

            return matchesSearch && matchesStatus && matchesCategory && matchesDateRange;
        });

        this.currentPage = 1;
        this.renderBillsList();
        this.updateStats();
    }

    renderBillsList() {
        const container = document.getElementById('billsList');
        if (!container) return;

        if (this.filteredBills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>Nenhuma conta encontrada</h3>
                    <p>Adicione sua primeira conta a pagar ou ajuste os filtros</p>
                    <button class="btn btn-primary" onclick="billsModule.showBillForm()">
                        <i class="fas fa-plus"></i> Nova Conta
                    </button>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedBills = this.filteredBills.slice(startIndex, endIndex);

        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Fornecedor</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedBills.map(bill => this.renderBillRow(bill)).join('')}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    }

    renderBillRow(bill) {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        const isOverdue = dueDate < today && bill.status === 'pending';
        const isDueToday = dueDate.toDateString() === today.toDateString();
        
        let rowClass = '';
        if (isOverdue) rowClass = 'overdue-row';
        else if (isDueToday) rowClass = 'due-today-row';

        return `
            <tr class="${rowClass}">
                <td>
                    <div class="bill-info">
                        <div class="bill-description">${bill.description}</div>
                        ${bill.notes ? `<div class="bill-notes">${Utils.truncate(bill.notes, 50)}</div>` : ''}
                    </div>
                </td>
                <td>${bill.supplier}</td>
                <td>
                    <span class="category-badge category-${Utils.slugify(bill.category)}">
                        ${bill.category}
                    </span>
                </td>
                <td class="amount-cell">
                    <span class="amount">${Utils.formatCurrency(bill.amount)}</span>
                </td>
                <td>
                    <div class="due-date ${isOverdue ? 'overdue' : isDueToday ? 'due-today' : ''}">
                        <i class="fas fa-calendar-alt"></i>
                        ${Utils.formatDate(bill.due_date)}
                        ${isOverdue ? '<span class="overdue-label">Vencida</span>' : ''}
                        ${isDueToday ? '<span class="due-today-label">Hoje</span>' : ''}
                    </div>
                </td>
                <td>${this.getStatusBadge(bill.status, isOverdue)}</td>
                <td>
                    <div class="action-buttons">
                        ${bill.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="billsModule.markAsPaid('${bill.id}')" title="Marcar como Paga">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="billsModule.editBill('${bill.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="billsModule.deleteBill('${bill.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getStatusBadge(status, isOverdue = false) {
        if (status === 'pending' && isOverdue) {
            return '<span class="status-badge overdue">Vencida</span>';
        }
        
        const statusLabels = {
            'pending': 'Pendente',
            'paid': 'Paga',
            'cancelled': 'Cancelada'
        };
        
        return `<span class="status-badge ${status}">${statusLabels[status] || status}</span>`;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredBills.length / this.itemsPerPage);
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination">';
        
        // Previous button
        pagination += `
            <button class="btn btn-sm ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="billsModule.goToPage(${this.currentPage - 1})" 
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
                            onclick="billsModule.goToPage(${i})">
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
                    onclick="billsModule.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination += '</div>';
        return pagination;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredBills.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderBillsList();
        }
    }

    updateStats() {
        const totalBills = this.bills.length;
        const pendingBills = this.bills.filter(b => b.status === 'pending').length;
        const paidBills = this.bills.filter(b => b.status === 'paid').length;
        
        const today = new Date();
        const overdueBills = this.bills.filter(b => 
            b.status === 'pending' && new Date(b.due_date) < today
        ).length;

        const totalAmount = this.bills
            .filter(b => b.status === 'pending')
            .reduce((sum, bill) => sum + bill.amount, 0);

        document.getElementById('totalBillsCount').textContent = totalBills;
        document.getElementById('pendingBillsCount').textContent = pendingBills;
        document.getElementById('paidBillsCount').textContent = paidBills;
        document.getElementById('overdueBillsCount').textContent = overdueBills;
        document.getElementById('totalAmountPending').textContent = Utils.formatCurrency(totalAmount);
    }

    checkOverdueBills() {
        const today = new Date();
        const overdueBills = this.bills.filter(bill => 
            bill.status === 'pending' && new Date(bill.due_date) < today
        );

        if (overdueBills.length > 0) {
            const message = `Você tem ${overdueBills.length} conta(s) vencida(s)!`;
            window.showNotification(message, 'warning');
        }
    }

    showBillForm(bill = null) {
        this.currentBill = bill;
        this.isEditing = !!bill;

        const modal = document.getElementById('billModal');
        const form = document.getElementById('billForm');
        const title = document.getElementById('billModalTitle');

        title.textContent = this.isEditing ? 'Editar Conta' : 'Nova Conta';

        if (this.isEditing) {
            this.populateForm(bill);
        } else {
            form.reset();
            // Set default due date to next month
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('billDueDate').value = nextMonth.toISOString().split('T')[0];
        }

        modal.style.display = 'flex';
    }

    hideBillForm() {
        const modal = document.getElementById('billModal');
        modal.style.display = 'none';
        this.currentBill = null;
        this.isEditing = false;
    }

    populateForm(bill) {
        document.getElementById('billDescription').value = bill.description || '';
        document.getElementById('billSupplier').value = bill.supplier || '';
        document.getElementById('billCategory').value = bill.category || '';
        document.getElementById('billAmount').value = bill.amount || '';
        document.getElementById('billDueDate').value = bill.due_date ? bill.due_date.split('T')[0] : '';
        document.getElementById('billStatus').value = bill.status || 'pending';
        document.getElementById('billNotes').value = bill.notes || '';
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const billData = {
            description: formData.get('description'),
            supplier: formData.get('supplier'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            due_date: formData.get('due_date'),
            status: formData.get('status'),
            notes: formData.get('notes')
        };

        // Validation
        if (!this.validateBillData(billData)) {
            return;
        }

        try {
            window.showLoading();

            if (this.isEditing) {
                await window.api.bills.update(this.currentBill.id, billData);
                window.showSuccess('Conta atualizada com sucesso!');
            } else {
                await window.api.bills.create(billData);
                window.showSuccess('Conta criada com sucesso!');
            }

            await this.loadBills();
            this.applyFilters();
            this.hideBillForm();
        } catch (error) {
            console.error('Error saving bill:', error);
            window.showError('Erro ao salvar conta');
        } finally {
            window.hideLoading();
        }
    }

    validateBillData(data) {
        if (!data.description.trim()) {
            window.showError('Descrição é obrigatória');
            return false;
        }

        if (!data.supplier.trim()) {
            window.showError('Fornecedor é obrigatório');
            return false;
        }

        if (!data.category.trim()) {
            window.showError('Categoria é obrigatória');
            return false;
        }

        if (!data.amount || data.amount <= 0) {
            window.showError('Valor deve ser maior que zero');
            return false;
        }

        if (!data.due_date) {
            window.showError('Data de vencimento é obrigatória');
            return false;
        }

        return true;
    }

    async markAsPaid(billId) {
        const bill = this.bills.find(b => b.id === billId);
        if (!bill) return;

        const confirmed = confirm(`Marcar a conta "${bill.description}" como paga?`);
        if (!confirmed) return;

        try {
            window.showLoading();
            await window.api.bills.update(billId, { status: 'paid' });
            window.showSuccess('Conta marcada como paga!');
            await this.loadBills();
            this.applyFilters();
        } catch (error) {
            console.error('Error marking bill as paid:', error);
            window.showError('Erro ao marcar conta como paga');
        } finally {
            window.hideLoading();
        }
    }

    async editBill(billId) {
        const bill = this.bills.find(b => b.id === billId);
        if (!bill) return;

        this.showBillForm(bill);
    }

    async deleteBill(billId) {
        const bill = this.bills.find(b => b.id === billId);
        if (!bill) return;

        const confirmed = confirm(`Tem certeza que deseja excluir a conta "${bill.description}"?`);
        if (!confirmed) return;

        try {
            window.showLoading();
            await window.api.bills.delete(billId);
            window.showSuccess('Conta excluída com sucesso!');
            await this.loadBills();
            this.applyFilters();
        } catch (error) {
            console.error('Error deleting bill:', error);
            window.showError('Erro ao excluir conta');
        } finally {
            window.hideLoading();
        }
    }

    async refresh() {
        await this.loadBills();
        this.applyFilters();
        this.checkOverdueBills();
    }
}

// Initialize bills module
window.billsModule = new BillsModule();