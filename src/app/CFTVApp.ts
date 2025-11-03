/**
 * CFTV App - Classe Principal TypeScript
 * Gerenciador principal da aplicação com tipagem estática
 */

import type { 
  AppState, 
  Camera, 
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
      'cameraType',
      'clearCanvas', 'exportCanvas',
      'budgetList', 'totalBudget',
      'addBudgetItem', 'generateProposal',
      'cameraControls', 'cameraX', 'cameraY', 'cameraAngle', 'cameraRange', 'cameraRotation',
      'updateCamera', 'deleteCamera'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      throw new Error(`Elementos DOM obrigatórios não encontrados: ${missingElements.join(', ')}`);
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

    // Canvas events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));

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

    // Orçamento
    this.getElementById('addBudgetItem').addEventListener('click', this.showBudgetModal.bind(this));
    this.getElementById('generateProposal').addEventListener('click', this.generateProposal.bind(this));

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
   * Manipula clicks no canvas
   */
  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
    if (!this.state.isDrawingWall) {
      // Início do desenho da parede
      this.state.wallStartPoint = { x, y };
      this.state.isDrawingWall = true;
      console.log('🟠 Iniciando desenho de parede em:', { x, y });
    } else {
      // Fim do desenho da parede
      if (this.state.wallStartPoint) {
        this.addWall(this.state.wallStartPoint.x, this.state.wallStartPoint.y, x, y);
        this.state.isDrawingWall = false;
        this.state.wallStartPoint = null;
        console.log('✅ Parede criada');
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
    // Primeiro tenta remover câmera
    const cameraIndex = this.state.cameras.findIndex(camera => {
      const distance = Math.sqrt((camera.x - x) ** 2 + (camera.y - y) ** 2);
      return distance <= CAMERA_CONFIG.sizes[camera.type];
    });

    if (cameraIndex !== -1) {
      const removedCamera = this.state.cameras.splice(cameraIndex, 1)[0];
      this.state.selectedCamera = null;
      this.hideCameraControls();
      this.drawCanvas();
      this.updateCameraCount();
      console.log('🗑️ Câmera removida:', removedCamera);
      return;
    }

    // Se não encontrou câmera, tenta remover parede
    const wallIndex = this.state.walls.findIndex(wall => {
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
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    // Atualiza coordenadas se o elemento existir
    const coordsElement = document.getElementById('mouseCoords');
    if (coordsElement) {
      coordsElement.textContent = `X: ${x}, Y: ${y}`;
    }

    // Se estiver desenhando parede, mostra linha de preview
    if (this.state.isDrawingWall && this.state.wallStartPoint) {
      this.drawCanvas();
      this.drawWallPreview(this.state.wallStartPoint.x, this.state.wallStartPoint.y, x, y);
    }
  }

  /**
   * Manipula início de drag no canvas
   */
  private handleCanvasMouseDown(event: MouseEvent): void {
    if (this.state.currentTool === 'select' && this.state.selectedCamera) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const distance = Math.sqrt(
        (this.state.selectedCamera.x - x) ** 2 + 
        (this.state.selectedCamera.y - y) ** 2
      );
      
      if (distance <= CAMERA_CONFIG.sizes[this.state.selectedCamera.type]) {
        this.state.canvas.isDragging = true;
        this.canvas.style.cursor = 'grabbing';
      }
    }
  }

  /**
   * Manipula fim de drag no canvas
   */
  private handleCanvasMouseUp(): void {
    if (this.state.canvas.isDragging) {
      this.state.canvas.isDragging = false;
      this.canvas.style.cursor = 'crosshair';
      this.updateCameraControlsFromSelected();
    }
  }

  /**
   * Desenha preview da parede sendo desenhada
   */
  private drawWallPreview(startX: number, startY: number, endX: number, endY: number): void {
    this.ctx.strokeStyle = '#EF4444';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
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

    // Senão, procura câmera para selecionar
    const clickedCamera = this.state.cameras.find(camera => {
      const distance = Math.sqrt((camera.x - x) ** 2 + (camera.y - y) ** 2);
      return distance <= CAMERA_CONFIG.sizes[camera.type];
    });

    this.state.selectedCamera = clickedCamera || null;
    this.drawCanvas();
    
    if (clickedCamera) {
      this.showCameraControls(clickedCamera);
      console.log('🎯 Câmera selecionada:', clickedCamera);
    } else {
      this.hideCameraControls();
    }
  }

  /**
   * Mostra controles da câmera selecionada
   */
  private showCameraControls(camera: Camera): void {
    const controlsPanel = this.getElementById('cameraControls');
    controlsPanel.classList.remove('hidden');
    
    // Preenche os controles com os valores da câmera
    (this.getElementById('cameraX') as HTMLInputElement).value = camera.x.toString();
    (this.getElementById('cameraY') as HTMLInputElement).value = camera.y.toString();
    (this.getElementById('cameraAngle') as HTMLInputElement).value = camera.angle.toString();
    (this.getElementById('cameraRange') as HTMLInputElement).value = camera.range.toString();
    (this.getElementById('cameraRotation') as HTMLInputElement).value = (camera.angle || 0).toString();
    
    // Atualiza os displays
    this.updateAngleDisplay();
    this.updateRangeDisplay();
    this.updateRotationDisplay();
  }

  /**
   * Esconde controles da câmera
   */
  private hideCameraControls(): void {
    const controlsPanel = this.getElementById('cameraControls');
    controlsPanel.classList.add('hidden');
  }

  /**
   * Atualiza controles baseado na câmera selecionada
   */
  private updateCameraControlsFromSelected(): void {
    if (this.state.selectedCamera) {
      this.showCameraControls(this.state.selectedCamera);
    }
  }

  /**
   * Atualiza display do ângulo
   */
  private updateAngleDisplay(): void {
    const angleSlider = this.getElementById('angleValue');
    const angle = (this.getElementById('cameraAngle') as HTMLInputElement).value;
    angleSlider.textContent = `${angle}°`;
  }

  /**
   * Atualiza display do alcance
   */
  private updateRangeDisplay(): void {
    const rangeSlider = this.getElementById('rangeValue');
    const range = (this.getElementById('cameraRange') as HTMLInputElement).value;
    rangeSlider.textContent = `${range}px`;
  }

  /**
   * Atualiza display da rotação
   */
  private updateRotationDisplay(): void {
    const rotationSlider = this.getElementById('rotationValue');
    const rotation = (this.getElementById('cameraRotation') as HTMLInputElement).value;
    rotationSlider.textContent = `${rotation}°`;
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
    
    // Adiciona propriedade de rotação se não existir
    (this.state.selectedCamera as any).rotation = rotation;
    
    this.drawCanvas();
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
      this.hideCameraControls();
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
    this.state.walls.forEach(wall => {
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
    this.state.cameras.forEach(camera => {
      const isSelected = this.state.selectedCamera?.id === camera.id;
      const color = CAMERA_CONFIG.colors[camera.type];
      const size = CAMERA_CONFIG.sizes[camera.type];
      const rotation = (camera as any).rotation || 0;

      // Desenha área de cobertura (setor circular)
      this.drawCameraCoverage(camera, rotation);

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
      this.drawCameraDirection(camera, rotation, size, color);

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
      this.hideCameraControls();
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
  }

  /**
   * Remove item do orçamento
   */
  public removeBudgetItem(id: number): void {
    this.state.budgetItems = this.state.budgetItems.filter(item => item.id !== id);
    this.renderBudgetList();
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

    // Atualiza data da proposta
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const proposalNumber = `CFTV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getTime().toString().slice(-4)}`;
    
    this.updateElementText('proposalDate', dateStr);
    this.updateElementText('proposalNumber', proposalNumber);

    // Copia canvas para impressão
    this.copyCanvasToProposal();

    // Popula tabela de orçamento
    this.populateProposalBudgetTable();

    // Atualiza total
    const total = this.state.budgetItems.reduce((sum, item) => sum + item.totalPrice, 0);
    this.updateElementText('proposalTotalValue', this.formatCurrency(total));
  }

  /**
   * Copia o canvas principal para o canvas de impressão
   */
  private copyCanvasToProposal(): void {
    const printCanvas = document.getElementById('printCanvas') as HTMLCanvasElement;
    if (!printCanvas) return;

    printCanvas.width = this.canvas.width;
    printCanvas.height = this.canvas.height;

    const printCtx = printCanvas.getContext('2d');
    if (!printCtx) return;

    // Copia o conteúdo do canvas principal
    printCtx.drawImage(this.canvas, 0, 0);
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
      countElement.textContent = `Câmeras: ${this.state.cameras.length}`;
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