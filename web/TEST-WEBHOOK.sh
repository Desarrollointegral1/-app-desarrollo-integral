#!/bin/bash

# 🧪 Script de prueba para GitHub Webhook → Brain Factory Sync

echo "🧪 Probando webhook de Brain Factory..."
echo ""

# 1. Crear archivo de prueba en Obsidian
echo "📝 Paso 1: Crear archivo de prueba..."
mkdir -p obsidian/nutricion
cat > obsidian/nutricion/test-webhook.md << 'EOF'
# Test Webhook Brain Factory

Este es un documento de prueba para verificar que el webhook de GitHub funciona correctamente.

## Contenido de Prueba

- ✅ Sistema de Brain Factory activo
- ✅ Sync de GitHub a Supabase funcionando
- ✅ Obsidian → GitHub → Brain Factory pipeline operacional

## Información del Test

- **Fecha**: $(date)
- **Propósito**: Validar webhook de sincronización
- **Status**: En prueba
EOF

echo "✅ Archivo creado: obsidian/nutricion/test-webhook.md"
echo ""

# 2. Agregar a git
echo "📤 Paso 2: Git add/commit/push..."
git add obsidian/nutricion/test-webhook.md
git commit -m "test: webhook brain factory sync"
git push origin main

echo "✅ Push a GitHub completado"
echo ""

# 3. Esperar a que GitHub envíe el webhook
echo "⏳ Paso 3: Esperando a que GitHub procese el webhook (~30s)..."
sleep 30

echo "✅ Webhook debería haber sido procesado"
echo ""

# 4. Verificar en Supabase
echo "🔍 Paso 4: Verificar en Supabase..."
echo ""
echo "Para verificar que el documento fue agregado al brain:"
echo ""
echo "1. Abre: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/editor/29649"
echo "2. Busca la tabla: brain_documents"
echo "3. Filtra por: source = 'github' y sourcePath contiene 'test-webhook.md'"
echo ""
echo "Deberías ver:"
echo "  - title: test-webhook"
echo "  - domain: nutrition"
echo "  - source: github"
echo ""

# 5. Verificar vía API
echo "📡 Paso 5: Verificar vía API..."
curl -s http://localhost:3000/api/brains -H "Content-Type: application/json" | jq '.[] | select(.domain=="nutrition") | {id, domain, name, documentCount}'

echo ""
echo "✅ Test completado"
echo ""
echo "📊 Si ves el documento en Supabase y en la API, ¡todo funciona! 🎉"
