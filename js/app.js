/**
 * CFTV Orçamento Visual - Script Principal
 * Arquivo principal de inicialização e coordenação de módulos
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { CANVAS_CONFIG, CAMERA_CONFIG, DEFAULT_BUDGET_ITEMS } from './config.js';
import { CanvasManager } from './canvas-manager.js';
import { BudgetManager } from './budget-manager.js';
import { ProposalGenerator } from './proposal-generator.js';
import { UIController } from './ui-controller.js';
import { EventManager } from './event-manager.js';

/**
 * Classe principal da aplicação CFTV
 */
class CFTVApp {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Estado da aplicação
        this.state = {
            cameras: [],
            walls: [],
            budgetItems: [],
            nextCameraId: 1,
            selectedCamera: null,
            currentFloor: 1,
            currentMode: 'CAMERA',
            isDrawing: false,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            currentWall: null
        };
        
        // Inicializar módulos
        this.initializeModules();
        this.setupElements();
        this.init();
    }
    
    /**
     * Inicializa todos os módulos da aplicação
     */
    initializeModules() {
        this.canvasManager = new CanvasManager(this.canvas, this.ctx, this.state);
        this.budgetManager = new BudgetManager(this.state);
        this.proposalGenerator = new ProposalGenerator(this.state, this.canvasManager);
        this.uiController = new UIController(this.state);
        this.eventManager = new EventManager(this.state, {
            canvas: this.canvasManager,
            budget: this.budgetManager,
            proposal: this.proposalGenerator,
            ui: this.uiController
        });
    }
    
    /**
     * Configura referências aos elementos do DOM
     */
    setupElements() {
        this.elements = {
            // Formulário e inputs
            clientNameInput: document.getElementById('clientName'),
            projectNotesTextarea: document.getElementById('projectNotes'),
            floorSelector: document.getElementById('floorSelector'),
            currentFloorNameSpan: document.getElementById('currentFloorName'),
            
            // Controles de modo
            modeCameraBtn: document.getElementById('modeCameraBtn'),
            modeWallBtn: document.getElementById('modeWallBtn'),
            modeInstructionSpan: document.getElementById('modeInstruction'),
            
            // Controles de câmera
            cameraTypeSelect: document.getElementById('cameraType'),
            coverageAngleInput: document.getElementById('coverageAngle'),
            coverageRangeInput: document.getElementById('coverageRange'),
            rangeValueSpan: document.getElementById('rangeValue'),
            rotationAngleInput: document.getElementById('rotationAngle'),
            rotationValueSpan: document.getElementById('rotationValue'),
            
            // Botões de ação
            clearMapBtn: document.getElementById('clearMapBtn'),
            removeSelectedCameraBtn: document.getElementById('removeSelectedCameraBtn'),
            undoLastWallBtn: document.getElementById('undoLastWallBtn'),
            
            // Orçamento
            addItemForm: document.getElementById('addItemForm'),
            itemNameInput: document.getElementById('itemName'),
            itemQtyInput: document.getElementById('itemQty'),
            itemPriceInput: document.getElementById('itemPrice'),
            itemImageUrlInput: document.getElementById('itemImageUrl'),
            itemCategorySelect: document.getElementById('itemCategory'),
            budgetListDiv: document.getElementById('budgetList'),
            totalBudgetSpan: document.getElementById('totalBudget'),
            
            // Proposta
            generateProposalBtn: document.getElementById('generateProposalBtn'),
            proposalModal: document.getElementById('proposalModal'),
            proposalContentDiv: document.getElementById('proposalContent'),
            btnCloseProposal: document.getElementById('btnCloseProposal'),
            currentCameraCountSpan: document.getElementById('currentCameraCount')
        };
        
        // Passar elementos para os módulos
        this.uiController.setElements(this.elements);
        this.eventManager.setElements(this.elements);
        this.budgetManager.setElements(this.elements);
        this.proposalGenerator.setElements(this.elements);
    }
    
    /**
     * Inicializa a aplicação
     */
    init() {
        // Configurar canvas
        this.canvas.width = CANVAS_CONFIG.WIDTH;
        this.canvas.height = CANVAS_CONFIG.HEIGHT;
        
        // Configurar estado inicial
        this.state.currentFloor = parseInt(this.elements.floorSelector.value);
        this.elements.currentFloorNameSpan.textContent = 
            this.elements.floorSelector.options[this.elements.floorSelector.selectedIndex].text;
        
        // Desenhar mapa inicial
        this.canvasManager.drawMap();
        
        // Renderizar lista de orçamento
        this.budgetManager.renderBudgetList();
        
        // Adicionar itens padrão
        this.addDefaultBudgetItems();
        
        // Configurar event listeners
        this.eventManager.setupEventListeners();
        
        console.log('✅ CFTV App inicializada com sucesso!');
    }
    
    /**
     * Adiciona itens padrão ao orçamento
     */
    addDefaultBudgetItems() {
        DEFAULT_BUDGET_ITEMS.forEach(item => {
            this.budgetManager.addBudgetItem(
                item.name, 
                item.qty, 
                item.price, 
                item.category, 
                item.imageUrl
            );
        });
    }
    
    /**
     * Método público para acessar o estado da aplicação
     */
    getState() {
        return this.state;
    }
    
    /**
     * Método público para acessar os módulos
     */
    getModules() {
        return {
            canvas: this.canvasManager,
            budget: this.budgetManager,
            proposal: this.proposalGenerator,
            ui: this.uiController,
            events: this.eventManager
        };
    }
}

// Função global para compatibilidade com HTML inline
window.editBudgetItem = function(id) {
    window.cftvApp.budgetManager.editBudgetItem(id);
};

window.removeBudgetItem = function(id) {
    window.cftvApp.budgetManager.removeBudgetItem(id);
};

window.saveEditedItem = function() {
    window.cftvApp.budgetManager.saveEditedItem();
};

window.closeEditModal = function() {
    window.cftvApp.budgetManager.closeEditModal();
};

// Inicializar aplicação quando DOM estiver carregado
window.addEventListener('DOMContentLoaded', () => {
    window.cftvApp = new CFTVApp();
});

export default CFTVApp;