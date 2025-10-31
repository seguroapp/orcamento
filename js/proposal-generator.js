/**
 * CFTV Orçamento Visual - Gerador de Propostas
 * Módulo responsável pela geração de propostas profissionais
 * Autor: Sistema CFTV
 * Data: 2025
 */

import { PROPOSAL_CONFIG } from './config.js';

/**
 * Classe responsável pela geração de propostas
 */
export class ProposalGenerator {
    constructor(appState, canvasManager) {
        this.state = appState;
        this.canvasManager = canvasManager;
        this.elements = null;
    }
    
    /**
     * Define referências aos elementos do DOM
     */
    setElements(elements) {
        this.elements = elements;
    }
    
    /**
     * Gera a proposta completa
     */
    generateProposal() {
        const clientName = this.elements?.clientNameInput?.value || 'Cliente Não Especificado';
        const projectNotes = this.elements?.projectNotesTextarea?.value || 'Nenhuma observação técnica fornecida.';
        
        // Gerar mapas por andar
        const floorMapsHtml = this.generateFloorMaps();
        
        // Calcular totais
        const totals = this.calculateTotals();
        
        // Gerar conteúdo HTML
        const htmlContent = this.generateProposalHTML(clientName, projectNotes, floorMapsHtml, totals);
        
        // Exibir proposta
        this.displayProposal(htmlContent);
    }
    
    /**
     * Gera mapas de todos os andares
     */
    generateFloorMaps() {
        const floorMapsHtml = [];
        const floorOptions = Array.from(this.elements.floorSelector.options);
        const originalFloor = this.state.currentFloor;
        
        floorOptions.forEach(option => {
            const floorIndex = parseInt(option.value);
            const floorName = option.text;
            
            // Verificar se o andar tem conteúdo
            const hasContent = this.state.cameras.some(c => c.floor === floorIndex) || 
                              this.state.walls.some(w => w.floor === floorIndex);
            
            if (hasContent) {
                // Mudar para o andar e capturar imagem
                this.state.currentFloor = floorIndex;
                this.canvasManager.drawMap();
                const mapImageBase64 = this.canvasManager.canvas.toDataURL('image/png');
                
                floorMapsHtml.push(this.createFloorMapHTML(floorName, mapImageBase64, floorIndex));
            }
        });
        
        // Restaurar andar original
        this.state.currentFloor = originalFloor;
        this.canvasManager.drawMap();
        
        return floorMapsHtml;
    }
    
    /**
     * Cria HTML para mapa de um andar
     */
    createFloorMapHTML(floorName, mapImage, floorIndex) {
        const floorCameras = this.state.cameras.filter(c => c.floor === floorIndex);
        const cameraList = floorCameras.map(c => `C${c.id}`).join(', ') || 'Nenhuma';
        
        return `
            <h3 class="text-lg font-bold text-gray-700 mt-4 mb-2">${floorName}</h3>
            <div class="border border-gray-300 p-2 rounded-lg bg-gray-50 text-center mb-4">
                <img src="${mapImage}" alt="Mapa de Cobertura - ${floorName}" class="w-full h-auto rounded-md">
                <p class="text-xs text-gray-500 mt-1">
                    Câmeras neste andar: ${cameraList}
                </p>
            </div>
        `;
    }
    
    /**
     * Calcula totais do orçamento
     */
    calculateTotals() {
        let totalEquipamento = 0;
        let totalServico = 0;
        let totalAcessorio = 0;
        
        this.state.budgetItems.forEach(item => {
            const subtotal = parseFloat(item.qty) * parseFloat(item.price);
            if (!isNaN(subtotal)) {
                switch (item.category) {
                    case 'equipamento':
                        totalEquipamento += subtotal;
                        break;
                    case 'servico':
                        totalServico += subtotal;
                        break;
                    case 'acessorio':
                        totalAcessorio += subtotal;
                        break;
                }
            }
        });
        
        return {
            equipment: totalEquipamento,
            service: totalServico,
            accessory: totalAcessorio,
            total: totalEquipamento + totalServico + totalAcessorio
        };
    }
    
    /**
     * Renderiza grupo de itens do orçamento
     */
    renderBudgetGroup(category, title) {
        const items = this.state.budgetItems.filter(item => item.category === category);
        if (items.length === 0) return '';
        
        let groupHtml = `
            <h3 class="text-lg font-bold text-indigo-700 mt-4 mb-2">${title}</h3>
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr class="bg-indigo-50 text-left text-gray-600 border-b">
                        <th class="p-2 w-1/3">Item</th>
                        <th class="p-2 w-1/12 text-center">Foto</th>
                        <th class="p-2 w-1/12 text-center">Qtd</th>
                        <th class="p-2 w-1/6 text-right">Unitário</th>
                        <th class="p-2 w-1/6 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        items.forEach(item => {
            const subtotal = parseFloat(item.qty) * parseFloat(item.price);
            const imageCell = this.createImageCell(item.imageUrl);
            
            groupHtml += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-2">${item.name}</td>
                    ${imageCell}
                    <td class="p-2 text-center">${item.qty}</td>
                    <td class="p-2 text-right">${parseFloat(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td class="p-2 text-right font-medium">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
            `;
        });
        
        groupHtml += `</tbody></table>`;
        return groupHtml;
    }
    
    /**
     * Cria célula de imagem para tabela
     */
    createImageCell(imageUrl) {
        if (imageUrl) {
            return `<td class="p-2 text-center">
                <img src="${imageUrl}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/50x30/CCCCCC/000000?text=Sem+Foto';" 
                     class="w-12 h-8 object-cover mx-auto rounded-sm" 
                     alt="Foto do Equipamento">
            </td>`;
        }
        return `<td class="p-2 text-center text-gray-400">N/A</td>`;
    }
    
    /**
     * Gera HTML completo da proposta
     */
    generateProposalHTML(clientName, projectNotes, floorMapsHtml, totals) {
        const proposalNumber = `CFTV-${Date.now().toString().slice(-6)}`;
        const currentDate = new Date().toLocaleDateString('pt-BR');
        const cameraTypes = Array.from(new Set(this.state.cameras.map(c => c.type.toUpperCase()))).join(', ');
        const floorCount = Array.from(new Set(this.state.cameras.map(c => c.floor))).length;
        
        return `
            <div class="proposta-section text-center mb-6 border-b pb-4">
                <h1 class="text-3xl font-bold text-indigo-800">PROPOSTA TÉCNICA E COMERCIAL</h1>
                <p class="text-xl text-gray-700 mt-2">Sistema de Circuito Fechado de TV (CFTV)</p>
                <p class="text-lg text-indigo-600 mt-1 font-semibold">${clientName}</p>
                <div class="mt-4 text-sm text-gray-600">
                    <p><strong>Data de Elaboração:</strong> ${currentDate}</p>
                    <p><strong>Proposta Nº:</strong> ${proposalNumber}</p>
                    <p><strong>Validade:</strong> ${PROPOSAL_CONFIG.VALIDITY_DAYS} dias corridos</p>
                </div>
                <p class="text-xs text-red-500 mt-4">
                    📄 Para Exportar em PDF: Use o botão "Imprimir / Salvar PDF" e selecione "Salvar como PDF" nas opções de destino da impressora.
                </p>
            </div>

            <div class="proposta-section mb-6">
                <h2 class="text-xl font-bold text-indigo-700 mb-3 border-b-2 border-indigo-100 pb-1">
                    1. ANÁLISE TÉCNICA E OBSERVAÇÕES
                </h2>
                <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                    <p class="text-gray-700 whitespace-pre-wrap font-medium">${projectNotes}</p>
                </div>
                <div class="mt-4 text-sm text-gray-600">
                    <p><strong>Resumo do Projeto:</strong></p>
                    <ul class="list-disc ml-6 mt-2 space-y-1">
                        <li>Total de Câmeras Projetadas: <strong>${this.state.cameras.length} unidades</strong></li>
                        <li>Andares Contemplados: <strong>${floorCount} andar(es)</strong></li>
                        <li>Tipos de Câmeras: ${cameraTypes}</li>
                    </ul>
                </div>
            </div>

            <div class="proposta-section mb-6">
                <h2 class="text-xl font-bold text-indigo-700 mb-3 border-b-2 border-indigo-100 pb-1">
                    2. PROJETO VISUAL DE COBERTURA
                </h2>
                <p class="text-gray-700 text-sm mb-4">
                    O projeto apresenta a simulação 2D do posicionamento estratégico das ${this.state.cameras.length} câmeras, 
                    considerando obstáculos físicos (paredes) e o campo de visão otimizado para cada ambiente.
                </p>
                ${floorMapsHtml.join('')}
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <strong>🔍 Legenda:</strong> As áreas coloridas representam o campo de visão de cada câmera. 
                        As identificações (C1, C2, etc.) correspondem aos equipamentos listados no orçamento.
                    </p>
                </div>
            </div>

            <div class="proposta-section mb-6">
                <h2 class="text-xl font-bold text-indigo-700 mb-3 border-b-2 border-indigo-100 pb-1">
                    3. ORÇAMENTO DETALHADO
                </h2>

                ${this.renderBudgetGroup('equipamento', '3.1. EQUIPAMENTOS E DISPOSITIVOS')}
                ${this.renderBudgetGroup('acessorio', '3.2. MATERIAIS E ACESSÓRIOS')}
                ${this.renderBudgetGroup('servico', '3.3. MÃO DE OBRA E CONFIGURAÇÃO')}

                <div class="total-investimento mt-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg shadow-inner">
                    <div class="mb-3">
                        <div class="flex justify-between text-lg font-semibold text-gray-700 mb-2">
                            <span>💻 Equipamentos + Materiais:</span>
                            <span>${(totals.equipment + totals.accessory).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div class="flex justify-between text-lg font-semibold text-gray-700">
                            <span>🔧 Mão de Obra:</span>
                            <span>${totals.service.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                    <div class="border-t-2 border-indigo-300 pt-3">
                        <div class="flex justify-between text-2xl font-extrabold text-indigo-800">
                            <span>💰 VALOR TOTAL DO INVESTIMENTO:</span>
                            <span>${totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-gray-600">
                        <p><strong>Condições de Pagamento:</strong> A definir com o cliente</p>
                        <p><strong>Prazo de Execução:</strong> 5 a 10 dias úteis após aprovação</p>
                    </div>
                </div>
            </div>

            <div class="proposta-section proposta-footer text-center pt-6 border-t-2 border-indigo-200">
                <h3 class="text-lg font-bold text-indigo-700 mb-3">🤝 AGUARDAMOS SUA APROVAÇÃO</h3>
                <p class="text-base font-medium text-gray-700 mb-2">
                    Estamos prontos para iniciar seu projeto de segurança!
                </p>
                <div class="mt-4 text-sm text-gray-600 space-y-1">
                    <p><strong>📞 Contato:</strong> ${PROPOSAL_CONFIG.COMPANY_INFO.phone} | ${PROPOSAL_CONFIG.COMPANY_INFO.email}</p>
                    <p><strong>⏰ Validade desta Proposta:</strong> ${PROPOSAL_CONFIG.VALIDITY_DAYS} dias corridos a partir da data de emissão</p>
                    <p><strong>🏢 Empresa:</strong> ${PROPOSAL_CONFIG.COMPANY_INFO.name}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Exibe a proposta no modal
     */
    displayProposal(htmlContent) {
        if (this.elements?.proposalContentDiv) {
            this.elements.proposalContentDiv.innerHTML = htmlContent;
        }
        
        if (this.elements?.proposalModal) {
            this.elements.proposalModal.classList.remove('hidden');
        }
    }
    
    /**
     * Fecha o modal da proposta
     */
    closeProposal() {
        if (this.elements?.proposalModal) {
            this.elements.proposalModal.classList.add('hidden');
        }
    }
}