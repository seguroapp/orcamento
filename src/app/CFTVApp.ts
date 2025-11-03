/**
 * CFTV App - Classe Principal TypeScript
 * Gerenciador principal da aplicação com tipagem estática
 */

import type { 
  AppState, 
  Camera, 
  Wall,
  BudgetItem, 
  EditMode, 
  CameraType 
} from '../types/index.js';

import { 
  CANVAS_CONFIG, 
  CAMERA_CONFIG, 
  DEFAULT_BUDGET_ITEMS 
} from '../config.js';

export class CFTVApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: AppState;

  constructor() {
    // Inicialização básica - elementos serão validados no initialize()
    this.canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Estado inicial da aplicação
    this.state = {
      cameras: [],
      walls: [],
      budgetItems: [...DEFAULT_BUDGET_ITEMS],
      nextCameraId: 1,
      nextWallId: 1,
      selectedCamera: null,
      currentFloor: 1,
      floors: {
        total: 3,
        names: {
          1: '1º Andar - Térreo',
          2: '2º Andar',
          3: '3º Andar'
        }
      },
      isDrawingWall: false,
      isAddingCamera: false,
      wallStartPoint: null,
      currentTool: 'select',
      canvas: {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
      },
      cameraEdit: {
        isRotating: false,
        isResizing: false,
        rotationHandle: null,
        rangeHandle: null,
      },
    };
  }

  /**
   * Inicializa a aplicação
   */
  public initialize(): void {
    console.log('🔧 Inicializando CFTVApp...');
    
    this.validateElements();
    this.setupCanvas();
    this.setupEventListeners();
    this.renderBudgetList();
    this.updateUI();
    
    console.log('✅ CFTVApp inicializada com sucesso');
  }

  /**
   * Valida se todos os elementos DOM necessários existem
   */
  private validateElements(): void {
    const requiredElements = [
      'mapCanvas',
      'selectMode', 'cameraMode', 'wallMode', 'deleteMode',
      'cameraType', 'currentFloor',
      'clearCanvas', 'exportCanvas',
      'budgetList', 'totalBudget',
      'addBudgetItem', 'generateProposal',
      'cameraControls', 'cameraX', 'cameraY', 'cameraAngle', 'cameraRange', 'cameraRotation',
      'updateCamera', 'deleteCamera'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      console.warn(`Elementos DOM opcionais não encontrados: ${missingElements.join(', ')}`);
      // Remova elementos que realmente são opcionais da lista de obrigatórios
      const criticalMissing = missingElements.filter(id => 
        !['cameraTypeSelect', 'cameraInfo', 'angleValue', 'rangeValue', 'rotationValue', 'addFloor'].includes(id)
      );
      
      if (criticalMissing.length > 0) {
        throw new Error(`Elementos DOM obrigatórios não encontrados: ${criticalMissing.join(', ')}`);
      }
    }

    if (!this.ctx) {
      throw new Error('Não foi possível obter contexto 2D do canvas');
    }
  }

  /**
   * Configura o canvas
   */
  private setupCanvas(): void {
    this.canvas.width = CANVAS_CONFIG.width;
    this.canvas.height = CANVAS_CONFIG.height;
    
    // Configurações do contexto
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.drawCanvas();
  }

  /**
   * Configura todos os event listeners
   */
  private setupEventListeners(): void {
    // Botões de modo
    this.getElementById('selectMode').addEventListener('click', () => this.setMode('select'));
    this.getElementById('cameraMode').addEventListener('click', () => this.setMode('camera'));
    this.getElementById('wallMode').addEventListener('click', () => this.setMode('wall'));
    this.getElementById('deleteMode').addEventListener('click', () => this.setMode('delete'));

    // Canvas events com melhor detecção
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this), { passive: false });
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this), { passive: false });
    this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this), { passive: false });
    
    // Adiciona event listeners de teclado para rotação rápida
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Previne context menu no canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Debug adicional para eventos de click
    this.canvas.addEventListener('click', (e) => {
      const { x, y } = this.getCanvasCoordinates(e);
      console.log('🎯 Canvas click detectado:', { 
        x, y, 
        mode: this.state.currentTool, 
        canvasWidth: this.canvas.width, 
        canvasHeight: this.canvas.height 
      });
    });

    // Botões de ação
    this.getElementById('clearCanvas').addEventListener('click', this.clearCanvas.bind(this));
    this.getElementById('exportCanvas').addEventListener('click', this.exportCanvas.bind(this));

    // Controles de câmera
    this.getElementById('updateCamera').addEventListener('click', this.updateSelectedCamera.bind(this));
    this.getElementById('deleteCamera').addEventListener('click', this.deleteSelectedCamera.bind(this));
    
    // Sliders de controle da câmera
    this.getElementById('cameraAngle').addEventListener('input', this.updateAngleDisplay.bind(this));
    this.getElementById('cameraRange').addEventListener('input', this.updateRangeDisplay.bind(this));
    this.getElementById('cameraRotation').addEventListener('input', this.updateRotationDisplay.bind(this));
    
    // Inputs de posição
    this.getElementById('cameraX').addEventListener('input', this.updateCameraPosition.bind(this));
    this.getElementById('cameraY').addEventListener('input', this.updateCameraPosition.bind(this));
    
    // Seletor de tipo de câmera (se existir no painel de controles)
    try {
      const cameraTypeSelect = document.getElementById('cameraTypeSelect');
      if (cameraTypeSelect) {
        cameraTypeSelect.addEventListener('change', this.updateCameraType.bind(this));
        console.log('✅ Event listener do tipo de câmera adicionado');
      } else {
        console.warn('⚠️ Elemento cameraTypeSelect não encontrado');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao configurar event listener do tipo de câmera:', error);
    }

    // Orçamento
    this.getElementById('addBudgetItem').addEventListener('click', this.showBudgetModal.bind(this));
    this.getElementById('generateProposal').addEventListener('click', this.generateProposal.bind(this));
    this.getElementById('configureProposal').addEventListener('click', this.showProposalConfigModal.bind(this));

    // Controles de andares
    this.getElementById('currentFloor').addEventListener('change', this.handleFloorChange.bind(this));
    
    // Botão adicionar andar
    const addFloorBtn = document.getElementById('addFloor');
    if (addFloorBtn) {
      addFloorBtn.addEventListener('click', this.addNewFloor.bind(this));
    }

    // Botões de navegação rápida de andares
    this.setupFloorNavigationButtons();

    // Modal
    const cancelBtn = this.getElementById('cancelModal');
    const form = this.getElementById('budgetForm') as HTMLFormElement;
    
    cancelBtn.addEventListener('click', () => this.hideBudgetModal());
    form.addEventListener('submit', this.handleBudgetFormSubmit.bind(this));
  }

  /**
   * Define o modo de edição atual
   */
  private setMode(mode: EditMode): void {
    this.state.currentTool = mode;
    
    // Remove classe active de todos os botões
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Adiciona classe active no botão selecionado
    this.getElementById(`${mode}Mode`).classList.add('active');
    
    // Atualiza instruções
    this.updateInstructions();
  }

  /**
   * Obtém coordenadas precisas do mouse no canvas
   */
  private getCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: Math.round((event.clientX - rect.left) * scaleX),
      y: Math.round((event.clientY - rect.top) * scaleY)
    };
  }

  /**
   * Manipula clicks no canvas
   */
  private handleCanvasClick(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoordinates(event);
    
    // Verifica se as coordenadas estão dentro dos limites do canvas
    if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
      return;
    }

    console.log(`🎯 Click em modo ${this.state.currentTool} nas coordenadas:`, { x, y });

    // Se estamos em modo select e há câmera selecionada, verifica handles primeiro
    if (this.state.currentTool === 'select' && this.state.selectedCamera) {
      // Verifica se clicou em algum handle - se sim, não processa o click normal
      if (this.state.cameraEdit.rotationHandle && 
          this.isPointInHandle(x, y, this.state.cameraEdit.rotationHandle, 8)) {
        console.log('🔄 Click no handle de rotação ignorado (será processado no mousedown)');
        return;
      }
      
      if (this.state.cameraEdit.rangeHandle && 
          this.isPointInHandle(x, y, this.state.cameraEdit.rangeHandle, 7)) {
        console.log('📏 Click no handle de alcance ignorado (será processado no mousedown)');
        return;
      }
    }

    switch (this.state.currentTool) {
      case 'camera':
        this.addCamera(x, y);
        break;
      case 'select':
        this.selectCamera(x, y);
        break;
      case 'wall':
        this.handleWallDrawing(x, y);
        break;
      case 'delete':
        this.deleteAtPosition(x, y);
        break;
    }
  }

  /**
   * Manipula desenho de paredes
   */
  private handleWallDrawing(x: number, y: number): void {
    // Garante que as coordenadas estão dentro do canvas
    const clampedX = Math.max(0, Math.min(this.canvas.width, x));
    const clampedY = Math.max(0, Math.min(this.canvas.height, y));
    
    if (!this.state.isDrawingWall) {
      // Início do desenho da parede
      this.state.wallStartPoint = { x: clampedX, y: clampedY };
      this.state.isDrawingWall = true;
      this.canvas.style.cursor = 'crosshair';
      console.log('🟠 Iniciando desenho de parede em:', { x: clampedX, y: clampedY });
    } else {
      // Fim do desenho da parede
      if (this.state.wallStartPoint) {
        // Verifica se a linha tem tamanho mínimo
        const distance = Math.sqrt(
          Math.pow(clampedX - this.state.wallStartPoint.x, 2) + 
          Math.pow(clampedY - this.state.wallStartPoint.y, 2)
        );
        
        if (distance >= 10) { // Mínimo de 10 pixels
          this.addWall(this.state.wallStartPoint.x, this.state.wallStartPoint.y, clampedX, clampedY);
          console.log('✅ Parede criada com distância:', distance);
        } else {
          console.log('⚠️ Parede muito pequena, cancelada');
        }
        
        this.state.isDrawingWall = false;
        this.state.wallStartPoint = null;
        this.canvas.style.cursor = 'default';
      }
    }
  }

  /**
   * Adiciona uma parede
   */
  private addWall(startX: number, startY: number, endX: number, endY: number): void {
    const wall = {
      id: this.state.nextWallId++,
      startX,
      startY,
      endX,
      endY,
      thickness: 5,
      floor: this.state.currentFloor,
      type: 'wall' as const,
    };

    this.state.walls.push(wall);
    this.drawCanvas();
    console.log('🧱 Parede adicionada:', wall);
  }

  /**
   * Remove elemento na posição clicada
   */
  private deleteAtPosition(x: number, y: number): void {
    // Primeiro tenta remover câmera (apenas do andar atual)
    const cameraIndex = this.state.cameras.findIndex(camera => {
      // Só considera câmeras do andar atual
      if (camera.floor !== this.state.currentFloor) return false;
      
      const distance = Math.sqrt((camera.x - x) ** 2 + (camera.y - y) ** 2);
      return distance <= CAMERA_CONFIG.sizes[camera.type];
    });

    if (cameraIndex !== -1) {
      const removedCamera = this.state.cameras.splice(cameraIndex, 1)[0];
      this.state.selectedCamera = null;
      this.clearCameraControls();
      this.drawCanvas();
      this.updateCameraCount();
      console.log('🗑️ Câmera removida:', removedCamera);
      return;
    }

    // Se não encontrou câmera, tenta remover parede (apenas do andar atual)
    const wallIndex = this.state.walls.findIndex(wall => {
      // Só considera paredes do andar atual
      if (wall.floor !== this.state.currentFloor) return false;
      
      const distance = this.distanceToLineSegment(x, y, wall.startX, wall.startY, wall.endX, wall.endY);
      return distance <= 8; // tolerância para clicar na parede
    });

    if (wallIndex !== -1) {
      const removedWall = this.state.walls.splice(wallIndex, 1)[0];
      this.drawCanvas();
      console.log('🗑️ Parede removida:', removedWall);
    }
  }

  /**
   * Calcula distância de um ponto a um segmento de linha
   */
  private distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projectionX = x1 + t * dx;
    const projectionY = y1 + t * dy;
    
    return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
  }

  /**
   * Manipula movimento do mouse no canvas
   */
  private handleCanvasMouseMove(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoordinates(event);

    // Atualiza coordenadas se o elemento existir
    const coordsElement = document.getElementById('mouseCoords');
    if (coordsElement) {
      coordsElement.textContent = `X: ${x}, Y: ${y}`;
    }

    // Se estiver desenhando parede, mostra linha de preview
    if (this.state.isDrawingWall && this.state.wallStartPoint) {
      this.drawCanvas();
      this.drawWallPreview(this.state.wallStartPoint.x, this.state.wallStartPoint.y, x, y);
      return;
    }

    // Se estiver rotacionando câmera
    if (this.state.cameraEdit.isRotating && this.state.selectedCamera) {
      const camera = this.state.selectedCamera;
      const angle = Math.atan2(y - camera.y, x - camera.x);
      const degrees = (angle * 180 / Math.PI + 360) % 360;
      
      camera.rotation = Math.round(degrees);
      
      console.log(`🔄 Rotacionando câmera: ${degrees.toFixed(1)}° -> ${camera.rotation}°`);
      
      // Atualiza controles
      try {
        (this.getElementById('cameraRotation') as HTMLInputElement).value = camera.rotation.toString();
        this.updateRotationDisplay();
      } catch (error) {
        console.warn('Erro ao atualizar controles de rotação:', error);
      }
      
      this.drawCanvas();
      this.updateCameraInfo(camera);
      return;
    }

    // Se estiver redimensionando câmera
    if (this.state.cameraEdit.isResizing && this.state.selectedCamera) {
      const camera = this.state.selectedCamera;
      const distance = Math.sqrt(
        Math.pow(x - camera.x, 2) + Math.pow(y - camera.y, 2)
      );
      
      camera.range = Math.max(20, Math.min(100, Math.round(distance)));
      
      // Atualiza controles
      (this.getElementById('cameraRange') as HTMLInputElement).value = camera.range.toString();
      this.updateRangeDisplay();
      
      this.drawCanvas();
      this.updateCameraInfo(camera);
      return;
    }

    // Se estiver arrastando câmera
    if (this.state.canvas.isDragging && this.state.selectedCamera) {
      this.state.selectedCamera.x = x;
      this.state.selectedCamera.y = y;
      
      // Atualiza controles de posição
      (this.getElementById('cameraX') as HTMLInputElement).value = x.toString();
      (this.getElementById('cameraY') as HTMLInputElement).value = y.toString();
      
      this.drawCanvas();
      this.updateCameraInfo(this.state.selectedCamera);
      return;
    }

    // Atualiza cursor baseado no que está sob o mouse
    this.updateCursor(x, y);
  }

  /**
   * Atualiza cursor baseado na posição do mouse
   */
  private updateCursor(x: number, y: number): void {
    if (this.state.currentTool !== 'select' || !this.state.selectedCamera) {
      return;
    }

    // Verifica handles
    if (this.state.cameraEdit.rotationHandle && 
        this.isPointInHandle(x, y, this.state.cameraEdit.rotationHandle, 8)) {
      this.canvas.style.cursor = 'grab';
      return;
    }

    if (this.state.cameraEdit.rangeHandle && 
        this.isPointInHandle(x, y, this.state.cameraEdit.rangeHandle, 7)) {
      this.canvas.style.cursor = 'ew-resize';
      return;
    }

    // Verifica câmera
    const distance = Math.sqrt(
      (this.state.selectedCamera.x - x) ** 2 + 
      (this.state.selectedCamera.y - y) ** 2
    );
    
    if (distance <= CAMERA_CONFIG.sizes[this.state.selectedCamera.type]) {
      this.canvas.style.cursor = 'move';
      return;
    }

    this.canvas.style.cursor = 'default';
  }

  /**
   * Manipula teclas pressionadas para controle de câmeras
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.state.selectedCamera) return;

    const camera = this.state.selectedCamera;
    let rotationChange = 0;
    let updated = false;

    // Evita processar teclas quando está digitando em inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'arrowleft':
      case 'a':
        rotationChange = -15; // Rotaciona 15° para esquerda
        break;
      case 'arrowright':
      case 'd':
        rotationChange = 15; // Rotaciona 15° para direita
        break;
      case 'arrowup':
      case 'w':
        camera.rotation = 90; // Aponta para cima (Norte)
        updated = true;
        break;
      case 'arrowdown':
      case 's':
        camera.rotation = 270; // Aponta para baixo (Sul)
        updated = true;
        break;
      case 'q':
        camera.rotation = 135; // Noroeste
        updated = true;
        break;
      case 'e':
        camera.rotation = 45; // Nordeste
        updated = true;
        break;
      case 'z':
        camera.rotation = 225; // Sudoeste
        updated = true;
        break;
      case 'c':
        camera.rotation = 315; // Sudeste
        updated = true;
        break;
      case ' ':
        // Espaço para resetar para Leste (0°)
        camera.rotation = 0;
        updated = true;
        event.preventDefault();
        break;
    }

    if (rotationChange !== 0) {
      camera.rotation = (camera.rotation + rotationChange + 360) % 360;
      updated = true;
    }

    if (updated) {
      // Atualiza controles
      try {
        (this.getElementById('cameraRotation') as HTMLInputElement).value = camera.rotation.toString();
        this.updateRotationDisplay();
      } catch (error) {
        console.warn('Erro ao atualizar controles:', error);
      }

      this.drawCanvas();
      this.updateCameraInfo(camera);
      
      console.log(`⌨️ Rotação da câmera alterada via teclado: ${camera.rotation}°`);
      event.preventDefault();
    }
  }

  /**
   * Manipula início de drag no canvas
   */
  private handleCanvasMouseDown(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoordinates(event);
    
    console.log('🖱️ MouseDown em:', { x, y, tool: this.state.currentTool });
    
    if (this.state.currentTool === 'select' && this.state.selectedCamera) {
      console.log('📹 Câmera selecionada:', this.state.selectedCamera);
      console.log('🔧 Handles:', {
        rotation: this.state.cameraEdit.rotationHandle,
        range: this.state.cameraEdit.rangeHandle
      });
      
      // Verifica se clicou no handle de rotação
      if (this.state.cameraEdit.rotationHandle) {
        const distanceToRotationHandle = this.isPointInHandle(x, y, this.state.cameraEdit.rotationHandle, 8);
        console.log('🔄 Distância ao handle de rotação:', distanceToRotationHandle);
        
        if (distanceToRotationHandle) {
          this.state.cameraEdit.isRotating = true;
          this.canvas.style.cursor = 'grabbing';
          event.preventDefault();
          event.stopPropagation();
          console.log('🔄 Iniciando rotação da câmera');
          return;
        }
      }
      
      // Verifica se clicou no handle de alcance
      if (this.state.cameraEdit.rangeHandle) {
        const distanceToRangeHandle = this.isPointInHandle(x, y, this.state.cameraEdit.rangeHandle, 7);
        console.log('📏 Distância ao handle de alcance:', distanceToRangeHandle);
        
        if (distanceToRangeHandle) {
          this.state.cameraEdit.isResizing = true;
          this.canvas.style.cursor = 'ew-resize';
          event.preventDefault();
          event.stopPropagation();
          console.log('📏 Iniciando redimensionamento da câmera');
          return;
        }
      }
      
      // Verifica se clicou na câmera para arrastar
      const distance = Math.sqrt(
        (this.state.selectedCamera.x - x) ** 2 + 
        (this.state.selectedCamera.y - y) ** 2
      );
      
      console.log('🎯 Distância à câmera:', distance, 'Tamanho:', CAMERA_CONFIG.sizes[this.state.selectedCamera.type]);
      
      if (distance <= CAMERA_CONFIG.sizes[this.state.selectedCamera.type]) {
        this.state.canvas.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
        event.preventDefault();
        console.log('🚚 Iniciando movimento da câmera');
      }
    }
  }

  /**
   * Verifica se um ponto está dentro de um handle
   */
  private isPointInHandle(x: number, y: number, handle: { x: number; y: number }, radius: number): boolean {
    const distance = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
    const isInside = distance <= radius;
    console.log(`🎯 Verificando handle em (${handle.x}, ${handle.y}) com raio ${radius}: distância=${distance.toFixed(2)}, dentro=${isInside}`);
    return isInside;
  }

  /**
   * Manipula fim de drag no canvas
   */
  private handleCanvasMouseUp(): void {
    if (this.state.cameraEdit.isRotating) {
      this.state.cameraEdit.isRotating = false;
      this.canvas.style.cursor = 'default';
      console.log('✅ Rotação da câmera finalizada');
    }
    
    if (this.state.cameraEdit.isResizing) {
      this.state.cameraEdit.isResizing = false;
      this.canvas.style.cursor = 'default';
      console.log('✅ Redimensionamento da câmera finalizado');
    }
    
    if (this.state.canvas.isDragging) {
      this.state.canvas.isDragging = false;
      this.canvas.style.cursor = 'default';
      this.updateCameraControlsFromSelected();
      console.log('✅ Movimento da câmera finalizado');
    }
  }

  /**
   * Desenha preview da parede sendo desenhada
   */
  private drawWallPreview(startX: number, startY: number, endX: number, endY: number): void {
    // Clamp coordenadas dentro do canvas
    const clampedEndX = Math.max(0, Math.min(this.canvas.width, endX));
    const clampedEndY = Math.max(0, Math.min(this.canvas.height, endY));
    
    this.ctx.save();
    this.ctx.strokeStyle = '#EF4444';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 4]);
    this.ctx.lineCap = 'round';
    this.ctx.globalAlpha = 0.8;
    
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(clampedEndX, clampedEndY);
    this.ctx.stroke();
    
    // Desenha pontos de início e fim
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#EF4444';
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(clampedEndX, clampedEndY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  /**
   * Adiciona uma câmera no canvas
   */
  private addCamera(x: number, y: number): void {
    const cameraTypeSelect = this.getElementById('cameraType') as HTMLSelectElement;
    const type = cameraTypeSelect.value as CameraType;

    const camera: Camera = {
      id: this.state.nextCameraId++,
      x,
      y,
      type,
      angle: CAMERA_CONFIG.defaultAngle,
      range: CAMERA_CONFIG.defaultRange,
      rotation: 0, // Rotação padrão (apontando para leste)
      floor: this.state.currentFloor,
      label: `${type.toUpperCase()} ${this.state.nextCameraId - 1}`,
      status: 'active',
      price: 350.00,
      description: `Câmera ${type.toUpperCase()}`,
    };

    this.state.cameras.push(camera);
    this.drawCanvas();
    this.updateCameraCount();
    
    console.log('📹 Câmera adicionada:', camera);
  }

  /**
   * Seleciona uma câmera
   */
  private selectCamera(x: number, y: number): void {
    // Se estiver arrastando uma câmera, move ela
    if (this.state.canvas.isDragging && this.state.selectedCamera) {
      this.state.selectedCamera.x = x;
      this.state.selectedCamera.y = y;
      this.drawCanvas();
      this.updateCameraControlsFromSelected();
      return;
    }

    // Senão, procura câmera para selecionar (apenas no andar atual)
    const clickedCamera = this.state.cameras.find(camera => {
      // Só considera câmeras do andar atual
      if (camera.floor !== this.state.currentFloor) return false;
      
      const distance = Math.sqrt((camera.x - x) ** 2 + (camera.y - y) ** 2);
      return distance <= CAMERA_CONFIG.sizes[camera.type];
    });

    this.state.selectedCamera = clickedCamera || null;
    this.drawCanvas();
    
    if (clickedCamera) {
      this.updateCameraControls(clickedCamera);
      console.log('🎯 Câmera selecionada:', clickedCamera);
    } else {
      this.clearCameraControls();
    }
  }

  /**
   * Atualiza controles da câmera selecionada
   */
  private updateCameraControls(camera: Camera): void {
    // Preenche os controles com os valores da câmera
    (this.getElementById('cameraX') as HTMLInputElement).value = camera.x.toString();
    (this.getElementById('cameraY') as HTMLInputElement).value = camera.y.toString();
    (this.getElementById('cameraAngle') as HTMLInputElement).value = camera.angle.toString();
    (this.getElementById('cameraRange') as HTMLInputElement).value = camera.range.toString();
    (this.getElementById('cameraRotation') as HTMLInputElement).value = camera.rotation.toString();
    
    // Atualiza tipo da câmera
    try {
      const typeSelect = document.getElementById('cameraTypeSelect') as HTMLSelectElement;
      if (typeSelect) {
        typeSelect.value = camera.type;
      }
    } catch (error) {
      console.warn('Elemento cameraTypeSelect não encontrado:', error);
    }
    
    // Atualiza os displays
    this.updateAngleDisplay();
    this.updateRangeDisplay();
    this.updateRotationDisplay();
    
    // Mostra informações da câmera
    this.updateCameraInfo(camera);
    
    console.log('📹 Controles da câmera atualizados:', camera);
  }

  /**
   * Atualiza informações detalhadas da câmera
   */
  private updateCameraInfo(camera: Camera): void {
    try {
      const infoElement = this.getElementById('cameraInfo');
      const coverage = Math.PI * Math.pow(camera.range, 2) * (camera.angle / 360);
      const direction = this.getDirectionName(camera.rotation);
      
      infoElement.innerHTML = `
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="font-medium">ID:</span>
            <span>#${camera.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Tipo:</span>
            <span class="capitalize">${camera.type}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Posição:</span>
            <span>(${camera.x}, ${camera.y})</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Direção:</span>
            <span>${direction}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Cobertura:</span>
            <span>${Math.round(coverage)} px²</span>
          </div>
        </div>
      `;
    } catch (error) {
      console.warn('Elemento cameraInfo não encontrado ou erro ao atualizar:', error);
    }
  }

  /**
   * Converte ângulo em nome de direção
   */
  private getDirectionName(rotation: number): string {
    const normalized = ((rotation % 360) + 360) % 360;
    
    if (normalized >= 337.5 || normalized < 22.5) return 'Leste';
    if (normalized >= 22.5 && normalized < 67.5) return 'Nordeste';
    if (normalized >= 67.5 && normalized < 112.5) return 'Norte';
    if (normalized >= 112.5 && normalized < 157.5) return 'Noroeste';
    if (normalized >= 157.5 && normalized < 202.5) return 'Oeste';
    if (normalized >= 202.5 && normalized < 247.5) return 'Sudoeste';
    if (normalized >= 247.5 && normalized < 292.5) return 'Sul';
    return 'Sudeste';
  }

  /**
   * Aplica preset de direção para câmera (método público)
   */
  public applyCameraDirectionPreset(direction: string): void {
    if (!this.state.selectedCamera) return;
    
    const presets: Record<string, number> = {
      'norte': 90,
      'nordeste': 45,
      'leste': 0,
      'sudeste': 315,
      'sul': 270,
      'sudoeste': 225,
      'oeste': 180,
      'noroeste': 135
    };
    
    const rotation = presets[direction.toLowerCase()];
    if (rotation !== undefined) {
      this.state.selectedCamera.rotation = rotation;
      (this.getElementById('cameraRotation') as HTMLInputElement).value = rotation.toString();
      this.updateRotationDisplay();
      this.drawCanvas();
      this.updateCameraInfo(this.state.selectedCamera);
      console.log(`🧭 Direção da câmera alterada para: ${direction} (${rotation}°)`);
    }
  }

  /**
   * Aplica preset de configuração de câmera (método público)
   */
  public applyCameraPreset(presetName: string): void {
    if (!this.state.selectedCamera) return;
    
    const presets: Record<string, {angle: number, range: number}> = {
      'close': { angle: 60, range: 30 },     // Monitoramento próximo
      'medium': { angle: 90, range: 50 },    // Monitoramento médio
      'wide': { angle: 120, range: 80 },     // Monitoramento amplo
      'corridor': { angle: 45, range: 60 },  // Corredor
      'entrance': { angle: 90, range: 40 },  // Entrada
      'parking': { angle: 120, range: 100 }  // Estacionamento
    };
    
    const preset = presets[presetName];
    if (preset) {
      this.state.selectedCamera.angle = preset.angle;
      this.state.selectedCamera.range = preset.range;
      
      // Atualiza controles
      (this.getElementById('cameraAngle') as HTMLInputElement).value = preset.angle.toString();
      (this.getElementById('cameraRange') as HTMLInputElement).value = preset.range.toString();
      
      this.updateAngleDisplay();
      this.updateRangeDisplay();
      this.drawCanvas();
      this.updateCameraInfo(this.state.selectedCamera);
      
      console.log(`📐 Preset '${presetName}' aplicado:`, preset);
    }
  }

  /**
   * Configura botões de navegação de andares
   */
  private setupFloorNavigationButtons(): void {
    const floorButtons = document.querySelectorAll('.floor-btn');
    floorButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const floor = parseInt(target.dataset.floor || '1');
        this.changeFloor(floor);
      });
    });
  }

  /**
   * Manipula mudança de andar
   */
  private handleFloorChange(): void {
    const floorSelect = this.getElementById('currentFloor') as HTMLSelectElement;
    const newFloor = parseInt(floorSelect.value);
    this.changeFloor(newFloor);
  }

  /**
   * Muda para um andar específico
   */
  private changeFloor(floor: number): void {
    if (floor === this.state.currentFloor) return;
    
    console.log(`🏢 Mudando do andar ${this.state.currentFloor} para ${floor}`);
    
    this.state.currentFloor = floor;
    this.state.selectedCamera = null;
    this.clearCameraControls();
    
    // Atualiza seletor
    (this.getElementById('currentFloor') as HTMLSelectElement).value = floor.toString();
    
    // Atualiza botões de navegação
    this.updateFloorNavigationButtons();
    
    // Atualiza display do andar atual
    this.updateFloorDisplay();
    
    // Atualiza contador de câmeras do andar
    this.updateFloorCameraCount();
    
    // Redesenha canvas
    this.drawCanvas();
    
    console.log(`✅ Andar alterado para: ${floor}`);
  }

  /**
   * Atualiza botões de navegação de andares
   */
  private updateFloorNavigationButtons(): void {
    const floorButtons = document.querySelectorAll('.floor-btn');
    floorButtons.forEach(button => {
      const buttonElement = button as HTMLElement;
      const floor = parseInt(buttonElement.dataset.floor || '1');
      
      if (floor === this.state.currentFloor) {
        buttonElement.classList.remove('bg-gray-200', 'text-gray-700');
        buttonElement.classList.add('bg-indigo-500', 'text-white', 'active');
      } else {
        buttonElement.classList.remove('bg-indigo-500', 'text-white', 'active');
        buttonElement.classList.add('bg-gray-200', 'text-gray-700');
      }
    });
  }

  /**
   * Atualiza display do andar atual
   */
  private updateFloorDisplay(): void {
    const currentFloorDisplay = document.getElementById('currentFloorDisplay');
    const totalFloorsDisplay = document.getElementById('totalFloorsDisplay');
    
    if (currentFloorDisplay) {
      const floorName = this.state.floors.names[this.state.currentFloor] || `${this.state.currentFloor}º Andar`;
      currentFloorDisplay.textContent = `Andar: ${floorName}`;
    }
    
    if (totalFloorsDisplay) {
      totalFloorsDisplay.textContent = `Total: ${this.state.floors.total} andares`;
    }
  }

  /**
   * Atualiza contador de câmeras do andar atual
   */
  private updateFloorCameraCount(): void {
    const camerasInFloor = this.state.cameras.filter(camera => camera.floor === this.state.currentFloor);
    const floorCameraCountElement = document.getElementById('floorCameraCount');
    
    if (floorCameraCountElement) {
      floorCameraCountElement.textContent = camerasInFloor.length.toString();
    }
  }

  /**
   * Adiciona um novo andar
   */
  private addNewFloor(): void {
    this.state.floors.total++;
    const newFloorNumber = this.state.floors.total;
    this.state.floors.names[newFloorNumber] = `${newFloorNumber}º Andar`;
    
    // Atualiza seletor
    const floorSelect = this.getElementById('currentFloor') as HTMLSelectElement;
    const option = document.createElement('option');
    option.value = newFloorNumber.toString();
    option.textContent = this.state.floors.names[newFloorNumber];
    floorSelect.appendChild(option);
    
    // Adiciona botão de navegação
    this.addFloorNavigationButton(newFloorNumber);
    
    // Atualiza display
    this.updateFloorDisplay();
    
    console.log(`🏗️ Novo andar adicionado: ${newFloorNumber}`);
  }

  /**
   * Adiciona botão de navegação para novo andar
   */
  private addFloorNavigationButton(floor: number): void {
    const floorButtonsContainer = document.getElementById('floorButtons');
    if (floorButtonsContainer) {
      const button = document.createElement('button');
      button.className = 'floor-btn p-2 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition';
      button.dataset.floor = floor.toString();
      button.textContent = `${floor}º`;
      
      button.addEventListener('click', () => this.changeFloor(floor));
      
      floorButtonsContainer.appendChild(button);
    }
  }

  /**
   * Limpa controles da câmera
   */
  private clearCameraControls(): void {
    // Atualiza informações da câmera para mostrar estado vazio
    const infoElement = this.getElementById('cameraInfo');
    infoElement.innerHTML = `
      <p class="text-sm text-gray-600">Selecione uma câmera no mapa para editar suas configurações</p>
    `;
    
    // Reset campos de entrada
    (this.getElementById('cameraX') as HTMLInputElement).value = '';
    (this.getElementById('cameraY') as HTMLInputElement).value = '';
    (this.getElementById('cameraAngle') as HTMLInputElement).value = '90';
    (this.getElementById('cameraRange') as HTMLInputElement).value = '50';
    (this.getElementById('cameraRotation') as HTMLInputElement).value = '0';
    
    // Reset estados de edição
    this.state.cameraEdit.isRotating = false;
    this.state.cameraEdit.isResizing = false;
    this.state.cameraEdit.rotationHandle = null;
    this.state.cameraEdit.rangeHandle = null;
  }

  /**
   * Atualiza controles baseado na câmera selecionada
   */
  private updateCameraControlsFromSelected(): void {
    if (this.state.selectedCamera) {
      this.updateCameraControls(this.state.selectedCamera);
    }
  }

  /**
   * Atualiza display do ângulo
   */
  private updateAngleDisplay(): void {
    try {
      const angleSlider = this.getElementById('angleValue');
      const angle = (this.getElementById('cameraAngle') as HTMLInputElement).value;
      angleSlider.textContent = `${angle}°`;
      
      // Atualiza câmera em tempo real se estiver selecionada
      if (this.state.selectedCamera) {
        this.state.selectedCamera.angle = parseInt(angle);
        this.drawCanvas();
        this.updateCameraInfo(this.state.selectedCamera);
      }
    } catch (error) {
      console.warn('Erro ao atualizar display do ângulo:', error);
    }
  }

  /**
   * Atualiza display do alcance
   */
  private updateRangeDisplay(): void {
    try {
      const rangeSlider = this.getElementById('rangeValue');
      const range = (this.getElementById('cameraRange') as HTMLInputElement).value;
      rangeSlider.textContent = `${range}px`;
      
      // Atualiza câmera em tempo real se estiver selecionada
      if (this.state.selectedCamera) {
        this.state.selectedCamera.range = parseInt(range);
        this.drawCanvas();
        this.updateCameraInfo(this.state.selectedCamera);
      }
    } catch (error) {
      console.warn('Erro ao atualizar display do alcance:', error);
    }
  }

  /**
   * Atualiza display da rotação
   */
  private updateRotationDisplay(): void {
    try {
      const rotationSlider = this.getElementById('rotationValue');
      const rotation = (this.getElementById('cameraRotation') as HTMLInputElement).value;
      rotationSlider.textContent = `${rotation}°`;
      
      // Atualiza câmera em tempo real se estiver selecionada
      if (this.state.selectedCamera) {
        this.state.selectedCamera.rotation = parseInt(rotation);
        this.drawCanvas();
        this.updateCameraInfo(this.state.selectedCamera);
      }
    } catch (error) {
      console.warn('Erro ao atualizar display da rotação:', error);
    }
  }

  /**
   * Atualiza posição da câmera via input
   */
  private updateCameraPosition(): void {
    if (!this.state.selectedCamera) return;
    
    const x = parseInt((this.getElementById('cameraX') as HTMLInputElement).value);
    const y = parseInt((this.getElementById('cameraY') as HTMLInputElement).value);
    
    if (!isNaN(x) && !isNaN(y)) {
      this.state.selectedCamera.x = Math.max(0, Math.min(x, this.canvas.width));
      this.state.selectedCamera.y = Math.max(0, Math.min(y, this.canvas.height));
      this.drawCanvas();
      this.updateCameraInfo(this.state.selectedCamera);
    }
  }

  /**
   * Atualiza tipo da câmera selecionada
   */
  private updateCameraType(): void {
    if (!this.state.selectedCamera) return;
    
    try {
      const typeSelect = document.getElementById('cameraTypeSelect') as HTMLSelectElement;
      if (typeSelect && typeSelect.value) {
        this.state.selectedCamera.type = typeSelect.value as CameraType;
        this.state.selectedCamera.label = `${this.state.selectedCamera.type.toUpperCase()} ${this.state.selectedCamera.id}`;
        this.drawCanvas();
        this.updateCameraInfo(this.state.selectedCamera);
        console.log('🎥 Tipo da câmera alterado para:', this.state.selectedCamera.type);
      }
    } catch (error) {
      console.warn('Erro ao atualizar tipo da câmera:', error);
    }
  }

  /**
   * Aplica mudanças nos controles da câmera
   */
  private updateSelectedCamera(): void {
    if (!this.state.selectedCamera) return;
    
    const x = parseInt((this.getElementById('cameraX') as HTMLInputElement).value);
    const y = parseInt((this.getElementById('cameraY') as HTMLInputElement).value);
    const angle = parseInt((this.getElementById('cameraAngle') as HTMLInputElement).value);
    const range = parseInt((this.getElementById('cameraRange') as HTMLInputElement).value);
    const rotation = parseInt((this.getElementById('cameraRotation') as HTMLInputElement).value);
    
    this.state.selectedCamera.x = Math.max(0, Math.min(x, this.canvas.width));
    this.state.selectedCamera.y = Math.max(0, Math.min(y, this.canvas.height));
    this.state.selectedCamera.angle = angle;
    this.state.selectedCamera.range = range;
    this.state.selectedCamera.rotation = rotation;
    
    this.drawCanvas();
    this.updateCameraInfo(this.state.selectedCamera);
    console.log('🔄 Câmera atualizada:', this.state.selectedCamera);
  }

  /**
   * Remove a câmera selecionada
   */
  private deleteSelectedCamera(): void {
    if (!this.state.selectedCamera) return;
    
    const index = this.state.cameras.findIndex(c => c.id === this.state.selectedCamera!.id);
    if (index !== -1) {
      const removedCamera = this.state.cameras.splice(index, 1)[0];
      this.state.selectedCamera = null;
      this.clearCameraControls();
      this.drawCanvas();
      this.updateCameraCount();
      console.log('🗑️ Câmera removida:', removedCamera);
    }
  }

  /**
   * Desenha todo o canvas
   */
  private drawCanvas(): void {
    // Limpa canvas
    this.ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenha grid se habilitado
    if (CANVAS_CONFIG.showGrid) {
      this.drawGrid();
    }

    // Desenha paredes
    this.drawWalls();

    // Desenha câmeras
    this.drawCameras();
  }

  /**
   * Desenha o grid do canvas
   */
  private drawGrid(): void {
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += CANVAS_CONFIG.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += CANVAS_CONFIG.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Desenha paredes
   */
  private drawWalls(): void {
    // Filtra paredes do andar atual
    const wallsInCurrentFloor = this.state.walls.filter(wall => wall.floor === this.state.currentFloor);
    
    wallsInCurrentFloor.forEach(wall => {
      this.ctx.strokeStyle = '#374151';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(wall.startX, wall.startY);
      this.ctx.lineTo(wall.endX, wall.endY);
      this.ctx.stroke();
    });
  }

  /**
   * Desenha câmeras
   */
  private drawCameras(): void {
    // Filtra câmeras do andar atual
    const camerasInCurrentFloor = this.state.cameras.filter(camera => camera.floor === this.state.currentFloor);
    
    camerasInCurrentFloor.forEach(camera => {
      // Garante que todas as câmeras tenham a propriedade rotation
      if (camera.rotation === undefined) {
        camera.rotation = 0;
      }
      
      const isSelected = this.state.selectedCamera?.id === camera.id;
      const color = CAMERA_CONFIG.colors[camera.type];
      const size = CAMERA_CONFIG.sizes[camera.type];

      // Desenha área de cobertura (setor circular)
      this.drawCameraCoverage(camera, camera.rotation);

      // Desenha câmera
      this.ctx.fillStyle = color;
      if (isSelected) {
        this.ctx.strokeStyle = '#8B5CF6';
        this.ctx.lineWidth = 3;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(camera.x, camera.y, size, 0, 2 * Math.PI);
      this.ctx.fill();
      
      if (isSelected) {
        this.ctx.stroke();
      }

      // Desenha direção da câmera
      this.drawCameraDirection(camera, camera.rotation, size, color);

      // Desenha handles de edição se a câmera estiver selecionada
      if (isSelected) {
        this.drawCameraEditHandles(camera);
      }

      // Desenha label
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(camera.label, camera.x, camera.y - size - 5);
    });
  }

  /**
   * Desenha área de cobertura da câmera
   */
  private drawCameraCoverage(camera: Camera, rotation: number): void {
    const angleRad = (camera.angle * Math.PI) / 180;
    const rotationRad = (rotation * Math.PI) / 180;
    const startAngle = rotationRad - angleRad / 2;
    const endAngle = rotationRad + angleRad / 2;

    this.ctx.fillStyle = `${CAMERA_CONFIG.colors[camera.type]}20`;
    this.ctx.beginPath();
    this.ctx.moveTo(camera.x, camera.y);
    this.ctx.arc(camera.x, camera.y, camera.range, startAngle, endAngle);
    this.ctx.closePath();
    this.ctx.fill();

    // Desenha bordas do cone de visão
    this.ctx.strokeStyle = `${CAMERA_CONFIG.colors[camera.type]}60`;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(camera.x, camera.y);
    this.ctx.lineTo(
      camera.x + camera.range * Math.cos(startAngle),
      camera.y + camera.range * Math.sin(startAngle)
    );
    this.ctx.moveTo(camera.x, camera.y);
    this.ctx.lineTo(
      camera.x + camera.range * Math.cos(endAngle),
      camera.y + camera.range * Math.sin(endAngle)
    );
    this.ctx.stroke();
  }

  /**
   * Desenha indicador de direção da câmera
   */
  private drawCameraDirection(camera: Camera, rotation: number, size: number, color: string): void {
    const rotationRad = (rotation * Math.PI) / 180;
    const directionLength = size + 8;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(camera.x, camera.y);
    this.ctx.lineTo(
      camera.x + directionLength * Math.cos(rotationRad),
      camera.y + directionLength * Math.sin(rotationRad)
    );
    this.ctx.stroke();

    // Desenha seta na ponta
    const arrowSize = 4;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(
      camera.x + directionLength * Math.cos(rotationRad),
      camera.y + directionLength * Math.sin(rotationRad)
    );
    this.ctx.lineTo(
      camera.x + (directionLength - arrowSize) * Math.cos(rotationRad - 0.3),
      camera.y + (directionLength - arrowSize) * Math.sin(rotationRad - 0.3)
    );
    this.ctx.lineTo(
      camera.x + (directionLength - arrowSize) * Math.cos(rotationRad + 0.3),
      camera.y + (directionLength - arrowSize) * Math.sin(rotationRad + 0.3)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Desenha handles de edição para câmera selecionada
   */
  private drawCameraEditHandles(camera: Camera): void {
    const rotationRad = (camera.rotation * Math.PI) / 180;
    const size = CAMERA_CONFIG.sizes[camera.type];
    
    // Handle de rotação (círculo no final da direção)
    const rotationHandleDistance = size + 25;
    const rotationHandleX = camera.x + rotationHandleDistance * Math.cos(rotationRad);
    const rotationHandleY = camera.y + rotationHandleDistance * Math.sin(rotationRad);
    
    this.state.cameraEdit.rotationHandle = { x: rotationHandleX, y: rotationHandleY };
    
    console.log(`🔧 Desenhando handle de rotação em (${rotationHandleX.toFixed(1)}, ${rotationHandleY.toFixed(1)})`);
    
    // Desenha handle de rotação (maior e mais visível)
    this.ctx.fillStyle = '#3B82F6';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(rotationHandleX, rotationHandleY, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Desenha um símbolo de rotação no handle
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(rotationHandleX, rotationHandleY, 4, 0, Math.PI * 1.5);
    this.ctx.stroke();
    
    // Desenha linha de conexão
    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = '#3B82F6';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(camera.x + size * Math.cos(rotationRad), camera.y + size * Math.sin(rotationRad));
    this.ctx.lineTo(rotationHandleX, rotationHandleY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Handle de alcance (círculo na borda do alcance)
    const rangeHandleX = camera.x + camera.range * Math.cos(rotationRad);
    const rangeHandleY = camera.y + camera.range * Math.sin(rotationRad);
    
    this.state.cameraEdit.rangeHandle = { x: rangeHandleX, y: rangeHandleY };
    
    // Desenha handle de alcance
    this.ctx.fillStyle = '#10B981';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(rangeHandleX, rangeHandleY, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Desenha handles de ângulo (nas bordas do cone)
    const angleRad = (camera.angle * Math.PI) / 180;
    const startAngle = rotationRad - angleRad / 2;
    const endAngle = rotationRad + angleRad / 2;
    
    // Handle de ângulo esquerdo
    const leftAngleX = camera.x + camera.range * Math.cos(startAngle);
    const leftAngleY = camera.y + camera.range * Math.sin(startAngle);
    
    this.ctx.fillStyle = '#F59E0B';
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(leftAngleX, leftAngleY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Handle de ângulo direito
    const rightAngleX = camera.x + camera.range * Math.cos(endAngle);
    const rightAngleY = camera.y + camera.range * Math.sin(endAngle);
    
    this.ctx.beginPath();
    this.ctx.arc(rightAngleX, rightAngleY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Limpa o canvas
   */
  private clearCanvas(): void {
    if (confirm('Tem certeza que deseja limpar todo o mapa?')) {
      this.state.cameras = [];
      this.state.walls = [];
      this.state.selectedCamera = null;
      this.state.nextCameraId = 1;
      this.state.nextWallId = 1;
      this.state.isDrawingWall = false;
      this.state.wallStartPoint = null;
      this.state.cameraEdit.isRotating = false;
      this.state.cameraEdit.isResizing = false;
      this.state.cameraEdit.rotationHandle = null;
      this.state.cameraEdit.rangeHandle = null;
      this.clearCameraControls();
      this.drawCanvas();
      this.updateCameraCount();
    }
  }

  /**
   * Exporta o canvas
   */
  private exportCanvas(): void {
    const link = document.createElement('a');
    link.download = `cftv-projeto-${new Date().toISOString().split('T')[0]}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
  }

  /**
   * Mostra modal de orçamento
   */
  private showBudgetModal(): void {
    this.getElementById('budgetModal').classList.remove('hidden');
  }

  /**
   * Esconde modal de orçamento
   */
  private hideBudgetModal(): void {
    this.getElementById('budgetModal').classList.add('hidden');
    (this.getElementById('budgetForm') as HTMLFormElement).reset();
  }

  /**
   * Manipula submit do formulário de orçamento
   */
  private handleBudgetFormSubmit(event: Event): void {
    event.preventDefault();
    
    const description = (this.getElementById('itemDescription') as HTMLInputElement).value;
    const quantity = parseInt((this.getElementById('itemQuantity') as HTMLInputElement).value);
    const unitPrice = parseFloat((this.getElementById('itemPrice') as HTMLInputElement).value);
    const category = (this.getElementById('itemCategory') as HTMLSelectElement).value as BudgetItem['category'];
    const specifications = (this.getElementById('itemSpecs') as HTMLTextAreaElement).value;

    const newItem: BudgetItem = {
      id: Date.now(),
      description,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      category,
      specifications,
    };

    this.state.budgetItems.push(newItem);
    this.renderBudgetList();
    this.hideBudgetModal();
  }

  /**
   * Renderiza lista de orçamento
   */
  private renderBudgetList(): void {
    const budgetList = this.getElementById('budgetList');
    budgetList.innerHTML = '';

    let total = 0;

    this.state.budgetItems.forEach(item => {
      total += item.totalPrice;
      
      const itemDiv = document.createElement('div');
      itemDiv.className = 'budget-item bg-gray-50 p-3 rounded-lg border';
      itemDiv.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h4 class="font-semibold text-gray-800">${item.description}</h4>
            <p class="text-sm text-gray-600">Qtd: ${item.quantity} × R$ ${item.unitPrice.toFixed(2)}</p>
            ${item.specifications ? `<p class="text-xs text-gray-500 mt-1">${item.specifications}</p>` : ''}
          </div>
          <div class="text-right">
            <div class="font-bold text-indigo-600">R$ ${item.totalPrice.toFixed(2)}</div>
            <button onclick="cftvApp.removeBudgetItem(${item.id})" 
                    class="text-red-500 hover:text-red-700 text-xs mt-1">
              Remover
            </button>
          </div>
        </div>
      `;
      
      budgetList.appendChild(itemDiv);
    });

    this.getElementById('totalBudget').textContent = `R$ ${total.toFixed(2)}`;
    
    // Atualiza também o total na área de impressão
    this.updateElementText('proposalTotalValue', this.formatCurrency(total));
    this.updateElementText('proposalTotalValueFirstPage', this.formatCurrency(total));
  }

  /**
   * Remove item do orçamento
   */
  public removeBudgetItem(id: number): void {
    this.state.budgetItems = this.state.budgetItems.filter(item => item.id !== id);
    this.renderBudgetList();
  }

  /**
   * Mostra modal de configuração da proposta
   */
  private showProposalConfigModal(): void {
    const modal = this.getElementById('proposalConfigModal');
    modal.classList.remove('hidden');
    
    // Carrega valores salvos no localStorage se existirem
    this.loadProposalConfig();
    
    // Adiciona event listeners para o modal
    this.getElementById('cancelProposalConfig').addEventListener('click', this.hideProposalConfigModal.bind(this));
    this.getElementById('proposalConfigForm').addEventListener('submit', this.saveProposalConfig.bind(this));
    
    console.log('📋 Modal de configuração da proposta aberto');
  }

  /**
   * Esconde modal de configuração da proposta
   */
  private hideProposalConfigModal(): void {
    const modal = this.getElementById('proposalConfigModal');
    modal.classList.add('hidden');
    console.log('📋 Modal de configuração da proposta fechado');
  }

  /**
   * Carrega configurações da proposta do localStorage
   */
  private loadProposalConfig(): void {
    const config = localStorage.getItem('proposalConfig');
    if (config) {
      try {
        const data = JSON.parse(config);
        
        // Dados da empresa
        (this.getElementById('configCompanyName') as HTMLInputElement).value = data.companyName || 'Sua Empresa de Segurança Eletrônica';
        (this.getElementById('configCompanyCNPJ') as HTMLInputElement).value = data.companyCNPJ || 'XX.XXX.XXX/XXXX-XX';
        (this.getElementById('configCompanyPhone') as HTMLInputElement).value = data.companyPhone || '(11) 99999-9999';
        (this.getElementById('configCompanyEmail') as HTMLInputElement).value = data.companyEmail || 'contato@empresa.com.br';
        
        // Dados do cliente
        (this.getElementById('configClientName') as HTMLInputElement).value = data.clientName || 'Nome do Cliente';
        (this.getElementById('configClientPhone') as HTMLInputElement).value = data.clientPhone || '';
        (this.getElementById('configClientEmail') as HTMLInputElement).value = data.clientEmail || '';
        (this.getElementById('configClientDocument') as HTMLInputElement).value = data.clientDocument || '';
        (this.getElementById('configClientAddress') as HTMLTextAreaElement).value = data.clientAddress || '';
        
        // Configurações da proposta
        (this.getElementById('configProposalValidity') as HTMLInputElement).value = data.proposalValidity || '15';
        (this.getElementById('configDeliveryTime') as HTMLInputElement).value = data.deliveryTime || '5 a 10 dias úteis';
        (this.getElementById('configPaymentMethod') as HTMLInputElement).value = data.paymentMethod || 'À vista com desconto ou parcelado';
        (this.getElementById('configWarrantyEquipment') as HTMLInputElement).value = data.warrantyEquipment || '12 meses';
        
        console.log('📋 Configurações da proposta carregadas do localStorage');
      } catch (error) {
        console.warn('⚠️ Erro ao carregar configurações da proposta:', error);
      }
    }
  }

  /**
   * Salva configurações da proposta
   */
  private saveProposalConfig(event: Event): void {
    event.preventDefault();
    
    const config = {
      // Dados da empresa
      companyName: (this.getElementById('configCompanyName') as HTMLInputElement).value,
      companyCNPJ: (this.getElementById('configCompanyCNPJ') as HTMLInputElement).value,
      companyPhone: (this.getElementById('configCompanyPhone') as HTMLInputElement).value,
      companyEmail: (this.getElementById('configCompanyEmail') as HTMLInputElement).value,
      
      // Dados do cliente
      clientName: (this.getElementById('configClientName') as HTMLInputElement).value,
      clientPhone: (this.getElementById('configClientPhone') as HTMLInputElement).value,
      clientEmail: (this.getElementById('configClientEmail') as HTMLInputElement).value,
      clientDocument: (this.getElementById('configClientDocument') as HTMLInputElement).value,
      clientAddress: (this.getElementById('configClientAddress') as HTMLTextAreaElement).value,
      
      // Configurações da proposta
      proposalValidity: (this.getElementById('configProposalValidity') as HTMLInputElement).value,
      deliveryTime: (this.getElementById('configDeliveryTime') as HTMLInputElement).value,
      paymentMethod: (this.getElementById('configPaymentMethod') as HTMLInputElement).value,
      warrantyEquipment: (this.getElementById('configWarrantyEquipment') as HTMLInputElement).value,
    };
    
    // Salva no localStorage
    localStorage.setItem('proposalConfig', JSON.stringify(config));
    
    // Atualiza os campos da proposta imediatamente
    this.updateProposalFields(config);
    
    // Fecha o modal
    this.hideProposalConfigModal();
    
    console.log('💾 Configurações da proposta salvas:', config);
    
    // Mostra mensagem de sucesso
    alert('✅ Configurações salvas com sucesso!');
  }

  /**
   * Atualiza os campos da proposta com as configurações salvas
   */
  private updateProposalFields(config: any): void {
    // Atualiza dados da empresa na proposta
    this.updateElementText('proposalCompanyName', config.companyName);
    this.updateElementText('proposalCompanyCNPJ', config.companyCNPJ);
    this.updateElementText('proposalCompanyPhone', config.companyPhone);
    this.updateElementText('proposalCompanyEmail', config.companyEmail);
    
    // Atualiza dados do cliente na proposta
    this.updateElementText('proposalClientName', config.clientName);
    
    // Atualiza configurações da proposta
    this.updateElementText('proposalValidity', `${config.proposalValidity} dias`);
    
    console.log('📋 Campos da proposta atualizados');
  }

  /**
   * Gera proposta comercial
   */
  private generateProposal(): void {
    this.prepareProposalData();
    
    // Pequeno delay para garantir que tudo foi renderizado
    setTimeout(() => {
      window.print();
    }, 300);
  }

  /**
   * Prepara os dados da proposta para impressão
   */
  private prepareProposalData(): void {
    const proposalSection = document.getElementById('proposalSection');
    if (!proposalSection) return;

    // Mostra a seção de proposta
    proposalSection.style.display = 'block';

    // Carrega configurações salvas
    this.loadSavedProposalData();

    // Atualiza data da proposta
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const proposalNumber = `CFTV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getTime().toString().slice(-4)}`;
    
    this.updateElementText('proposalDate', dateStr);
    this.updateElementText('proposalNumber', proposalNumber);

    // Copia canvas para impressão
    this.copyCanvasToProposal();

    // Popula informações dos andares
    this.populateFloorsInfo();

    // Popula tabela de orçamento
    this.populateProposalBudgetTable();

    // Atualiza total
    const total = this.state.budgetItems.reduce((sum, item) => sum + item.totalPrice, 0);
    this.updateElementText('proposalTotalValue', this.formatCurrency(total));
    this.updateElementText('proposalTotalValueFirstPage', this.formatCurrency(total));
  }

  /**
   * Carrega dados salvos da proposta
   */
  private loadSavedProposalData(): void {
    const config = localStorage.getItem('proposalConfig');
    if (config) {
      try {
        const data = JSON.parse(config);
        this.updateProposalFields(data);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar dados salvos da proposta:', error);
      }
    }
  }

  /**
   * Copia o canvas principal para o canvas de impressão incluindo todos os andares
   */
  private copyCanvasToProposal(): void {
    const printCanvas = document.getElementById('printCanvas') as HTMLCanvasElement;
    if (!printCanvas) return;

    // Calcula altura necessária para todos os andares
    const floorHeight = this.canvas.height;
    const totalFloors = this.state.floors.total;
    const spacing = 50; // Espaçamento entre andares
    const titleHeight = 40; // Altura para título de cada andar

    printCanvas.width = this.canvas.width;
    printCanvas.height = (floorHeight + spacing + titleHeight) * totalFloors - spacing;

    const printCtx = printCanvas.getContext('2d');
    if (!printCtx) return;

    // Desenha cada andar
    for (let floor = 1; floor <= totalFloors; floor++) {
      const yOffset = (floorHeight + spacing + titleHeight) * (floor - 1);
      
      // Desenha título do andar
      const floorName = this.state.floors.names[floor] || `${floor}º Andar`;
      printCtx.fillStyle = '#374151';
      printCtx.font = 'bold 20px Arial';
      printCtx.textAlign = 'left';
      printCtx.fillText(floorName, 10, yOffset + 25);
      
      // Desenha linha separadora
      printCtx.strokeStyle = '#D1D5DB';
      printCtx.lineWidth = 1;
      printCtx.beginPath();
      printCtx.moveTo(0, yOffset + titleHeight - 5);
      printCtx.lineTo(printCanvas.width, yOffset + titleHeight - 5);
      printCtx.stroke();

      // Desenha conteúdo do andar
      this.drawFloorOnCanvas(printCtx, floor, 0, yOffset + titleHeight);
    }

    console.log(`📄 Canvas de impressão gerado com ${totalFloors} andares`);
  }

  /**
   * Desenha um andar específico no canvas
   */
  private drawFloorOnCanvas(ctx: CanvasRenderingContext2D, floor: number, offsetX: number, offsetY: number): void {
    // Salva estado do contexto
    ctx.save();
    
    // Aplica offset
    ctx.translate(offsetX, offsetY);
    
    // Limpa área do andar
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Desenha grid de fundo
    this.drawGridOnCanvas(ctx);
    
    // Desenha paredes do andar
    this.drawWallsOnCanvas(ctx, floor);
    
    // Desenha câmeras do andar
    this.drawCamerasOnCanvas(ctx, floor);
    
    // Restaura estado do contexto
    ctx.restore();
  }

  /**
   * Desenha grid de fundo no canvas
   */
  private drawGridOnCanvas(ctx: CanvasRenderingContext2D): void {
    const gridSize = 20;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    
    // Linhas verticais
    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    
    // Linhas horizontais
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  /**
   * Desenha paredes de um andar específico no canvas
   */
  private drawWallsOnCanvas(ctx: CanvasRenderingContext2D, floor: number): void {
    const wallsInFloor = this.state.walls.filter(wall => wall.floor === floor);
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    
    wallsInFloor.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.startX, wall.startY);
      ctx.lineTo(wall.endX, wall.endY);
      ctx.stroke();
    });
  }

  /**
   * Desenha câmeras de um andar específico no canvas
   */
  private drawCamerasOnCanvas(ctx: CanvasRenderingContext2D, floor: number): void {
    const camerasInFloor = this.state.cameras.filter(camera => camera.floor === floor);
    
    camerasInFloor.forEach(camera => {
      const color = CAMERA_CONFIG.colors[camera.type];
      const size = CAMERA_CONFIG.sizes[camera.type];

      // Desenha área de cobertura
      this.drawCameraCoverageOnCanvas(ctx, camera, camera.rotation);

      // Desenha câmera
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, size, 0, 2 * Math.PI);
      ctx.fill();

      // Desenha direção da câmera
      this.drawCameraDirectionOnCanvas(ctx, camera, camera.rotation, size, color);

      // Desenha label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(camera.label, camera.x, camera.y - size - 5);
    });
  }

  /**
   * Desenha área de cobertura da câmera no canvas
   */
  private drawCameraCoverageOnCanvas(ctx: CanvasRenderingContext2D, camera: Camera, rotation: number): void {
    const startAngle = (rotation - camera.angle / 2) * Math.PI / 180;
    const endAngle = (rotation + camera.angle / 2) * Math.PI / 180;

    ctx.fillStyle = CAMERA_CONFIG.colors[camera.type] + '20';
    ctx.strokeStyle = CAMERA_CONFIG.colors[camera.type] + '60';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.arc(camera.x, camera.y, camera.range, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Desenha direção da câmera no canvas
   */
  private drawCameraDirectionOnCanvas(ctx: CanvasRenderingContext2D, camera: Camera, rotation: number, size: number, color: string): void {
    const angleRad = rotation * Math.PI / 180;
    const lineLength = size + 10;
    
    const endX = camera.x + Math.cos(angleRad) * lineLength;
    const endY = camera.y + Math.sin(angleRad) * lineLength;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Desenha seta na ponta
    const arrowSize = 4;
    const arrowAngle = 0.5;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angleRad - arrowAngle),
      endY - arrowSize * Math.sin(angleRad - arrowAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angleRad + arrowAngle),
      endY - arrowSize * Math.sin(angleRad + arrowAngle)
    );
    ctx.stroke();
  }

  /**
   * Popula informações dos andares na proposta (REMOVIDO - seção não mais utilizada)
   */
  private populateFloorsInfo(): void {
    // Seção "Distribuição por Andares" foi removida da proposta
    // Esta função mantida para compatibilidade, mas não executa nenhuma ação
    return;
  }

  /**
   * Popula a tabela de orçamento na proposta
   */
  private populateProposalBudgetTable(): void {
    const tableBody = document.getElementById('proposalBudgetTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    this.state.budgetItems.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="border border-gray-300 p-2 text-center">${index + 1}</td>
        <td class="border border-gray-300 p-2">${item.description}</td>
        <td class="border border-gray-300 p-2 text-center">${item.quantity}</td>
        <td class="border border-gray-300 p-2 text-right">${this.formatCurrency(item.unitPrice)}</td>
        <td class="border border-gray-300 p-2 text-right">${this.formatCurrency(item.totalPrice)}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  /**
   * Formata valor como moeda brasileira
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Atualiza contador de câmeras
   */
  private updateCameraCount(): void {
    const countElement = document.getElementById('cameraCount');
    if (countElement) {
      // Conta apenas câmeras do andar atual
      const camerasInCurrentFloor = this.state.cameras.filter(camera => camera.floor === this.state.currentFloor);
      countElement.textContent = `Câmeras: ${camerasInCurrentFloor.length}`;
    }
  }

  /**
   * Atualiza instruções baseado no modo atual
   */
  private updateInstructions(): void {
    const instructionsElement = document.getElementById('modeInstructions');
    if (instructionsElement) {
      const instructions = {
        select: 'Clique para selecionar e arrastar câmeras. Use os controles para ajustar ângulo e alcance.',
        camera: 'Clique no mapa para adicionar câmeras.',
        wall: this.state.isDrawingWall 
          ? 'Clique no ponto final da parede para completar o desenho.'
          : 'Clique e arraste para desenhar paredes.',
        delete: 'Clique em câmeras ou paredes para removê-las.',
      };
      
      const bgColor = {
        select: 'bg-blue-50 border-blue-200',
        camera: 'bg-green-50 border-green-200',
        wall: this.state.isDrawingWall ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200',
        delete: 'bg-red-50 border-red-200',
      };

      const textColor = {
        select: 'text-blue-800',
        camera: 'text-green-800',
        wall: this.state.isDrawingWall ? 'text-orange-800' : 'text-yellow-800',
        delete: 'text-red-800',
      };
      
      instructionsElement.className = `mt-4 p-3 border rounded-lg ${bgColor[this.state.currentTool]}`;
      instructionsElement.innerHTML = `
        <p class="text-sm ${textColor[this.state.currentTool]}">
          ${instructions[this.state.currentTool]}
        </p>
      `;
    }
  }

  /**
   * Atualiza toda a interface
   */
  private updateUI(): void {
    this.updateCameraCount();
    this.updateInstructions();
  }

  /**
   * Helper para getElementById com validação
   */
  private getElementById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Elemento com ID '${id}' não encontrado`);
    }
    return element;
  }

  /**
   * Getter para o estado (para debug)
   */
  public getState(): Readonly<AppState> {
    return { ...this.state };
  }

  /**
   * Atualiza texto de um elemento
   */
  private updateElementText(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }
}