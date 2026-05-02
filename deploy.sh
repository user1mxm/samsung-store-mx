#!/bin/bash
set -e

echo "============================================"
echo "  Samsung Store MX — Deploy Script"
echo "============================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js no esta instalado. Instalalo primero: https://nodejs.org"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "npm no esta instalado."
    exit 1
fi

# Install Vercel CLI globally if not present
if ! command -v vercel &> /dev/null; then
    echo "Instalando Vercel CLI..."
    npm install -g vercel
fi

# Install GitHub CLI if not present
if ! command -v gh &> /dev/null; then
    echo "Instalando GitHub CLI..."
    npm install -g gh
fi

echo ""
echo "Paso 1: Login en Vercel"
echo "------------------------"
echo "Se abrira un navegador para autenticarte en Vercel."
vercel login

echo ""
echo "Paso 2: Login en GitHub"
echo "------------------------"
echo "Se abrira un navegador para autenticarte en GitHub."
gh auth login --web

echo ""
echo "Paso 3: Crear repositorio en GitHub"
echo "-------------------------------------"
read -p "Nombre del repositorio (default: samsung-store-mx): " REPO_NAME
REPO_NAME=${REPO_NAME:-samsung-store-mx}

read -p "GitHub username: " GH_USER

if ! gh repo view "$GH_USER/$REPO_NAME" &> /dev/null; then
    echo "Creando repositorio $REPO_NAME..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
else
    echo "El repositorio ya existe. Subiendo cambios..."
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git" 2>/dev/null || true
    git branch -M main
    git push -u origin main
fi

echo ""
echo "Paso 4: Deploy en Vercel"
echo "---------------------------"
vercel --prod --yes

echo ""
echo "============================================"
echo "  Deploy completado!"
echo "============================================"
echo "Tu sitio esta en linea en Vercel."
echo "Para conectar GitHub + Vercel para CI/CD:"
echo "  1. Ve a https://vercel.com/dashboard"
echo "  2. Selecciona tu proyecto"
echo "  3. Settings > Git > Connect GitHub Repository"
echo ""
