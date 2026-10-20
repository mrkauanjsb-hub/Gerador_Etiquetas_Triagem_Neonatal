# Plano de verificação

## Regras funcionais

- Inicial `9000000`, quantidade `40`, dígitos `7`, `2` cópias: `80` etiquetas, uma folha, primeira `9000000`, última `9000039`.
- Primeira posição `10`: as nove posições anteriores ficam vazias apenas na primeira folha.
- Quantidade `4000`, `2` cópias: `8000` etiquetas, `100` folhas quando começa na posição 1. **100 folhas é uma carga de teste, não um teto do produto.**
- Data e número da folha devem ser apresentados sem ocupar etiquetas; ajustes X/Y devem alterar as posições em milímetros.
- Identificadores e nomes de pacientes não devem ser armazenados no IndexedDB.

## Desempenho e acessibilidade

- Carregamento inicial da interface: meta mediana <= 5s em rede móvel simulada (cinco execuções após aquecimento).
- Pré-visualização de 80 etiquetas: meta mediana <= 2s em cinco repetições.
- Teste separado de 100 folhas: medir tempo, memória e comportamento do navegador; não supor aprovação antecipadamente.
- Navegação por teclado, foco visível, mensagens por texto, ampliação 200%, teste de impressão de teste com números fictícios.

## Não comprovado ainda

A compatibilidade de navegadores, a impressão física no setor, o uso offline e o desempenho final dependem de testes futuros. Não declarar esses testes como concluídos antes de executar e registrar evidências.
