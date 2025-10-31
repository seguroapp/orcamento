/**
 * CFTV Orçamento Visual - Gerenciador de Orçamento
 * Módulo responsável por todas as operações de orçamento
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { BUDGET_CATEGORIES, PROPOSAL_CONFIG } from './config.js';

/**
 * Classe responsável pelo gerenciamento do orçamento
 */
export class BudgetManager {
    constructor(appState) {
        this.state = appState;
        this.elements = null;
    }
    
    /**
     * Define referências aos elementos do DOM
     */
    setElements(elements) {
        this.elements = elements;
    }
    
    /**
     * Adiciona um novo item ao orçamento
     */
    addBudgetItem(name, qty, price, category, imageUrl = null) {
        const newItem = {
            id: Date.now() + Math.random(),
            name: name,
            qty: parseFloat(qty),
            price: parseFloat(price),
            category: category,
            imageUrl: imageUrl
        };
        
        this.state.budgetItems.push(newItem);
        this.renderBudgetList();
        return newItem;
    }
    
    /**
     * Remove um item do orçamento
     */
    removeBudgetItem(id) {
        this.state.budgetItems = this.state.budgetItems.filter(item => item.id !== id);
        this.renderBudgetList();
    }
    
    /**
     * Abre modal para editar um item do orçamento
     */
    editBudgetItem(id) {
        const item = this.state.budgetItems.find(item => item.id === id);
        if (!item) return;

        // Preencher modal de edição
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name;
        document.getElementById('editItemQty').value = item.qty;
        document.getElementById('editItemPrice').value = item.price;
        document.getElementById('editItemCategory').value = item.category;
        document.getElementById('editItemImageUrl').value = item.imageUrl || '';

        // Mostrar modal
        document.getElementById('editItemModal').classList.remove('hidden');
    }
    
    /**
     * Salva as alterações do item editado
     */
    saveEditedItem() {
        const id = parseFloat(document.getElementById('editItemId').value);
        const name = document.getElementById('editItemName').value;
        const qty = parseFloat(document.getElementById('editItemQty').value);
        const price = parseFloat(document.getElementById('editItemPrice').value);
        const category = document.getElementById('editItemCategory').value;
        const imageUrl = document.getElementById('editItemImageUrl').value;

        if (name && qty > 0 && price >= 0) {
            const itemIndex = this.state.budgetItems.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                this.state.budgetItems[itemIndex] = {
                    id: id,
                    name: name,
                    qty: qty,
                    price: price,
                    category: category,
                    imageUrl: imageUrl || null
                };
                this.renderBudgetList();
                this.closeEditModal();
            }
        }
    }
    
    /**
     * Fecha o modal de edição
     */
    closeEditModal() {
        document.getElementById('editItemModal').classList.add('hidden');
    }
    
    /**
     * Adiciona item de câmera ao orçamento automaticamente
     */
    addNewCameraBudgetItem(cameraId, cameraType) {
        // Verificar se já existe item para esta câmera
        const existingItem = this.state.budgetItems.find(item => 
            item.name.includes(`Câmera #C${cameraId}`)
        );
        
        if (!existingItem) {
            const cameraName = `Câmera #C${cameraId} - ${cameraType.toUpperCase()} (Posicionada)`;
            this.addBudgetItem(
                cameraName, 
                1, 
                PROPOSAL_CONFIG.DEFAULT_CAMERA_PRICE, 
                BUDGET_CATEGORIES.EQUIPMENT
            );
        }
    }
    
    /**
     * Remove item de câmera específica do orçamento
     */
    removeCameraBudgetItem(cameraId) {
        this.state.budgetItems = this.state.budgetItems.filter(item => 
            !item.name.includes(`Câmera #C${cameraId}`)
        );
        this.renderBudgetList();
    }
    
    /**
     * Remove todos os itens de câmera do orçamento
     */
    removeAllCameraBudgetItems() {
        this.state.budgetItems = this.state.budgetItems.filter(item => 
            !item.name.includes('Câmera #C')
        );
        this.renderBudgetList();
    }
    
    /**
     * Re-adiciona itens de câmera para câmeras existentes
     */
    syncCameraBudgetItems() {
        // Remover todos os itens de câmera
        this.removeAllCameraBudgetItems();
        
        // Adicionar itens para câmeras existentes
        this.state.cameras.forEach(cam => {
            this.addNewCameraBudgetItem(cam.id, cam.type);
        });
    }
    
    /**
     * Calcula o total do orçamento
     */
    calculateTotal() {
        return this.state.budgetItems.reduce((total, item) => {
            const subtotal = parseFloat(item.qty) * parseFloat(item.price);
            return total + (isNaN(subtotal) ? 0 : subtotal);
        }, 0);
    }
    
    /**
     * Calcula totais por categoria
     */
    calculateTotalsByCategory() {
        const totals = {
            equipment: 0,
            service: 0,
            accessory: 0
        };
        
        this.state.budgetItems.forEach(item => {
            const subtotal = parseFloat(item.qty) * parseFloat(item.price);
            if (!isNaN(subtotal)) {
                switch (item.category) {
                    case BUDGET_CATEGORIES.EQUIPMENT:
                        totals.equipment += subtotal;
                        break;
                    case BUDGET_CATEGORIES.SERVICE:
                        totals.service += subtotal;
                        break;
                    case BUDGET_CATEGORIES.ACCESSORY:
                        totals.accessory += subtotal;
                        break;
                }
            }
        });
        
        return totals;
    }
    
    /**
     * Renderiza a lista de itens do orçamento
     */
    renderBudgetList() {
        if (!this.elements?.budgetListDiv) return;
        
        this.elements.budgetListDiv.innerHTML = '';
        const total = this.calculateTotal();

        this.state.budgetItems.forEach(item => {
            const subtotal = parseFloat(item.qty) * parseFloat(item.price);
            
            const itemHtml = this.createBudgetItemHTML(item, subtotal);
            this.elements.budgetListDiv.innerHTML += itemHtml;
        });

        // Atualizar total
        if (this.elements?.totalBudgetSpan) {
            this.elements.totalBudgetSpan.textContent = total.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            });
        }
    }
    
    /**
     * Cria HTML para um item do orçamento
     */
    createBudgetItemHTML(item, subtotal) {
        return `
            <div class="flex justify-between items-center p-2 bg-white rounded-md border border-gray-200">
                <span class="text-xs font-medium text-gray-700 w-2/5 truncate" title="${item.name}">
                    ${item.name} (${item.qty}x)
                </span>
                <span class="text-sm font-semibold text-gray-800">
                    ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <div class="flex gap-1">
                    <button onclick="editBudgetItem(${item.id})" 
                            class="text-blue-500 hover:text-blue-700 text-sm" 
                            title="Editar item">
                        ✏️
                    </button>
                    <button onclick="removeBudgetItem(${item.id})" 
                            class="text-red-500 hover:text-red-700 text-sm" 
                            title="Remover item">
                        &times;
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Processa formulário de adição de item
     */
    processAddItemForm(formData) {
        const { name, qty, price, category, imageUrl } = formData;
        
        if (name && qty > 0 && price >= 0) {
            this.addBudgetItem(name, qty, price, category, imageUrl);
            return true;
        }
        return false;
    }
    
    /**
     * Limpa formulário de adição
     */
    clearAddItemForm() {
        if (!this.elements) return;
        
        this.elements.itemNameInput.value = '';
        this.elements.itemQtyInput.value = '1';
        this.elements.itemPriceInput.value = '';
        this.elements.itemImageUrlInput.value = '';
    }
    
    /**
     * Exporta dados do orçamento
     */
    exportBudgetData() {
        return {
            items: this.state.budgetItems,
            total: this.calculateTotal(),
            totalsByCategory: this.calculateTotalsByCategory(),
            itemCount: this.state.budgetItems.length
        };
    }
    
    /**
     * Importa dados do orçamento
     */
    importBudgetData(data) {
        if (data && Array.isArray(data.items)) {
            this.state.budgetItems = data.items;
            this.renderBudgetList();
            return true;
        }
        return false;
    }
}