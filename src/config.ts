/**
 * CFTV Orçamento Visual - Configurações TypeScript
 * Arquivo de configurações e constantes do sistema com tipagem estática
 * Autor: Sistema CFTV
 * Data: 2025
 */

import type { 
  CanvasConfig, 
  CameraConfig, 
  BudgetItem, 
  CameraType,
  PrintConfig 
} from './types/index.js';

// ========================================
// CONFIGURAÇÕES DO CANVAS
// ========================================
export const CANVAS_CONFIG: CanvasConfig = {
  width: 800,
  height: 450,
  backgroundColor: '#f8fafc',
  gridSize: 20,
  showGrid: true,
  scale: 1,
  minScale: 0.5,
  maxScale: 3,
};

// Configurações específicas do canvas CFTV
export const CANVAS_CFTV_CONFIG = {
  PIXELS_TO_METERS_RATIO: 0.05,
  CAMERA_RADIUS: 10,
  WALL_CLICK_TOLERANCE: 8,
  WALL_THICKNESS: 5,
} as const;

// ========================================
// CONFIGURAÇÕES DAS CÂMERAS
// ========================================
export const CAMERA_CONFIG: CameraConfig = {
  defaultRange: 50,
  defaultAngle: 90,
  colors: {
    dome: '#EF4444',
    bullet: '#F97316', 
    ptz: '#3B82F6',
    fisheye: '#10B981',
  },
  sizes: {
    dome: 12,
    bullet: 10,
    ptz: 14,
    fisheye: 11,
  },
};

// Configurações adicionais das câmeras
export const CAMERA_SPECS = {
  DEFAULT_ROTATION: 0,
  MIN_ANGLE: 30,
  MAX_ANGLE: 180,
  MIN_RANGE: 20,
  MAX_RANGE: 100,
  COVERAGE_COLORS: [
    '#EF4444', '#F97316', '#F59E0B', 
    '#10B981', '#3B82F6', '#8B5CF6'
  ],
} as const;

// ========================================
// TIPOS DE CÂMERAS (ENUM-LIKE)
// ========================================
export const CAMERA_TYPES = {
  DOME: 'dome',
  BULLET: 'bullet', 
  PTZ: 'ptz',
  FISHEYE: 'fisheye',
} as const satisfies Record<string, CameraType>;

// ========================================
// MODOS DE EDIÇÃO
// ========================================
export const EDIT_MODES = {
  SELECT: 'select',
  CAMERA: 'camera',
  WALL: 'wall',
  DELETE: 'delete',
} as const;

export type EditMode = typeof EDIT_MODES[keyof typeof EDIT_MODES];

// ========================================
// CATEGORIAS DE ITENS DO ORÇAMENTO  
// ========================================
export const BUDGET_CATEGORIES = {
  CAMERA: 'camera',
  CABLE: 'cable',
  EQUIPMENT: 'equipment',
  INSTALLATION: 'installation',
  OTHER: 'other',
} as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[keyof typeof BUDGET_CATEGORIES];

// ========================================
// CONFIGURAÇÕES DE INTERFACE
// ========================================
export const UI_CONFIG = {
  MODAL_TRANSITION_DURATION: 300,
  CANVAS_HOVER_SHADOW: '0 0 10px rgba(79, 70, 229, 0.5)',
  SELECTED_CAMERA_BORDER: '0 0 0 3px rgba(79, 70, 229, 0.7)',
  BUTTON_ACTIVE_SHADOW: '0 0 0 2px #4F46E5 inset',
  ANIMATION_DURATION: 200,
} as const;

// ========================================
// CONFIGURAÇÕES DE CORES
// ========================================
export const COLORS = {
  PRIMARY_BLUE: '#4F46E5',
  SELECTED_PURPLE: '#8B5CF6', 
  SUCCESS_GREEN: '#10B981',
  WARNING_YELLOW: '#F59E0B',
  DANGER_RED: '#EF4444',
  NEUTRAL_GRAY: '#6B7280',
  WALL_DEFAULT: '#374151',
  WALL_DRAWING: '#EF4444',
  BACKGROUND: '#f8fafc',
  GRID: '#e2e8f0',
} as const;

// ========================================
// TEXTOS E LABELS
// ========================================
export const LABELS = {
  CAMERA_MODES: {
    [CAMERA_TYPES.DOME]: 'DOME (Interna)',
    [CAMERA_TYPES.BULLET]: 'BULLET (Externa)', 
    [CAMERA_TYPES.PTZ]: 'PTZ (Giratória)',
    [CAMERA_TYPES.FISHEYE]: 'FISHEYE (360°)',
  },
  BUDGET_CATEGORIES: {
    [BUDGET_CATEGORIES.CAMERA]: 'Câmeras',
    [BUDGET_CATEGORIES.CABLE]: 'Cabos e Conectores',
    [BUDGET_CATEGORIES.EQUIPMENT]: 'Equipamentos',
    [BUDGET_CATEGORIES.INSTALLATION]: 'Instalação',
    [BUDGET_CATEGORIES.OTHER]: 'Outros',
  },
  INSTRUCTIONS: {
    [EDIT_MODES.SELECT]: 'Clique para selecionar e mover câmeras.',
    [EDIT_MODES.CAMERA]: 'Clique no mapa para adicionar câmeras.',
    [EDIT_MODES.WALL]: 'Clique e arraste para desenhar paredes.',
    [EDIT_MODES.DELETE]: 'Clique para remover câmeras ou paredes.',
  },
} as const;

// ========================================
// VALORES PADRÃO PARA ITENS DO ORÇAMENTO
// ========================================
export const DEFAULT_BUDGET_ITEMS: Readonly<BudgetItem[]> = [
  {
    id: 1,
    description: 'NVR 8 Canais POE',
    quantity: 1,
    unitPrice: 1200.00,
    totalPrice: 1200.00,
    category: BUDGET_CATEGORIES.EQUIPMENT,
    specifications: 'Gravador de vídeo em rede com 8 portas PoE+',
  },
  {
    id: 2,
    description: 'Disco Rígido 2TB',
    quantity: 1, 
    unitPrice: 450.00,
    totalPrice: 450.00,
    category: BUDGET_CATEGORIES.EQUIPMENT,
    specifications: 'HD SATA 3.5" para armazenamento de vídeo',
  },
  {
    id: 3,
    description: 'Serviço de Configuração Remota',
    quantity: 1,
    unitPrice: 300.00,
    totalPrice: 300.00,
    category: BUDGET_CATEGORIES.INSTALLATION,
    specifications: 'Configuração e testes do sistema completo',
  },
  {
    id: 4, 
    description: 'Cabo UTP CAT5e (metros)',
    quantity: 100,
    unitPrice: 3.50,
    totalPrice: 350.00,
    category: BUDGET_CATEGORIES.CABLE,
    specifications: 'Cabo de rede para transmissão de dados',
  },
];

// ========================================
// CONFIGURAÇÕES DE PROPOSTA
// ========================================
export const PROPOSAL_CONFIG = {
  VALIDITY_DAYS: 15,
  DEFAULT_CAMERA_PRICE: 350.00,
  COMPANY_INFO: {
    name: 'Sua Empresa de Segurança Eletrônica',
    phone: '(11) 99999-9999',
    email: 'contato@empresa.com.br',
    address: 'Endereço da empresa',
    cnpj: '00.000.000/0001-00',
  },
} as const;

// ========================================
// CONFIGURAÇÕES DE IMPRESSÃO
// ========================================
export const PRINT_CONFIG: PrintConfig = {
  pageSize: 'A4',
  orientation: 'portrait',
  includeCanvas: true,
  includeBudget: true, 
  includeSpecifications: true,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
};

// ========================================
// CONFIGURAÇÕES DE VALIDAÇÃO
// ========================================
export const VALIDATION_RULES = {
  CAMERA: {
    MIN_RANGE: 10,
    MAX_RANGE: 200,
    MIN_ANGLE: 15,
    MAX_ANGLE: 360,
  },
  BUDGET: {
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999.99,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 9999,
  },
  CANVAS: {
    MIN_COORDINATES: 0,
    MAX_COORDINATES: 2000,
  },
} as const;

// ========================================
// CONFIGURAÇÕES DE PERFORMANCE
// ========================================
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  MAX_UNDO_HISTORY: 50,
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
} as const;