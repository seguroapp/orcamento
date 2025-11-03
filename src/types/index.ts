/**
 * Tipos e interfaces para o Sistema CFTV Visual Budget
 * Definições TypeScript para todas as entidades do sistema
 */

// ===== TIPOS BÁSICOS =====
export type CameraType = 'dome' | 'bullet' | 'ptz' | 'fisheye';
export type CameraStatus = 'active' | 'inactive' | 'maintenance';
export type FloorLevel = number;
export type EditMode = 'select' | 'camera' | 'wall' | 'delete';

// ===== INTERFACES PRINCIPAIS =====

/**
 * Interface para representar uma câmera no sistema
 */
export interface Camera {
  id: number;
  x: number;
  y: number;
  type: CameraType;
  angle: number;
  range: number;
  rotation: number;
  floor: FloorLevel;
  label: string;
  status: CameraStatus;
  price: number;
  description: string;
  installationCost?: number;
}

/**
 * Interface para representar paredes/obstáculos
 */
export interface Wall {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  floor: FloorLevel;
  type: 'wall' | 'door' | 'window';
}

/**
 * Interface para itens do orçamento
 */
export interface BudgetItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'camera' | 'cable' | 'equipment' | 'installation' | 'other';
  specifications?: string;
}

/**
 * Interface para configuração do canvas
 */
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  gridSize: number;
  showGrid: boolean;
  scale: number;
  minScale: number;
  maxScale: number;
}

/**
 * Interface para configuração de câmeras
 */
export interface CameraConfig {
  defaultRange: number;
  defaultAngle: number;
  colors: {
    dome: string;
    bullet: string;
    ptz: string;
    fisheye: string;
  };
  sizes: {
    dome: number;
    bullet: number;
    ptz: number;
    fisheye: number;
  };
}

/**
 * Interface para estado da aplicação
 */
export interface AppState {
  cameras: Camera[];
  walls: Wall[];
  budgetItems: BudgetItem[];
  nextCameraId: number;
  nextWallId: number;
  selectedCamera: Camera | null;
  currentFloor: FloorLevel;
  floors: {
    total: number;
    names: Record<number, string>;
  };
  isDrawingWall: boolean;
  isAddingCamera: boolean;
  wallStartPoint: Point2D | null;
  currentTool: 'select' | 'camera' | 'wall' | 'delete';
  canvas: {
    scale: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
  };
  cameraEdit: {
    isRotating: boolean;
    isResizing: boolean;
    rotationHandle: Point2D | null;
    rangeHandle: Point2D | null;
  };
}

/**
 * Interface para coordenadas 2D
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Interface para área retangular
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interface para círculo (área de cobertura da câmera)
 */
export interface Circle {
  centerX: number;
  centerY: number;
  radius: number;
}

/**
 * Interface para configurações de impressão/exportação
 */
export interface PrintConfig {
  pageSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeCanvas: boolean;
  includeBudget: boolean;
  includeSpecifications: boolean;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Interface para dados da proposta comercial
 */
export interface ProposalData {
  clientName: string;
  projectName: string;
  date: string;
  totalValue: number;
  items: BudgetItem[];
  technicalSpecs: string;
  observations: string;
  validityDays: number;
}

/**
 * Interface para eventos do sistema
 */
export interface SystemEvent {
  type: 'camera-added' | 'camera-removed' | 'camera-moved' | 'budget-updated' | 'state-changed';
  data: any;
  timestamp: Date;
}

/**
 * Interface para configurações de exportação
 */
export interface ExportOptions {
  format: 'json' | 'pdf' | 'png' | 'svg';
  includeImages: boolean;
  compression?: boolean;
  quality?: number; // 0-100 para imagens
}

// ===== TIPOS UTILITÁRIOS =====

/**
 * Tipo para representar callbacks de eventos
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * Tipo para representar propriedades opcionais de uma interface
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Tipo para representar propriedades obrigatórias de uma interface
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Tipo para representar apenas as chaves de uma interface
 */
export type KeysOf<T> = keyof T;

/**
 * Tipo para representar valores de uma interface
 */
export type ValuesOf<T> = T[keyof T];