# Samsung Store MX — Guía de Deploy

## Deploy Automático (1 comando)

```bash
# 1. Navega al directorio del proyecto
cd /mnt/agents/output/app

# 2. Ejecuta el script de deploy
./deploy.sh
```

Este script te guiará paso a paso para:
- Instalar Vercel CLI y GitHub CLI
- Hacer login en ambos servicios
- Crear el repositorio en GitHub
- Subir el código
- Deployar en Vercel con CI/CD activado

---

## Deploy Manual en Vercel (3 pasos)

### Paso 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Paso 2: Login en Vercel
```bash
vercel login
```

### Paso 3: Deploy
```bash
cd /mnt/agents/output/app
vercel --prod
```

---

## Deploy Manual en GitHub + Vercel CI/CD

### 1. Crear repositorio en GitHub
```bash
# Instalar GitHub CLI
npm install -g gh

# Login
gh auth login

# Crear repo y subir código
gh repo create samsung-store-mx --public --source=. --push
```

### 2. Conectar con Vercel
1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Selecciona el framework "Vite"
4. Configura el build command: `npm run build`
5. Configura el output directory: `dist/public`
6. Click en "Deploy"

### 3. Variables de entorno (Opcional)
Si usas la base de datos MySQL, configura estas variables en Vercel Dashboard:
- `DATABASE_URL` — URL de conexión MySQL
- `JWT_SECRET` — Clave secreta para auth
- `OAUTH_CLIENT_ID` — ID de cliente OAuth
- `OAUTH_CLIENT_SECRET` — Secreto de cliente OAuth

---

## Estructura del Proyecto

```
├── api/                    # Backend API (Hono + tRPC)
│   ├── boot.ts            # Entry point local
│   └── index.ts           # Entry point Vercel serverless
├── db/                     # Drizzle ORM schema + seed
├── dist/public/           # Build output (frontend)
├── src/
│   ├── components/home/   # Componentes Home (VR, AR, Chat, etc.)
│   ├── pages/             # Páginas (Home, Dashboards, Login)
│   ├── hooks/             # Custom hooks (auth, etc.)
│   └── providers/         # tRPC provider
├── vercel.json            # Configuración Vercel
└── deploy.sh              # Script de deploy automatizado
```

---

## Características del Sitio

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **3D Viewer**: Modelo Samsung S95D fotorealista con 360° interactivo
- **AR Preview**: Prueba el TV en tu pared usando la cámara
- **Live Chat**: Chat en tiempo real con agentes Samsung
- **Size Configurator**: Comparador visual de tamaños de TV
- **MLM Network**: Sistema de red de mercadeo con comisiones multinivel
- **Auth**: OAuth 2.0 + login local con roles (admin, agente, embajador, cliente)
- **Backend**: tRPC + Hono + Drizzle ORM + MySQL

---

## Notas para Deploy

- El proyecto usa **Node.js 20.x** como runtime
- El backend requiere una base de datos **MySQL** para funcionar completamente
- En modo sin base de datos, el frontend funciona como **SPA estática**
- Las imágenes de productos están en `public/` y se sirven como static assets
