# Arquitetura — gerador de etiquetas

## Aplicação web Angular, monolítica e modular

1. **Apresentação (`app.component`)**: formulário, etapas de pré-visualização e orientações de impressão. Reactive Forms valida as entradas; foco, rótulos, erros textuais e navegação por teclado são prioritários.
2. **Regras de negócio (`core/label-engine.ts`)**: funções puras para validar parâmetros, calcular número de páginas e produzir valores por posição. Essa camada não conhece HTML, Angular ou banco de dados.
3. **Dados (`data/calibration-store.service.ts`)**: acesso opcional ao IndexedDB para `PerfisCalibracao` e `PreferenciasAplicacao`. O fluxo essencial continua disponível mesmo sem persistência.
4. **Código de barras (`core/barcode.service.ts`)**: encapsula a biblioteca JsBarcode e gera representações SVG exclusivamente a partir dos identificadores validados.

## Limites

- Identificadores, etiquetas e informações clínicas **não são persistidos**.
- A visualização monta apenas a folha selecionada; a preparação para impressão ocorre sob demanda.
- A saída de impressão precisa de **papel Carta, escala 100%, cabeçalhos e rodapés desativados**. O navegador não controla drivers ou a impressora física.
- Não há login, API, backend ou servidor de dados. Ao publicar no GitHub Pages o endereço será público.

## Entidades locais propostas

- **PerfisCalibracao**: `id` (inteiro autoincremento), `nome` (string única), `ajusteX` (number), `ajusteY` (number), `atualizadoEm` (ISO string).
- **PreferenciasAplicacao**: `id` (texto fixo `principal`), `perfilAtivoId` (inteiro ou null), `atualizadoEm` (ISO string).

O IndexedDB não fornece integridade de chaves estrangeiras: a aplicação valida a referência de perfil ativo. O gerenciamento de perfis é recurso *desejável*, não necessário à primeira demonstração.

## Histórico acadêmico

O software final será submetido a validação presencial com dados fictícios. Esta pasta apresenta uma versão de desenvolvimento, sem alegação de validação clínica ou autorização institucional.
