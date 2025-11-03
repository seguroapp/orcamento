/**
 * CFTV Orçamento Visual - Aplicação Principal TypeScript
 * Ponto de entrada da aplicação moderna com tipagem estática
 * Autor: Sistema CFTV
 * Data: 2025
 */

import './style.css';
import { CFTVApp } from './app/CFTVApp';

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 CFTV Visual Budget - TypeScript Edition');
  console.log('✅ DOM carregado, inicializando aplicação...');
  
  try {
    // Inicializa a aplicação principal
    const app = new CFTVApp();
    app.initialize();
    
    console.log('✅ Aplicação CFTV inicializada com sucesso!');
    
    // Exposição global para debug (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      (window as any).cftvApp = app;
      console.log('🔧 Modo desenvolvimento: app disponível em window.cftvApp');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação CFTV:', error);
    
    // Mostra erro amigável para o usuário
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div class="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
        <h3 class="font-bold">Erro na Aplicação</h3>
        <p class="text-sm">Falha ao carregar o sistema CFTV. Recarregue a página.</p>
        <button onclick="location.reload()" class="mt-2 px-3 py-1 bg-red-600 rounded text-xs">
          Recarregar
        </button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
});

// Tratamento de erros globais
window.addEventListener('error', (event) => {
  console.error('❌ Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada não tratada:', event.reason);
});