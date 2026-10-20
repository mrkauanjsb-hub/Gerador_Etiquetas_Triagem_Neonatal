# Guia de impressão e calibração — Pimaco 6187

Este documento descreve o procedimento **planejado para validação** do gerador de etiquetas. Não substitui as instruções oficiais do equipamento nem significa que a aplicação já foi homologada no setor.

## Antes da impressão

1. Abra o gerador no navegador compatível e confira a **numeração inicial**, a **quantidade de identificadores**, o número de **dígitos** e as **cópias por número**. O padrão de demonstração é de 7 dígitos e 2 cópias; esses valores podem ser alterados.
2. Escolha a **primeira posição** da folha (1 a 80) se for aproveitar uma folha parcialmente utilizada. Essa posição afeta apenas a primeira folha da operação.
3. Confira o **número inicial da folha**. Esse número impresso serve à organização das páginas; não faz parte do identificador no código de barras.
4. Ajuste os deslocamentos **horizontal (X)** e **vertical (Y)** em milímetros. Um valor negativo move à esquerda (X) ou para cima (Y); um positivo move à direita ou para baixo.
5. Gere e confira a pré-visualização: cada identificador deve aparecer a quantidade solicitada de vezes, com o texto correspondente ao Code 128.

## Configuração do diálogo de impressão

- Formato: **Papel Carta (Letter)**, 215,9 × 279,4 mm.
- Escala: **100% ou tamanho real**, sem ajustar à página.
- Desative cabeçalhos e rodapés do navegador.
- Confira as margens do navegador e a orientação retrato; use as configurações compatíveis com o layout do aplicativo.
- Verifique se o driver da impressora não aplica redimensionamento adicional.

## Calibração segura

1. Utilize **apenas identificadores fictícios** e, inicialmente, papel comum para avaliar a posição antes de consumir folhas adesivas.
2. Compare os elementos com as posições esperadas na folha Pimaco 6187, que tem **4 colunas e 20 linhas**.
3. Se houver deslocamento uniforme, altere X ou Y em pequenos incrementos; gere uma nova visualização e repita a impressão de teste.
4. Se a diferença variar entre as linhas ou colunas, investigue a escala, o formato de papel e o driver. O deslocamento X/Y é uniforme e **não corrige distorções de escala**.
5. Verifique a legibilidade e a leitura correta do Code 128 no **papel**, além da visualização na tela. Um scanner pode apresentar dificuldades ao ler códigos pequenos diretamente do monitor.

## Cargas maiores

O setor pode precisar preparar cerca de **100 folhas por operação** (8.000 etiquetas, quando cada folha está completa), mas isso é um **cenário de teste**, não um limite do software. Para grandes lotes, confira cuidadosamente o número de páginas e teste o desempenho do navegador e do equipamento.

## Segurança e privacidade

Não utilize nomes de pacientes, dados clínicos, identificadores reais de amostras ou imagens que permitam identificar pessoas nos registros, capturas e repositório público. O aplicativo não substitui processos institucionais de conferência das amostras.
