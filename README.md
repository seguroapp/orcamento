# 📹 CFTV Orçamento Visual

Sistema profissional para geração de orçamentos visuais de sistemas de CFTV (Circuito Fechado de TV) com mapeamento 2D e propostas técnicas detalhadas.

## 🌟 Características

- **Mapeamento Visual 2D**: Posicionamento intuitivo de câmeras com campo de visão simulado
- **Múltiplos Andares**: Suporte para projetos em vários pavimentos
- **Orçamento Dinâmico**: Sistema completo de gerenciamento de itens e custos
- **Propostas Profissionais**: Geração automática de documentos PDF prontos para impressão
- **Interface Moderna**: Design responsivo com Tailwind CSS
- **Código Modular**: Arquitetura bem estruturada seguindo melhores práticas

## 🏗️ Estrutura do Projeto

```
c:\Cameras/
├── index.html              # Arquivo principal da aplicação
├── index-old.html          # Backup do arquivo monolítico original
│
├── css/
│   └── style.css           # Estilos personalizados e impressão
│
├── js/
│   ├── app.js              # Arquivo principal e inicialização
│   ├── config.js           # Configurações e constantes
│   ├── canvas-manager.js   # Gerenciamento do canvas e desenhos
│   ├── budget-manager.js   # Gerenciamento de orçamento
│   ├── proposal-generator.js # Geração de propostas
│   ├── ui-controller.js    # Controle da interface do usuário
│   └── event-manager.js    # Gerenciamento de eventos
│
└── assets/                 # (Pasta para futuras imagens/recursos)
```

## 🚀 Como Usar

### 1. Execução Local
```bash
# Navegue até a pasta do projeto
cd c:\Cameras

# Inicie um servidor HTTP local (Python)
python -m http.server 8080

# Ou use qualquer servidor web de sua preferência
# Acesse: http://localhost:8080
```

### 2. Funcionalidades Principais

#### 📍 **Posicionamento de Câmeras**
- Selecione o modo "Câmera (Posicionar)"
- Clique no mapa para adicionar câmeras
- Arraste para reposicionar
- Configure tipo, ângulo, alcance e orientação

#### 🏗️ **Desenho de Paredes**
- Selecione o modo "Parede (Desenhar/Remover)"
- Clique e arraste para desenhar paredes
- Clique em uma parede existente para removê-la

#### 💰 **Gerenciamento de Orçamento**
- Adicione itens manualmente com descrição, quantidade e preço
- Edite itens existentes clicando no ícone ✏️
- Câmeras são adicionadas automaticamente ao orçamento
- Categorize entre Equipamentos, Serviços e Acessórios

#### 📄 **Geração de Propostas**
- Clique em "Gerar Proposta Final"
- Visualize o documento profissional
- Use "Imprimir / Salvar PDF" para exportar

## 🛠️ Arquitetura Técnica

### Módulos Principais

#### `app.js` - Coordenador Principal
- Inicialização da aplicação
- Coordenação entre módulos
- Gerenciamento de estado global

#### `canvas-manager.js` - Renderização Visual
- Desenho do mapa 2D
- Renderização de câmeras e campos de visão
- Gerenciamento de paredes e obstáculos
- Cálculos de coordenadas e escalas

#### `budget-manager.js` - Controle Financeiro
- CRUD de itens do orçamento
- Cálculos de totais por categoria
- Sincronização com câmeras posicionadas
- Validação de dados financeiros

#### `proposal-generator.js` - Documentação
- Geração de propostas profissionais
- Captura de imagens do canvas
- Formatação de relatórios técnicos
- Exportação para impressão/PDF

#### `ui-controller.js` - Interface do Usuário
- Controle de estados visuais
- Atualização de formulários
- Feedback visual para o usuário
- Validação de inputs

#### `event-manager.js` - Interações
- Event listeners do canvas (mouse/touch)
- Eventos de formulários
- Interações de teclado
- Coordenação entre componentes

### Configurações (`config.js`)

Todas as constantes e configurações centralizadas:
- Dimensões do canvas
- Tipos de câmeras e configurações padrão
- Cores e temas visuais
- Informações da empresa
- Valores padrão do orçamento

## 🎨 Estilização

### CSS Modular (`style.css`)
- **Estilos Gerais**: Tipografia, layout básico
- **Canvas/Mapa**: Interações visuais do mapa
- **Impressão**: Otimização completa para A4
- **Responsividade**: Adaptação para diferentes telas

### Tailwind CSS
- Framework utilitário para rapidez no desenvolvimento
- Classes responsivas pré-configuradas
- Componentização visual consistente

## 📱 Compatibilidade

- **Navegadores**: Chrome, Firefox, Safari, Edge (versões modernas)
- **Dispositivos**: Desktop, tablet, mobile
- **Impressão**: Otimizado para A4, suporte a PDF
- **ES6 Modules**: Requer servidor HTTP (não funciona com file://)

## 🔧 Desenvolvimento

### Adicionando Novas Funcionalidades

1. **Nova Configuração**: Adicione em `config.js`
2. **Lógica de Negócio**: Implemente no módulo apropriado
3. **Interface**: Atualize `ui-controller.js`
4. **Eventos**: Registre em `event-manager.js`
5. **Estilos**: Adicione em `style.css`

### Estrutura de Classes
```javascript
// Exemplo de estrutura modular
class ModuleName {
    constructor(appState, dependencies) {
        this.state = appState;
        this.dependencies = dependencies;
    }
    
    methodName() {
        // Implementação
    }
}
```

## 📋 Funcionalidades Futuras

- [ ] Salvamento/carregamento de projetos
- [ ] Biblioteca de câmeras predefinidas
- [ ] Cálculo automático de cabeamento
- [ ] Integração com fornecedores
- [ ] Múltiplos formatos de exportação
- [ ] Colaboração em tempo real
- [ ] API para integrações externas

## 🐛 Solução de Problemas

### Problemas Comuns

**Canvas não carrega:**
- Verifique se está usando servidor HTTP
- Confirme se todos os módulos JS estão acessíveis

**Impressão desformatada:**
- Use navegadores atualizados
- Prefira "Salvar como PDF" em vez de impressão direta

**Erros de módulos:**
- Verifique estrutura de pastas
- Confirme que todos os arquivos existem

## 👥 Contribuição

1. Mantenha a estrutura modular
2. Documente novas funções
3. Teste em múltiplos navegadores
4. Siga as convenções de nomenclatura existentes

## 📄 Licença

Projeto desenvolvido para uso interno. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para profissionais de segurança eletrônica**