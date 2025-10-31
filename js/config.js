/**
 * CFTV Orçamento Visual - Configurações
 * Arquivo de configurações e constantes do sistema
 * Autor: Sistema CFTV
 * Data: 2025
 */

// ========================================
// CONFIGURAÇÕES DO CANVAS
// ========================================
export const CANVAS_CONFIG = {
    WIDTH: 800,
    HEIGHT: 450,
    PIXELS_TO_METERS_RATIO: 0.05,
    CAMERA_RADIUS: 10,
    WALL_CLICK_TOLERANCE: 8,
    WALL_THICKNESS: 5
};

// ========================================
// CONFIGURAÇÕES DAS CÂMERAS
// ========================================
export const CAMERA_CONFIG = {
    DEFAULT_ANGLE: 90,
    DEFAULT_RANGE: 50,
    DEFAULT_ROTATION: 0,
    MIN_ANGLE: 30,
    MAX_ANGLE: 180,
    MIN_RANGE: 20,
    MAX_RANGE: 100,
    COVERAGE_COLORS: [
        '#EF4444', '#F97316', '#F59E0B', 
        '#10B981', '#3B82F6', '#8B5CF6'
    ]
};

// ========================================
// TIPOS DE CÂMERAS
// ========================================
export const CAMERA_TYPES = {
    DOME: 'dome',
    BULLET: 'bullet',
    PTZ: 'ptz'
};

// ========================================
// MODOS DE EDIÇÃO
// ========================================
export const EDIT_MODES = {
    CAMERA: 'CAMERA',
    WALL: 'WALL'
};

// ========================================
// CATEGORIAS DE ITENS DO ORÇAMENTO
// ========================================
export const BUDGET_CATEGORIES = {
    EQUIPMENT: 'equipamento',
    SERVICE: 'servico',
    ACCESSORY: 'acessorio'
};

// ========================================
// CONFIGURAÇÕES DE INTERFACE
// ========================================
export const UI_CONFIG = {
    MODAL_TRANSITION_DURATION: 300,
    CANVAS_HOVER_SHADOW: '0 0 10px rgba(79, 70, 229, 0.5)',
    SELECTED_CAMERA_BORDER: '0 0 0 3px rgba(79, 70, 229, 0.7)',
    BUTTON_ACTIVE_SHADOW: '0 0 0 2px #4F46E5 inset'
};

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
    WALL_DRAWING: '#EF4444'
};

// ========================================
// TEXTOS E LABELS
// ========================================
export const LABELS = {
    CAMERA_MODES: {
        DOME: 'DOME (Interna)',
        BULLET: 'BULLET (Externa)',
        PTZ: 'PTZ (Giratória)'
    },
    BUDGET_CATEGORIES: {
        EQUIPMENT: 'Equipamento',
        SERVICE: 'Mão de Obra / Serviço',
        ACCESSORY: 'Acessório / Material'
    },
    INSTRUCTIONS: {
        CAMERA_MODE: 'Clique no mapa para adicionar câmeras, ou clique e arraste para movê-las.',
        WALL_MODE: 'Clique e arraste no mapa para desenhar as paredes. Clique em uma parede para removê-la.'
    }
};

// ========================================
// VALORES PADRÃO PARA ITENS DO ORÇAMENTO
// ========================================
export const DEFAULT_BUDGET_ITEMS = [
    {
        name: 'NVR 8 Canais POE',
        qty: 1,
        price: 1200.00,
        category: BUDGET_CATEGORIES.EQUIPMENT,
        imageUrl: 'https://placehold.co/150x100/38B2AC/ffffff?text=NVR'
    },
    {
        name: 'Disco Rígido 2TB',
        qty: 1,
        price: 450.00,
        category: BUDGET_CATEGORIES.EQUIPMENT,
        imageUrl: null
    },
    {
        name: 'Serviço de Configuração Remota',
        qty: 1,
        price: 300.00,
        category: BUDGET_CATEGORIES.SERVICE,
        imageUrl: null
    },
    {
        name: 'Cabo UTP CAT5e (metros)',
        qty: 100,
        price: 3.50,
        category: BUDGET_CATEGORIES.ACCESSORY,
        imageUrl: null
    }
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
        email: 'contato@empresa.com.br'
    }
};