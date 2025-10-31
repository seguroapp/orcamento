/**
 * CFTV Orçamento Visual - Gerenciador de Eventos
 * Módulo responsável por todos os event listeners e interações
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { EDIT_MODES, COLORS, CANVAS_CONFIG } from './config.js';

/**
 * Classe responsável pelo gerenciamento de eventos
 */
export class EventManager {
    constructor(appState, modules) {
        this.state = appState;
        this.modules = modules;
        this.elements = null;
    }
    
    /**
     * Define referências aos elementos do DOM
     */
    setElements(elements) {
        this.elements = elements;
    }
    
    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        this.setupCanvasEvents();
        this.setupCameraControlEvents();
        this.setupFloorEvents();
        this.setupModeEvents();
        this.setupButtonEvents();
        this.setupFormEvents();
        this.setupModalEvents();
    }
    
    /**
     * Configura eventos do canvas
     */
    setupCanvasEvents() {
        const canvas = document.getElementById('mapCanvas');
        if (!canvas) return;
        
        canvas.addEventListener('mousedown', (event) => this.handleCanvasMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.handleCanvasMouseMove(event));
        canvas.addEventListener('mouseup', (event) => this.handleCanvasMouseUp(event));
        canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
    }
    
    /**
     * Manipula mousedown no canvas
     */
    handleCanvasMouseDown(event) {
        const { x, y } = this.modules.canvas.getCanvasCoords(event);
        
        if (this.state.currentMode === EDIT_MODES.WALL) {
            this.startWallDrawing(x, y);
        } else if (this.state.currentMode === EDIT_MODES.CAMERA) {
            this.handleCameraMouseDown(x, y);
        }
    }
    
    /**
     * Inicia desenho de parede
     */
    startWallDrawing(x, y) {
        this.state.isDrawing = true;
        this.state.currentWall = {
            floor: this.state.currentFloor,
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            color: COLORS.WALL_DEFAULT,
            thickness: CANVAS_CONFIG.WALL_THICKNESS
        };
    }
    
    /**
     * Manipula mousedown em modo câmera
     */
    handleCameraMouseDown(x, y) {
        const clickedCamera = this.modules.canvas.findClickedCamera(x, y);
        
        if (clickedCamera) {
            this.modules.canvas.selectCamera(clickedCamera);
            this.modules.ui.updateCameraControls(clickedCamera);
            this.state.isDragging = true;
            this.state.dragOffset = { 
                x: x - clickedCamera.x, 
                y: y - clickedCamera.y 
            };
            this.modules.ui.updateCanvasCursor('move');
        }
    }
    
    /**
     * Manipula mousemove no canvas
     */
    handleCanvasMouseMove(event) {
        const { x, y } = this.modules.canvas.getCanvasCoords(event);
        
        if (this.state.currentMode === EDIT_MODES.WALL && this.state.isDrawing && this.state.currentWall) {
            this.updateWallDrawing(x, y);
        } else if (this.state.currentMode === EDIT_MODES.CAMERA && this.state.isDragging && this.state.selectedCamera) {
            this.updateCameraDragging(x, y);
        }
    }
    
    /**
     * Atualiza desenho de parede
     */
    updateWallDrawing(x, y) {
        this.state.currentWall.x2 = x;
        this.state.currentWall.y2 = y;
        this.modules.canvas.drawMap();
    }
    
    /**
     * Atualiza arrasto de câmera
     */
    updateCameraDragging(x, y) {
        const newPos = this.modules.canvas.constrainToCanvas(
            x - this.state.dragOffset.x,
            y - this.state.dragOffset.y
        );
        
        this.state.selectedCamera.x = newPos.x;
        this.state.selectedCamera.y = newPos.y;
        this.modules.canvas.drawMap();
    }
    
    /**
     * Manipula mouseup no canvas
     */
    handleCanvasMouseUp(event) {
        if (this.state.currentMode === EDIT_MODES.WALL && this.state.isDrawing && this.state.currentWall) {
            this.finishWallDrawing();
        }
        
        if (this.state.currentMode === EDIT_MODES.CAMERA && this.state.isDragging) {
            this.finishCameraDragging();
        }
    }
    
    /**
     * Finaliza desenho de parede
     */
    finishWallDrawing() {
        const wall = this.state.currentWall;
        
        // Só salva se a parede tiver comprimento mínimo
        if (Math.abs(wall.x1 - wall.x2) > 5 || Math.abs(wall.y1 - wall.y2) > 5) {
            this.state.walls.push(wall);
        }
        
        this.state.currentWall = null;
        this.state.isDrawing = false;
        this.modules.canvas.drawMap();
    }
    
    /**
     * Finaliza arrasto de câmera
     */
    finishCameraDragging() {
        this.state.isDragging = false;
        this.modules.ui.updateCanvasCursor('crosshair');
        this.modules.canvas.drawMap();
    }
    
    /**
     * Manipula clique no canvas
     */
    handleCanvasClick(event) {
        const { x, y } = this.modules.canvas.getCanvasCoords(event);
        
        if (this.state.currentMode === EDIT_MODES.CAMERA && !this.state.isDragging) {
            this.handleCameraClick(x, y);
        } else if (this.state.currentMode === EDIT_MODES.WALL && !this.state.isDrawing) {
            this.handleWallClick(x, y);
        }
    }
    
    /**
     * Manipula clique em modo câmera
     */
    handleCameraClick(x, y) {
        const clickedCamera = this.modules.canvas.findClickedCamera(x, y);
        
        if (clickedCamera) {
            this.modules.canvas.selectCamera(clickedCamera);
            this.modules.ui.updateCameraControls(clickedCamera);
        } else {
            // Adicionar nova câmera
            this.modules.canvas.deselectCamera();
            this.modules.ui.resetCameraControls();
            const newCamera = this.modules.canvas.addNewCamera(x, y);
            this.modules.budget.addNewCameraBudgetItem(newCamera.id, newCamera.type);
        }
    }
    
    /**
     * Manipula clique em modo parede
     */
    handleWallClick(x, y) {
        const wallIndex = this.modules.canvas.findClickedWallIndex(x, y);
        if (wallIndex !== -1) {
            this.state.walls.splice(wallIndex, 1);
            this.modules.canvas.drawMap();
            this.modules.ui.updateModeInstruction('Parede removida. Clique e arraste para desenhar mais paredes ou clique em outra para remover.');
        }
    }
    
    /**
     * Configura eventos dos controles de câmera
     */
    setupCameraControlEvents() {
        if (!this.elements) return;
        
        const controls = [
            this.elements.cameraTypeSelect,
            this.elements.coverageAngleInput,
            this.elements.coverageRangeInput,
            this.elements.rotationAngleInput
        ];
        
        controls.forEach(element => {
            if (element) {
                element.addEventListener('input', () => this.handleCameraControlChange(element));
            }
        });
    }
    
    /**
     * Manipula mudanças nos controles de câmera
     */
    handleCameraControlChange(element) {
        // Atualizar displays de valor
        if (element.id === 'coverageRange') {
            this.modules.ui.updateRangeValue(element.value);
        }
        if (element.id === 'rotationAngle') {
            this.modules.ui.updateRotationValue(element.value);
        }
        
        // Atualizar câmera selecionada
        if (this.state.selectedCamera) {
            this.state.selectedCamera.type = this.elements.cameraTypeSelect.value;
            this.state.selectedCamera.angle = parseInt(this.elements.coverageAngleInput.value);
            this.state.selectedCamera.range = parseFloat(this.elements.coverageRangeInput.value);
            this.state.selectedCamera.rotation = parseInt(this.elements.rotationAngleInput.value);
            this.modules.canvas.drawMap();
        }
    }
    
    /**
     * Configura eventos de andar
     */
    setupFloorEvents() {
        if (!this.elements?.floorSelector) return;
        
        this.elements.floorSelector.addEventListener('change', (e) => {
            this.state.currentFloor = parseInt(e.target.value);
            this.modules.ui.updateCurrentFloorName(this.state.currentFloor);
            this.modules.canvas.deselectCamera();
            this.modules.ui.resetCameraControls();
            this.modules.canvas.drawMap();
            this.modules.ui.updateUndoWallButtonVisibility();
        });
    }
    
    /**
     * Configura eventos de modo
     */
    setupModeEvents() {
        if (!this.elements) return;
        
        if (this.elements.modeCameraBtn) {
            this.elements.modeCameraBtn.addEventListener('click', () => {
                this.modules.ui.switchToCameraMode();
                this.modules.canvas.deselectCamera();
                this.modules.ui.resetCameraControls();
            });
        }
        
        if (this.elements.modeWallBtn) {
            this.elements.modeWallBtn.addEventListener('click', () => {
                this.modules.ui.switchToWallMode();
                this.modules.canvas.deselectCamera();
                this.modules.ui.resetCameraControls();
            });
        }
    }
    
    /**
     * Configura eventos dos botões
     */
    setupButtonEvents() {
        if (!this.elements) return;
        
        // Botão limpar mapa
        if (this.elements.clearMapBtn) {
            this.elements.clearMapBtn.addEventListener('click', () => this.handleClearMap());
        }
        
        // Botão remover câmera selecionada
        if (this.elements.removeSelectedCameraBtn) {
            this.elements.removeSelectedCameraBtn.addEventListener('click', () => this.handleRemoveSelectedCamera());
        }
        
        // Botão desfazer última parede
        if (this.elements.undoLastWallBtn) {
            this.elements.undoLastWallBtn.addEventListener('click', () => this.handleUndoLastWall());
        }
        
        // Botão gerar proposta
        if (this.elements.generateProposalBtn) {
            this.elements.generateProposalBtn.addEventListener('click', () => {
                this.modules.proposal.generateProposal();
            });
        }
    }
    
    /**
     * Manipula limpeza do mapa
     */
    handleClearMap() {
        // Remove câmeras e paredes do andar atual
        this.state.cameras = this.state.cameras.filter(cam => cam.floor !== this.state.currentFloor);
        this.state.walls = this.state.walls.filter(wall => wall.floor !== this.state.currentFloor);
        
        this.modules.canvas.deselectCamera();
        this.modules.ui.resetCameraControls();
        this.modules.canvas.drawMap();
        
        // Sincronizar itens de câmera no orçamento
        this.modules.budget.syncCameraBudgetItems();
    }
    
    /**
     * Manipula remoção de câmera selecionada
     */
    handleRemoveSelectedCamera() {
        if (!this.state.selectedCamera) return;
        
        const cameraId = this.state.selectedCamera.id;
        
        // Remover do array de câmeras
        this.state.cameras = this.state.cameras.filter(cam => cam.id !== cameraId);
        
        // Remover do orçamento
        this.modules.budget.removeCameraBudgetItem(cameraId);
        
        this.modules.canvas.deselectCamera();
        this.modules.ui.resetCameraControls();
    }
    
    /**
     * Manipula desfazer última parede
     */
    handleUndoLastWall() {
        // Encontrar última parede do andar atual
        let lastWallIndex = -1;
        for (let i = this.state.walls.length - 1; i >= 0; i--) {
            if (this.state.walls[i].floor === this.state.currentFloor) {
                lastWallIndex = i;
                break;
            }
        }
        
        if (lastWallIndex !== -1) {
            this.state.walls.splice(lastWallIndex, 1);
            this.modules.canvas.drawMap();
            this.modules.ui.updateModeInstruction('Última parede desfeita. Clique e arraste para desenhar mais paredes ou clique em outra para remover.');
        }
    }
    
    /**
     * Configura eventos de formulários
     */
    setupFormEvents() {
        if (!this.elements?.addItemForm) return;
        
        this.elements.addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = this.modules.ui.getAddItemFormData();
            if (this.modules.ui.validateAddItemForm(formData)) {
                this.modules.budget.processAddItemForm(formData);
                this.modules.ui.clearAddItemForm();
            }
        });
    }
    
    /**
     * Configura eventos de modais
     */
    setupModalEvents() {
        if (!this.elements?.btnCloseProposal) return;
        
        this.elements.btnCloseProposal.addEventListener('click', () => {
            this.modules.proposal.closeProposal();
        });
    }
}