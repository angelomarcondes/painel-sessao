# Painel Sessão ⏳

Um aplicativo web moderno e interativo para gerenciamento de tempo e oradores em sessões plenárias de pequenas câmaras municipais.

---

## 🌟 Inspiração e Reconhecimentos

* **A Inspiração:** Este projeto foi fortemente inspirado no excelente trabalho disponibilizado publicamente no github pela [Câmara Municipal de Pato Branco](https://github.com/cmpbti/cronometro), que serviu como base conceitual para nosso painel e cronômetro.
* **O Método ("Vibe Coding"):** Trata-se de um projeto criado e mantido com **"vibe coding"**, utilizando as capacidades do agente **Antigravity do Google** ([GitHub do Google](https://github.com/google) / Google DeepMind). Uma prova do poder da inteligência artificial aplicada ao desenvolvimento de software conversacional.
* **O Agradecimento:** Devo este projeto ao meu irmão e desenvolvedor **Evanir Júnior** ([GitHub: @evanir](https://github.com/evanir)), que abriu meus olhos e me apresentou às vastas possibilidades, conceitos e o fluxo de trabalho de um desenvolvimento moderno com IA.

---

## 🐳 Por que utilizamos o Docker?

Este ecossistema foi projetado dividindo a aplicação em dois serviços: **Frontend** e **Backend**. A necessidade do uso do Docker para rodar o projeto se dá pelos seguintes motivos:

1. **Facilidade e Agilidade:** Com o Docker, com apenas 1 (um) único comando preparamos um ambiente inteiro que instala as dependências, inicia o servidor e o cliente isoladamente.
2. **Redução de Erros:** Resolvendo o clássico problema *"na minha máquina funciona"*. O ambiente de execução do sistema é replicável para qualquer máquina, não importando o sistema operacional em uso.
3. **Limpeza do Sistema:** Não há necessidade de você ficar instalando versões específicas do NodeJS, configurando variáveis de ambiente ou dependências globais que poderiam conflitar com outros aplicativos no seu computador.

**Requisito Essencial!** Você precisará ter o **[Docker e o Docker Compose](https://docs.docker.com/get-docker/)** instalados na sua máquina.

---

## 🚀 Como Instalar e Rodar o Projeto

Siga os passos abaixo, garantindo que você já tenha configurado o seu ambiente com o **Docker**:

1. Faça o clone (cópia) deste repositório para o seu ambiente local:
   ```bash
   git clone <LINK_DO_SEU_REPOSITORIO_GIT>
   cd painel-sessao
   ```

2. Na mesma pasta onde se encontra o arquivo `docker-compose.yml`, suba os serviços no modo detached (em segundo plano):
   ```bash
   docker-compose up -d --build
   ```

3. Tudo pronto! Acesse a aplicação abrindo o seu navegador em:
   - 💻 Acesso do painel e controle: **`http://localhost`** (porta 80)
   - 🔌 Ponto de acesso à API (Backend): **`http://localhost:3000`**

Para suspender ou desligar os serviços da aplicação, execute:
```bash
docker-compose down
```

---

## 💡 Sugestão para evolução deste README (A fazer)

Aqui estão algumas sugestões úteis do que podemos ou devemos documentar a seguir para deixar o repositório ainda melhor:

* [ ] **Listagem de Funcionalidades (Features):** Enumerar com *bullet points* características como o sistema de acréscimo de tempo, controles de Aparteantes, configuração de alertas sonoros.
* [ ] **Adicionar Telas (Screenshots):** Incorporar um gif ou png(s) mostrando as telas finais de controle e a tela que é exibida no telão.
* [ ] **Como Configurar e Personalizar:** Se houve necessidade de mudar o background, as cores ou o brasão/texto no painel, indicar onde ficam os arquivos de configuração ou assets visuais.
* [ ] **Licença:** Definir qual os termos de uso deste seu projeto adicionando o arquivo "LICENSE" (MIT, GPLv3, etc.) ao repositório.
* [ ] **Tecnologias Utilizadas:** Mostrar as Stack que usamos, ex: React + Vite + Tailwind, NodeJS + Express.
