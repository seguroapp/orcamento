/**
 * CFTV Orçamento Visual - Controlador de Interface
 * Módulo responsável pelo controle da interface do usuário
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { EDIT_MODES, LABELS } from './config.js';

/**
 * Classe responsável pelo controle da interface do usuário
 */
export class UIController {
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
     * Atualiza controles da câmera selecionada
     */
    updateCameraControls(camera) {
        if (!this.elements || !camera) return;
        
        this.elements.cameraTypeSelect.value = camera.type;
        this.elements.coverageAngleInput.value = camera.angle;
        this.elements.coverageRangeInput.value = camera.range;
        this.elements.rangeValueSpan.textContent = `${camera.range}m`;
        this.elements.rotationAngleInput.value = camera.rotation;
        this.elements.rotationValueSpan.textContent = `${camera.rotation}°`;
        
        this.elements.removeSelectedCameraBtn.classList.remove('hidden');
    }
    
    /**
     * Reseta controles para valores padrão
     */
    resetCameraControls() {
        if (!this.elements) return;
        
        this.elements.cameraTypeSelect.value = 'dome';
        this.elements.coverageAngleInput.value = 90;
        this.elements.coverageRangeInput.value = 50;
        this.elements.rangeValueSpan.textContent = '50m';
        this.elements.rotationAngleInput.value = 0;
        this.elements.rotationValueSpan.textContent = '0°';
        
        this.elements.removeSelectedCameraBtn.classList.add('hidden');
    }
    
    /**
     * Atualiza valor do alcance da câmera
     */
    updateRangeValue(value) {
        if (this.elements?.rangeValueSpan) {
            this.elements.rangeValueSpan.textContent = `${value}m`;
        }
    }
    
    /**
     * Atualiza valor da rotação da câmera
     */
    updateRotationValue(value) {
        if (this.elements?.rotationValueSpan) {
            this.elements.rotationValueSpan.textContent = `${value}°`;
        }
    }
    
    /**
     * Alterna para modo câmera
     */
    switchToCameraMode() {
        this.state.currentMode = EDIT_MODES.CAMERA;
        
        if (!this.elements) return;
        
        // Atualizar aparência dos botões
        this.elements.modeCameraBtn.classList.add('mode-button-active', 'bg-indigo-500', 'text-white');
        this.elements.modeCameraBtn.classList.remove('bg-white', 'text-indigo-700');
        this.elements.modeWallBtn.classList.remove('mode-button-active', 'bg-indigo-500', 'text-white');
        this.elements.modeWallBtn.classList.add('bg-white', 'text-indigo-700');
        
        // Atualizar instruções
        this.elements.modeInstructionSpan.textContent = LABELS.INSTRUCTIONS.CAMERA_MODE;
        
        // Atualizar cursor do canvas
        if (this.elements.canvas) {
            this.elements.canvas.style.cursor = 'crosshair';
        }
        
        // Esconder botões específicos do modo parede
        this.elements.removeSelectedCameraBtn.classList.add('hidden');
        this.elements.undoLastWallBtn.classList.add('hidden');
    }
    
    /**
     * Alterna para modo parede
     */
    switchToWallMode() {
        this.state.currentMode = EDIT_MODES.WALL;
        
        if (!this.elements) return;
        
        // Atualizar aparência dos botões
        this.elements.modeWallBtn.classList.add('mode-button-active', 'bg-indigo-500', 'text-white');
        this.elements.modeWallBtn.classList.remove('bg-white', 'text-indigo-700');
        this.elements.modeCameraBtn.classList.remove('mode-button-active', 'bg-indigo-500', 'text-white');
        this.elements.modeCameraBtn.classList.add('bg-white', 'text-indigo-700');
        
        // Atualizar instruções
        this.elements.modeInstructionSpan.textContent = LABELS.INSTRUCTIONS.WALL_MODE;
        
        // Atualizar cursor do canvas
        if (this.elements.canvas) {
            this.elements.canvas.style.cursor = 'move';
        }
        
        // Mostrar/esconder botões apropriados
        this.elements.removeSelectedCameraBtn.classList.add('hidden');
        this.elements.undoLastWallBtn.classList.remove('hidden');
    }
    
    /**
     * Atualiza nome do andar atual
     */
    updateCurrentFloorName(floorIndex) {
        if (!this.elements?.currentFloorNameSpan || !this.elements?.floorSelector) return;
        
        const option = this.elements.floorSelector.options[this.elements.floorSelector.selectedIndex];
        if (option) {
            this.elements.currentFloorNameSpan.textContent = option.text;
        }
    }
    
    /**
     * Atualiza visibilidade do botão desfazer parede
     */
    updateUndoWallButtonVisibility() {
        if (!this.elements?.undoLastWallBtn) return;
        
        if (this.state.currentMode === EDIT_MODES.WALL) {
            this.elements.undoLastWallBtn.classList.remove('hidden');
        } else {
            this.elements.undoLastWallBtn.classList.add('hidden');
        }
    }
    
    /**
     * Atualiza contador de câmeras no andar atual
     */
    updateCameraCount() {
        if (!this.elements?.currentCameraCountSpan) return;
        
        const floorCameras = this.state.cameras.filter(cam => cam.floor === this.state.currentFloor);
        this.elements.currentCameraCountSpan.textContent = floorCameras.length;
    }
    
    /**
     * Limpa formulário de adição de item
     */
    clearAddItemForm() {
        if (!this.elements) return;
        
        this.elements.itemNameInput.value = '';
        this.elements.itemQtyInput.value = '1';
        this.elements.itemPriceInput.value = '';
        this.elements.itemImageUrlInput.value = '';
    }
    
    /**
     * Obtém dados do formulário de adição de item
     */
    getAddItemFormData() {
        if (!this.elements) return null;
        
        return {
            name: this.elements.itemNameInput.value,
            qty: this.elements.itemQtyInput.value,
            price: this.elements.itemPriceInput.value,
            category: this.elements.itemCategorySelect.value,
            imageUrl: this.elements.itemImageUrlInput.value
        };
    }
    
    /**
     * Valida dados do formulário de adição de item
     */
    validateAddItemForm(data) {
        return data.name && data.qty > 0 && data.price >= 0;
    }
    
    /**
     * Exibe mensagem de feedback (placeholder para futuras implementações)
     */
    showFeedback(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Implementar sistema de notificações se necessário
    }
    
    /**
     * Atualiza instrução do modo atual
     */
    updateModeInstruction(message) {
        if (this.elements?.modeInstructionSpan) {
            this.elements.modeInstructionSpan.textContent = message;
        }
    }
    
    /**
     * Atualiza cursor do canvas
     */
    updateCanvasCursor(cursor) {
        const canvas = document.getElementById('mapCanvas');
        if (canvas) {
            canvas.style.cursor = cursor;
        }
    }
    
    /**
     * Obtém informações do cliente
     */
    getClientInfo() {
        return {
            name: this.elements?.clientNameInput?.value || 'Cliente Não Especificado',
            notes: this.elements?.projectNotesTextarea?.value || 'Nenhuma observação técnica fornecida.'
        };
    }
    
    /**
     * Atualiza estado visual dos botões de modo
     */
    updateModeButtons() {
        if (this.state.currentMode === EDIT_MODES.CAMERA) {
            this.switchToCameraMode();
        } else if (this.state.currentMode === EDIT_MODES.WALL) {
            this.switchToWallMode();
        }
    }
    
    /**
     * Inicializa estado da interface
     */
    initializeUI() {
        this.resetCameraControls();
        this.updateModeButtons();
        this.updateCameraCount();
        this.updateCurrentFloorName(this.state.currentFloor);
    }
}