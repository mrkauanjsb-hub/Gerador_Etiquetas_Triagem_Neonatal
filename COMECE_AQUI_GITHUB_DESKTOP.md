# Abrir e publicar este projeto pelo GitHub Desktop

Este ZIP contém a **pasta do projeto** e um **repositório Git local vazio** (`.git`). A publicação na sua conta será feita por você usando o GitHub Desktop.

1. Extraia o ZIP para uma pasta permanente, por exemplo: `Documentos/Projetos/Gerador_Etiquetas_Triagem_Neonatal`. Não abra a pasta de dentro do ZIP sem extrair.
2. Inicie o **GitHub Desktop** e faça login na sua conta.
3. Use **File > Add local repository... > Choose...** e selecione a pasta `Gerador_Etiquetas_Triagem_Neonatal` extraída (a pasta que contém o arquivo `README.md`).
4. O GitHub Desktop deverá identificar o repositório Git inicializado e mostrar os arquivos em **Changes**. Escreva o resumo `Estrutura inicial do gerador de etiquetas Angular` e clique em **Commit to main**.
5. Clique em **Publish repository**. Confira o nome `Gerador_Etiquetas_Triagem_Neonatal` e **desmarque “Keep this code private”**. Em seguida, confirme a publicação.
6. Abra **View on GitHub**. Verifique que aparece a indicação **Public** ao lado do nome, faça um print da tela inicial e copie o endereço HTTPS do repositório para o DreamShaper.

**Importante:** este ZIP não cria sozinho o repositório remoto. Não há como garantir um link público sem você publicar na sua conta.

## Testar a aplicação no Windows (PowerShell/Terminal)

Entre na pasta do projeto, após instalar Node.js compatível com Angular 21:

```powershell
npm install
npm start
```

O primeiro comando baixa os pacotes (requer internet). O segundo abre a interface Angular no navegador. Depois de `npm install`, inclua o arquivo `package-lock.json` em um novo commit e faça **Push origin**.

Caso o GitHub Desktop não reconheça o `.git` ao descompactar, selecione **File > New repository** e use a mesma pasta como localização, sem apagar arquivos, ou abra um terminal na pasta e execute `git init -b main`. O procedimento normal é usar **Add local repository**, já que este pacote inclui `.git`.
