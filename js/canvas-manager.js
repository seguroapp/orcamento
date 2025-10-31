/**
 * CFTV Orçamento Visual - Gerenciador de Canvas
 * Módulo responsável por todas as operações de desenho no canvas
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { CANVAS_CONFIG, CAMERA_CONFIG, COLORS } from './config.js';

/**
 * Classe responsável pelo gerenciamento do canvas e desenhos
 */
export class CanvasManager {
    constructor(canvas, ctx, appState) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.state = appState;
    }
    
    /**
     * Converte pixels para metros
     */
    pixelsToMeters(pixels) {
        return pixels * CANVAS_CONFIG.PIXELS_TO_METERS_RATIO;
    }
    
    /**
     * Converte metros para pixels
     */
    metersToPixels(meters) {
        return meters / CANVAS_CONFIG.PIXELS_TO_METERS_RATIO;
    }
    
    /**
     * Seleciona uma câmera e atualiza os controles de UI
     */
    selectCamera(camera) {
        this.state.selectedCamera = camera;
        this.drawMap();
        return camera;
    }
    
    /**
     * Desseleciona a câmera atual
     */
    deselectCamera() {
        this.state.selectedCamera = null;
        this.drawMap();
    }
    
    /**
     * Adiciona uma nova câmera ao mapa
     */
    addNewCamera(x, y) {
        const newCamera = {
            id: this.state.nextCameraId++,
            floor: this.state.currentFloor,
            x: x,
            y: y,
            type: 'dome', // Valor padrão, será atualizado pela UI
            angle: CAMERA_CONFIG.DEFAULT_ANGLE,
            range: CAMERA_CONFIG.DEFAULT_RANGE,
            rotation: CAMERA_CONFIG.DEFAULT_ROTATION,
            coverageColor: CAMERA_CONFIG.COVERAGE_COLORS[this.state.cameras.length % CAMERA_CONFIG.COVERAGE_COLORS.length]
        };
        
        this.state.cameras.push(newCamera);
        this.selectCamera(newCamera);
        return newCamera;
    }
    
    /**
     * Desenha o ícone da câmera
     */
    drawCameraIcon(x, y, type, id, isSelected = false) {
        const radius = CANVAS_CONFIG.CAMERA_RADIUS;
        this.ctx.fillStyle = COLORS.SUCCESS_GREEN;
        this.ctx.strokeStyle = '#065F46';
        this.ctx.lineWidth = 2;

        if (isSelected) {
            this.ctx.strokeStyle = COLORS.PRIMARY_BLUE;
            this.ctx.lineWidth = 3;
        }

        // Desenhar círculo principal
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();

        // Desenhar identificação (C1, C2, etc.)
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 8px Inter, sans-serif';
        this.ctx.fillText(`C${id}`, x, y);

        // Desenhar detalhe do tipo de câmera
        this.ctx.fillStyle = COLORS.NEUTRAL_GRAY;
        this.ctx.beginPath();
        
        if (type === 'bullet') {
            // Seta indicando direção da bullet
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + radius + 5, y);
            this.ctx.stroke();
        } else if (type === 'ptz') {
            // Círculo interno para PTZ
            this.ctx.arc(x, y, radius / 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    /**
     * Desenha o campo de visão (Field of View - FOV)
     */
    drawFOV(x, y, angle, range, rotation, color) {
        this.ctx.beginPath();
        
        // Calcular ângulos inicial e final
        const halfAngle = angle / 2;
        const startAngle = (rotation - halfAngle - 90) * (Math.PI / 180);
        const endAngle = (rotation + halfAngle - 90) * (Math.PI / 180);

        // Desenhar área de cobertura com transparência
        this.ctx.fillStyle = color + '40';
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, range, startAngle, endAngle);
        this.ctx.lineTo(x, y);
        this.ctx.closePath();
        this.ctx.fill();

        // Desenhar borda do alcance
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * Encontra o índice da parede clicada
     */
    findClickedWallIndex(px, py) {
        const floorWalls = this.state.walls.filter(w => w.floor === this.state.currentFloor);
        const tolerance = CANVAS_CONFIG.WALL_CLICK_TOLERANCE;

        for (let i = 0; i < floorWalls.length; i++) {
            const wall = floorWalls[i];
            
            // Algoritmo de distância ponto-segmento
            const x1 = wall.x1, y1 = wall.y1;
            const x2 = wall.x2, y2 = wall.y2;
            
            const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
            
            if (L2 === 0) {
                // Caso de ponto único
                if (Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2)) < tolerance) {
                    return this.state.walls.indexOf(wall);
                }
            }

            const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / L2;
            const projectionT = Math.max(0, Math.min(1, t));
            
            const nearestX = x1 + projectionT * (x2 - x1);
            const nearestY = y1 + projectionT * (y2 - y1);

            const distance = Math.sqrt(Math.pow(px - nearestX, 2) + Math.pow(py - nearestY, 2));
            
            if (distance < tolerance) {
                return this.state.walls.indexOf(wall);
            }
        }
        return -1;
    }
    
    /**
     * Desenha todo o mapa (função principal de renderização)
     */
    drawMap() {
        // 1. Limpar canvas
        this.ctx.clearRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);

        // 2. Desenhar fundo do ambiente
        this.ctx.fillStyle = '#F8F8F8';
        this.ctx.fillRect(0, 0, CANVAS_CONFIG.WIDTH, CANVAS_CONFIG.HEIGHT);
        
        // 3. Desenhar paredes do andar atual
        this.drawWalls();
        
        // 4. Desenhar parede temporária (durante desenho)
        this.drawTemporaryWall();

        // 5. Desenhar câmeras e FOVs
        this.drawCamerasAndFOV();
        
        // 6. Desenhar régua de escala
        this.drawScale();
        
        // 7. Atualizar contadores
        this.updateCameraCount();
    }
    
    /**
     * Desenha todas as paredes do andar atual
     */
    drawWalls() {
        const currentFloorWalls = this.state.walls.filter(w => w.floor === this.state.currentFloor);
        
        currentFloorWalls.forEach(wall => {
            this.ctx.beginPath();
            this.ctx.moveTo(wall.x1, wall.y1);
            this.ctx.lineTo(wall.x2, wall.y2);
            this.ctx.strokeStyle = wall.color;
            this.ctx.lineWidth = wall.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        });
    }
    
    /**
     * Desenha parede temporária durante o desenho
     */
    drawTemporaryWall() {
        if (this.state.isDrawing && this.state.currentWall && this.state.currentMode === 'WALL') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.state.currentWall.x1, this.state.currentWall.y1);
            this.ctx.lineTo(this.state.currentWall.x2, this.state.currentWall.y2);
            this.ctx.strokeStyle = COLORS.WALL_DRAWING;
            this.ctx.lineWidth = this.state.currentWall.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
    }
    
    /**
     * Desenha todas as câmeras e seus campos de visão
     */
    drawCamerasAndFOV() {
        const floorCameras = this.state.cameras.filter(cam => cam.floor === this.state.currentFloor);
        
        floorCameras.forEach(cam => {
            const isSelected = this.state.selectedCamera && this.state.selectedCamera.id === cam.id;
            
            // Desenhar FOV primeiro (fica atrás do ícone)
            this.drawFOV(
                cam.x,
                cam.y,
                cam.angle,
                this.metersToPixels(cam.range),
                cam.rotation,
                cam.coverageColor
            );

            // Desenhar ícone da câmera
            this.drawCameraIcon(cam.x, cam.y, cam.type, cam.id, isSelected);
        });
    }
    
    /**
     * Desenha a régua de escala
     */
    drawScale() {
        this.ctx.strokeStyle = COLORS.NEUTRAL_GRAY;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(10, CANVAS_CONFIG.HEIGHT - 10);
        this.ctx.lineTo(this.metersToPixels(10), CANVAS_CONFIG.HEIGHT - 10);
        this.ctx.stroke();
        
        this.ctx.fillStyle = COLORS.NEUTRAL_GRAY;
        this.ctx.font = '10px Inter, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('10m', this.metersToPixels(10) + 5, CANVAS_CONFIG.HEIGHT - 7);
    }
    
    /**
     * Atualiza contador de câmeras
     */
    updateCameraCount() {
        const floorCameras = this.state.cameras.filter(cam => cam.floor === this.state.currentFloor);
        const countElement = document.getElementById('currentCameraCount');
        if (countElement) {
            countElement.textContent = floorCameras.length;
        }
    }
    
    /**
     * Obtém coordenadas do canvas a partir do evento do mouse
     */
    getCanvasCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        return { x, y };
    }
    
    /**
     * Encontra câmera clicada baseada nas coordenadas
     */
    findClickedCamera(x, y) {
        const floorCameras = this.state.cameras.filter(cam => cam.floor === this.state.currentFloor);
        
        for (const cam of floorCameras) {
            const distance = Math.sqrt(Math.pow(x - cam.x, 2) + Math.pow(y - cam.y, 2));
            if (distance <= CANVAS_CONFIG.CAMERA_RADIUS) {
                return cam;
            }
        }
        return null;
    }
    
    /**
     * Limita coordenadas dentro dos limites do canvas
     */
    constrainToCanvas(x, y) {
        const margin = CANVAS_CONFIG.CAMERA_RADIUS;
        return {
            x: Math.max(margin, Math.min(CANVAS_CONFIG.WIDTH - margin, x)),
            y: Math.max(margin, Math.min(CANVAS_CONFIG.HEIGHT - margin, y))
        };
    }
}