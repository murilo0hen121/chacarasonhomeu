# Chácara Sonho Meu: site + painel do proprietário

Site público (`index.html`) e painel de administração (`admin.html`) com **Supabase** (login, banco de dados, fotos/vídeo e tempo real) e **GitHub** (hospedagem). Tudo é gratuito para o tamanho de uma chácara.

## O que o painel faz
- **Painel:** visitantes online agora, visitantes e páginas vistas por dia, páginas mais vistas, aparelho e origem.
- **Pedidos (CRM):** cada pedido de orçamento feito no site é salvo. Você muda o status (novo, contatado, fechado, perdido), anota valores e bloqueia as datas no calendário com um clique.
- **Fotos:** adicionar, excluir, trocar categoria, descrição e ordem.
- **Vídeo:** trocar o vídeo da página inicial.
- **Textos:** título e texto da página inicial, texto do vídeo, Sobre, regras, feedbacks, WhatsApp, Instagram, endereço e cores.
- **Datas:** bloquear e liberar datas reservadas.
- **Conta:** trocar a senha. Na tela de login há o **"Esqueci minha senha"**, que manda um código por e-mail.

Tudo o que você salva aparece no site na hora, sem precisar publicar de novo.

## Passo a passo para colocar no ar

### 1. Criar o projeto no Supabase
1. Crie uma conta em https://supabase.com e clique em **New project**.
2. Escolha um nome, crie uma senha do banco (guarde) e a região **South America (São Paulo)**.

### 2. Rodar a configuração
1. No menu do Supabase, abra **SQL Editor** > **New query**.
2. Abra o arquivo `supabase/setup.sql`, **troque `SEU_EMAIL_AQUI` pelo seu e-mail** (o mesmo que você vai usar no painel), cole tudo no editor e clique em **Run**.

### 3. Criar o seu login
1. Vá em **Authentication** > **Users** > **Add user** > **Create new user**.
2. Coloque o seu e-mail e a senha que você quiser e marque **Auto Confirm User**. Esta é a sua conta: não existe login provisório, a senha é escolhida por você.
3. Em **Authentication** > **Sign In / Providers** (ou *Providers* > *Email*), **desligue "Allow new users to sign up"**, para ninguém criar conta.
4. Para outra pessoa acessar o painel: crie o usuário dela aqui e adicione o e-mail dela na tabela `admins` (SQL Editor: `insert into admins values ('email@dela.com');`).

### 4. Código por e-mail (esqueci minha senha)
1. **Authentication** > **Emails** > **Templates** > **Magic Link**.
2. No texto, inclua a linha: `<p>Seu código de acesso: <b>{{ .Token }}</b></p>` e salve.
3. O e-mail padrão do Supabase tem limite de poucos envios por hora. Para uso diário, configure um SMTP próprio em **Authentication** > **Emails** > **SMTP Settings**.

### 5. Ligar o site ao Supabase
1. Em **Project Settings** > **API**, copie a **Project URL** e a chave **anon public**.
2. Abra o arquivo `config.js` e cole os dois valores entre as aspas.

A chave *anon* pode ficar visível no site: quem protege os dados são as regras do `setup.sql`. **Nunca** use a chave *service_role* aqui.

### 6. Subir para o GitHub
1. Crie uma conta em https://github.com e clique em **New repository** (nome: `chacara-sonho-meu`, público).
2. Clique em **uploading an existing file**, arraste **todo o conteúdo desta pasta** (index.html, admin.html, config.js, defaults.js, app.js, a pasta assets e a pasta supabase) e clique em **Commit changes**.

### 7. Publicar
**Opção A, GitHub Pages (a mais simples):** no repositório, **Settings** > **Pages** > em *Branch* escolha `main` e `/ (root)` > **Save**. Em cerca de 1 minuto o site fica em `https://SEU-USUARIO.github.io/chacara-sonho-meu/`.

**Opção B, Netlify ou Cloudflare Pages:** conecte o repositório do GitHub e publique sem configurar nada. Atualizam sozinhos a cada mudança no GitHub.

### 8. Domínio próprio (opcional)
Compre o domínio no Registro.br e siga a tela **Custom domain** do GitHub Pages (ou do Netlify/Cloudflare), que indica os registros DNS para criar.

### 9. Testar
1. Abra `SEU-SITE/admin.html`, entre com seu e-mail e senha.
2. Suba uma foto, edite um texto, abra o site em outra aba e veja a mudança acontecer.
3. Faça um pedido de orçamento de teste no site e veja na aba **Pedidos**.

## Bom saber
- **Projeto gratuito do Supabase pausa após 7 dias sem uso.** Se isso acontecer, entre no Supabase e clique em **Restore**. As visitas do site mantêm o projeto ativo.
- **Suas próprias visitas não contam:** o navegador onde você entrou no painel é ignorado nas estatísticas.
- **Se o Supabase ficar fora do ar,** o site continua abrindo com o conteúdo padrão.
- **Tamanho de arquivos:** fotos são reduzidas sozinhas. Vídeo: até 50 MB (ideal até 20 MB).
- **Não esqueça de trocar** `SEU_EMAIL_AQUI` no passo 2 antes de rodar. Se rodar com o e-mail errado, corrija com: `update admins set email = 'seu@email.com';`
