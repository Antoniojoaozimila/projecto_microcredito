# Deploy na Hostinger (Ubuntu 24 + Docker Manager)

O site, a API e a versão web do telemóvel ficam no mesmo servidor
`148.230.115.150`. O telemóvel usa **a mesma API** que o site.

| O quê | Endereço |
| --- | --- |
| Site | https://148-230-115-150.sslip.io |
| Telemóvel (web) | https://148-230-115-150.sslip.io/m/ |
| API | https://148-230-115-150.sslip.io/api |

`sslip.io` é um nome grátis que já aponta para o IP da VPS e permite HTTPS
(Let's Encrypt), sem comprar domínio. Quando tiver domínio próprio, mude só
`DOMINIO` e `EXPO_PUBLIC_API_URL`.

---

## 0. O que precisa ter à mão

1. Painel Hostinger da VPS (Ubuntu 24 + Docker já instalados).
2. Conta GitHub com este repositório (`Antoniojoaozimila/projecto_microcredito`).
3. Workbench, para exportar a base local.
4. Duas senhas novas, **fortes e sem caracteres estranhos** (`@ # $ !` evitam
   problemas no Docker): senha do MySQL e um segredo JWT.

---

## 1. Exportar a base local (Workbench)

No computador onde o MySQL está a correr:

1. Abra o **MySQL Workbench** e ligue-se ao servidor local.
2. Menu **Server → Data Export**.
3. Marque a base `microcredito` (ou o nome que usa localmente).
4. Escolha **Export to Self-Contained File**.
5. Marque **Include Create Schema** se aparecer.
6. Clique **Start Export**.
7. Guarde o ficheiro, por exemplo `microcredito.sql`, num sítio fácil de
   encontrar (Ambiente de trabalho ou Documentos).

Vai enviá-lo para a VPS depois do primeiro deploy.

---

## 2. Enviar o código para o GitHub

Na pasta do projecto, no computador:

```powershell
git add docker-compose.yml docker-compose.yaml Caddyfile .env.example DEPLOY.md deploy
git commit -m "Preparar deploy Docker Manager na Hostinger"
git push -u origin main
git branch master
git push -u origin master
```

Confirme no GitHub que `docker-compose.yaml` está na raiz, nas branches `main` e `master`.

A Hostinger **não aceita** o link com `.git` no fim, nem o link `blob` da página do ficheiro.

### Se o repositório for privado

O Docker Manager precisa de uma chave de deploy:

1. No painel Hostinger: **VPS → Manage → Terminal** (ou SSH).
2. Corra:

```bash
ssh-keygen -t ed25519 -C "docker-manager" -N "" -f ~/.ssh/github-microcredito
cat ~/.ssh/github-microcredito.pub
```

3. Copie a linha que começa por `ssh-ed25519`.
4. No GitHub: repositório → **Settings → Deploy keys → Add deploy key**.
5. Título: `Hostinger VPS`. Cole a chave. Guarde.

---

## 3. Primeiro deploy no Docker Manager

1. Painel Hostinger → **VPS** → **Manage** no servidor `148.230.115.150`.
2. Menu esquerdo → **Docker Manager**.
3. **Compose**.
4. **Compose from URL**.
5. Cole **exactamente** este link (ficheiro em bruto na branch `main`, como no projecto que já funcionou):

```
https://raw.githubusercontent.com/Antoniojoaozimila/projecto_microcredito/refs/heads/main/docker-compose.yml
```

O exemplo cinzento `https://github.com/username/repo/docker-compose.yml` **não existe no GitHub** (dá 404).

6. Nome do projecto: `microcredito` (só letras, números, hífen ou underscore).
7. Em **Environment variables** cole (troque as senhas):

```
DB_NOME=microcredito
DB_SENHA=troque-por-uma-senha-forte
JWT_SEGREDO=troque-por-um-segredo-longo-e-aleatorio
JWT_EXPIRA=12h
CORS_ORIGENS=http://148.230.115.150
VITE_API_URL=http://148.230.115.150:3000
EXPO_PUBLIC_API_URL=http://148.230.115.150:3000
ADMIN_SENHA_INICIAL=troque-esta-senha
```

8. **Deploy**. A primeira vez demora vários minutos: a VPS vai **compilar** o
   frontend, o mobile e o backend.

Se falhar por memória, no Terminal da VPS crie um swap (só uma vez):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

e volte a carregar em Deploy.

---

## 4. Confirmar que a API está viva

No browser:

```
https://148-230-115-150.sslip.io/api/saude
```

Deve aparecer: `{"ok":true,"servico":"microcredito"}`.

O site abre em https://148-230-115-150.sslip.io  
A versão mobile em https://148-230-115-150.sslip.io/m/

Entrada inicial (se a base ainda estiver vazia): utilizador `Admin` e a senha
que pôs em `ADMIN_SENHA_INICIAL` (ou `Senha@123` se deixou vazio). **Mude a
senha logo a seguir.**

---

## 5. Enviar a base local para a VPS

### 5.1 Copiar o `.sql` para o servidor

No **seu computador** (PowerShell), na pasta onde está o dump:

```powershell
scp "C:\Users\IMP\Desktop\microcredito.sql" root@148.230.115.150:/root/microcredito.sql
```

(A Hostinger mostra o utilizador SSH no painel; pode ser `root` ou outro.)

### 5.2 Importar para o MySQL do Docker

No Terminal da VPS (Docker Manager ou SSH):

```bash
cd /caminho/do/projecto
# costuma ser algo como /root/microcredito ou a pasta que o Docker Manager criou
docker compose ps
```

Confirme que o serviço se chama `mysql`. Depois:

```bash
DB_SENHA='a-mesma-senha-do-docker-manager' docker compose exec -T mysql mysql -uroot -p"$DB_SENHA" microcredito < /root/microcredito.sql
```

Se o Docker Manager não tiver o `docker-compose.yml` nessa pasta, use o nome
do contentor que aparece em **Projects**:

```bash
docker exec -i $(docker ps -qf name=mysql) mysql -uroot -p'a-mesma-senha' microcredito < /root/microcredito.sql
```

Reinicie o contentor **backend** no Docker Manager para ele reler os dados.

---

## 6. Actualizar o projecto no futuro

1. `git push` para a mesma branch.
2. No Docker Manager, abra o projecto `microcredito` e use **Redeploy** /
   **Rebuild** (ou volte a Compose from URL com o mesmo link).

O deploy no Docker Manager **não precisa** de GitHub Actions. O token GitHub
actual não tem permissão `workflow`, por isso o ficheiro de Actions ficou de
fora. Para actualizar: `git push` e depois Redeploy no Docker Manager.

---

## 7. Firewall

No painel da VPS, **deixe abertas só**:

- 22 (SSH)
- 80 (HTTP, para o certificado HTTPS)
- 443 (HTTPS)

**Não abra 3306.** O MySQL fica só na rede interna do Docker. Para usar o
Workbench à distância:

```powershell
ssh -L 3307:127.0.0.1:3306 root@148.230.115.150
```

e no Workbench ligue-se a `127.0.0.1` porta `3307`, utilizador `root`, senha
da `DB_SENHA`. (Isto só funciona se no servidor o 3306 estiver acessível via
SSH tunnel a partir de um `docker port` — por omissão o 3306 **não** está
publicado, o que é o comportamento correcto.)

---

## 8. Quando tiver um domínio próprio

1. No DNS do domínio, crie um registo **A** para `148.230.115.150`.
2. No Docker Manager, mude:

```
DOMINIO=oseudominio.com
CORS_ORIGENS=https://oseudominio.com,https://www.oseudominio.com
EXPO_PUBLIC_API_URL=https://oseudominio.com
CADDY_EMAIL=o-seu-email@oseudominio.com
```

3. Rebuild do projecto (o Caddy pede o certificado Let's Encrypt sozinho).
4. Se usar a app nativa (APK), volte a compilá-la com o novo
   `EXPO_PUBLIC_API_URL`.
