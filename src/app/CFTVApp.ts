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
      selectedCamera: null,
      currentFloor: 1,
      isDrawingWall: false,
      isAddingCamera: false,
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
      'selectMode', 'cameraMode', 'wallMode',
      'cameraType',
      'clearCanvas', 'exportCanvas',
      'budgetList', 'totalBudget',
      'addBudgetItem', 'generateProposal'
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

    // Canvas events
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));

    // Botões de ação
    this.getElementById('clearCanvas').addEventListener('click', this.clearCanvas.bind(this));
    this.getElementById('exportCanvas').addEventListener('click', this.exportCanvas.bind(this));

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
        // TODO: Implementar desenho de paredes
        break;
    }
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
    const clickedCamera = this.state.cameras.find(camera => {
      const distance = Math.sqrt((camera.x - x) ** 2 + (camera.y - y) ** 2);
      return distance <= CAMERA_CONFIG.sizes[camera.type];
    });

    this.state.selectedCamera = clickedCamera || null;
    this.drawCanvas();
    
    if (clickedCamera) {
      console.log('🎯 Câmera selecionada:', clickedCamera);
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

      // Desenha área de cobertura
      this.ctx.fillStyle = `${color}20`;
      this.ctx.beginPath();
      this.ctx.arc(camera.x, camera.y, camera.range, 0, 2 * Math.PI);
      this.ctx.fill();

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

      // Desenha label
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(camera.label, camera.x, camera.y - size - 5);
    });
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
        select: 'Clique para selecionar e mover câmeras.',
        camera: 'Clique no mapa para adicionar câmeras.',
        wall: 'Clique e arraste para desenhar paredes.',
        delete: 'Clique para remover câmeras ou paredes.',
      };
      
      instructionsElement.innerHTML = `
        <p class="text-sm text-blue-800">
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