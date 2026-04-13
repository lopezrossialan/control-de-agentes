# 🤖 Control de Agentes v1.0

> **Panel para agentes IA** — Crea, gestiona y orquesta agentes especializados desde tu navegador. Todo local, todo simple.

[![Status](https://img.shields.io/badge/status-ready%20for%20production-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Windows](https://img.shields.io/badge/windows-only-blue)]()

**Control de Agentes** es un **panel web local** que permite crear y orquestar agentes IA de forma simple. Sin CLI compleja, sin configuraciones oscuras: todo desde el navegador. 100% para Windows (próximamente Mac/Linux).

## ⚡ Instalación Rápida (Windows)

### Opción 1: Instalador .EXE (Recomendado)

1. Descargar `control-de-agentes-setup.exe`
2. **Doble clic**
3. ✅ Se abre en `http://localhost:3000`

**Próximas veces:** Doble clic en el acceso directo del Escritorio

### Opción 2: Manual (Developers)

1. [Descargar Node.js v18+](https://nodejs.org)
2. Clonar: `git clone <repo>`
3. `npm install && npm start`
4. Abre http://localhost:3000

[→ Guía completa de instalación](docs/INSTALACION.md)

---

## 📋 Documentación

- [📖 Instalación](docs/INSTALACION.md) — Guía paso a paso
- [⚙️ Configuración](docs/CONFIGURACION.md) — Token GitHub
- [🤖 Cómo Crear Agentes](docs/GUIA_AGENTES.md) — Primeros pasos
- [🆘 Solucionar Problemas](docs/SOLUCIONAR_PROBLEMAS.md) — FAQ
- [🏗️ Arquitectura](docs/ARQUITECTURA.md) — Cómo funciona

---

### Manual (Desarrolladores)

```bash
git clone https://github.com/tu-usuario/mission-control.git
cd mission-control
npm install
npx playwright install chromium
npm start
```

---

## 🔐 Configuración del Token

**Obligatorio:** Se necesita un **GitHub Token** (gratis, sin costo) para usar los agentes.

### Primera Vez (Paso a Paso)

1. **Abrir el panel** → `http://localhost:3000`

2. **Verás un banner naranja** con ⚠️ "Configura tu GitHub Token"
   - Click en el banner → Se abre un **modal paso a paso**

3. **Modal Step 1:** Explicación
   - "Necesitamos tu GitHub Token para acceder a modelos de IA"

4. **Modal Step 2:** Link a GitHub
   - Click en botón → Se abre GitHub automáticamente
   - O directo: [github.com/settings/tokens](https://github.com/settings/tokens)

5. **En GitHub:**
   - Click **Generate new token (classic)**
   - Nombre: puede ser `mission-control`
   - **Sin scopes adicionales** (dejar default)
   - Click **Generate token**
   - **Copiar el token** (se ve una sola vez, formato: `ghp_...`)

6. **De vuelta en el modal:**
   - Click botón "Token generado"
   - Pegar el token en el input
   - Click **Guardar**

7. **¡Listo!** 🎉
   - Modal cierra
   - Banner desaparece
   - Ahora podés chatear con los agentes

---

## 🤖 Los 4 Agentes

### 📄 Doc Interpreter (Paso 1: Lectura)

**Qué hace:** Lee documentos funcionales y extrae requerimientos estructurados

**Input:** Archivo `.doc`, `.docx` o `.pdf` con especificaciones

**Output:** Markdown con:

- Actores del sistema
- Flujos principales y alternativos
- Reglas de negocio
- Eventos y precondiciones
- ⚠️ Ambigüedades detectadas

**Uso:** Panel → 🤖 Agentes → Doc Interpreter → Adjuntar documento

---

### 🧪 Test Case General (Paso 2: Generación)

**Qué hace:** Genera casos de prueba en tabla Markdown

**Input:** Documento original O output del Doc Interpreter

**Output:** Tabla con ID, pasos, resultado esperado, tipo (Funcional/Negativo/Borde)

**Uso:** Panel → 🧪 Test Case General → Adjuntar documento o pegar análisis

---

### 🥒 Test Case Gherkin (Paso 2: BDD)

**Qué hace:** Genera features BDD en formato Gherkin

**Input:** Documento o análisis

**Output:** Archivos `.feature` compatible con Cucumber/SpecFlow/Behave

**Uso:** Panel → 🥒 Test Case Gherkin → Adjuntar documento

---

### 🎭 Playwright Agent (Paso 2: Automation)

**Qué hace:** Genera tests end-to-end en TypeScript + Playwright

**Input:** Documento, análisis, o locators del Inspector

**Output:** Archivo `.spec.ts` listo para `npx playwright test`

**Uso:** Panel → 🎭 Playwright Agent → Adjuntar documento + indicar URL base

---

## 🎨 Secciones del Panel

### 🏠 INICIO

- Flujo de trabajo visual (documentos → agentes → outputs)
- Playwright Inspector integrado para extraer locators

### 🤖 AGENTES

- Chat con agentes en tiempo real (streaming)
- Crear agentes personalizados
- Importar desde GitHub
- Guardar respuestas como `.md` / `.json`

### 📁 HISTORIAL

- Tabla de todos los archivos generados
- Descargar, ver, eliminar outputs
- Máximo 100 archivos (los antiguos se borran automáticamente)

### ⚡ MODELOS LLM

- Selector con 30+ modelos disponibles
- Información: proveedor, costo, límites
- Verificar cuota de tokens actual
- GitHub Models: 8.000 tokens/día (free) o 2M tokens/día (Pro/Education)

### 🔌 MCPs (Model Context Protocol)

- Agregar servidores MCP para extender funcionalidades
- Conectarse con herramientas externas

### 🔗 JIRA (Opcional)

- Requiere credenciales de Jira
- Búsqueda de issues
- Crear bugs directamente
- Comentar en issues

### ⚙️ CONFIGURACIÓN

- Gestionar GitHub Token
- Tokens opcionales: OpenAI, Anthropic, Jira
- Todo guardado en `.env` local (nunca sale a internet)

---

## 📖 Manual de Usuario

### Caso 1: "Acabo de instalar, ¿por dónde empiezo?"

1. Elegir instalador según tu SO
2. El navegador abre automáticamente
3. Ver banner naranja "Configura tu GitHub Token"
4. Seguir los pasos del modal
5. ¡Listo! Ya podés usar los agentes

### Caso 2: "Quiero analizar mi documento de requerimientos"

1. Panel → 🤖 **Agentes**
2. Seleccionar: **Doc Interpreter** (la 📄)
3. Click en icono 📎 → Adjuntar archivo
4. Esperar ~10-20 segundos
5. Click **Guardar** → descargá como `.md`

### Caso 3: "Quiero generar casos de prueba"

1. Panel → 🧪 **Test Case General**
2. Adjuntar documento O pegar análisis anterior
3. Esperar 15-30 segundos
4. Verás tabla con TC-001, TC-002, etc.
5. Click **Guardar** → descargá

### Caso 4: "Quiero generar tests Playwright"

1. Panel → 🎭 **Playwright Agent**
2. Adjuntar documento O pegar análisis
3. En el chat escribir: "La URL base es https://app.example.com"
4. Esperar 20-40 segundos
5. Click **Guardar** → descargá `.spec.ts`
6. En tu proyecto: copiar a `tests/` y ejecutar `npx playwright test`

### Caso 5: "Quiero extraer locators de mi app"

1. Panel → 🏠 **INICIO**
2. Ir a **Playwright Inspector**
3. Pegar URL de tu app
4. Click **Inspeccionar**
5. Verás tabla con elementos y locators
6. Copiar JSON → pegar en Playwright Agent para mejorar tests

### Caso 6: "Quiero crear un agente personalizad"

1. Panel → 🤖 **Agentes**
2. Click ➕ **Crear agente**
3. Rellenar: nombre, ID, descripción, icono, prompt
4. Click **Crear** → Agente listo para usar

---

## 🛠️ Para Desarrolladores

### Estructura del Proyecto

```
mission-control/
├── server.js                    # Backend Express (~1200 líneas)
├── package.json                 # Dependencias Node
├── .env                         # Tokens locales (NO git)
│
├── panel/                       # Frontend SPA
│   ├── index.html               # HTML (~250 líneas)
│   ├── panel.js                 # Lógica (~2000 líneas)
│   └── panel.css                # Estilos (~300 líneas)
│
├── agents/                      # 4 agentes default + custom
│   ├── doc-interpreter/
│   ├── testcase-general/
│   ├── testcase-gherkin/
│   ├── playwright-agent/
│   └── skills/
│
├── playwright-inspector/        # Módulo de inspección
├── config/agent-dirs.json       # Registro de agentes externos
├── outputs/                     # Resultados generados (NO git)
├── inputs/                      # Documentos entrada (NO git)
└── instalar-y-arrancar.*        # Scripts instalación
```

### Crear Agente Personalizado

**Opción A: Panel (Recomendado)**

- 🤖 Agentes → ➕ Crear agente → Rellenar forma

**Opción B: Manual**

1. Crear carpeta:

```bash
mkdir -p agents/mi-agente/skills
```

2. Crear `agents/mi-agente/mi-agente.agent.md`:

```yaml
---
name: Mi Agente
id: mi-agente
version: 1.0.0
description: Qué hace
icon: 🎯
skills:
  - skill1
---
Aquí va el prompt del agente...
```

3. Crear `agents/mi-agente/skills/skill1.skill.md`:

```yaml
---
skill: skill1
version: 1.0.0
---
## Descripción
...
```

4. Reiniciar servidor: `npm start`

---

### Stack Tecnológico

| Capa           | Tecnología                                |
| -------------- | ----------------------------------------- |
| Backend        | Node.js v18+ + Express                    |
| Frontend       | HTML5 / CSS3 / JavaScript vanilla         |
| IA             | GitHub Models API (OpenAI SDK compatible) |
| Automatización | Playwright (Chromium)                     |
| Upload         | Multer + Mammoth (DOCX) + pdf-parse (PDF) |
| Streaming      | Server-Sent Events (SSE)                  |
| Deployment     | Docker / Docker Compose                   |

### Endpoints API REST

```
GET    /api/agents                 # Listar agentes
POST   /api/agents                 # Crear agente
PUT    /api/agents/:id             # Editar agente
DELETE /api/agents/:id             # Eliminar agente

POST   /api/chat                   # Chat con streaming SSE
POST   /api/upload                 # Subir archivo
GET    /api/outputs                # Listar outputs
POST   /api/save                   # Guardar como .md
GET    /api/config                 # Leer config
```

---

## 🆘 Troubleshooting

### ❌ Node.js NO encontrado

- Descargar desde [nodejs.org](https://nodejs.org)
- Verificar versión: `node --version` (debe ser v18+)
- Cerrar y abrir terminal nuevamente

### ❌ Puerto 3000 en uso

```bash
# Verificar qué ocupa puerto
# Windows: netstat -ano | find ":3000"
# Mac/Linux: lsof -i :3000

# Usar otro puerto
set PORT=4000 && npm start  # Windows
# o
PORT=4000 npm start         # Mac/Linux
```

### ❌ Token no funciona

- Regenerar en [github.com/settings/tokens](https://github.com/settings/tokens)
- Verificar formato (debe ser `ghp_...`)
- Recargar panel (F5)

### ❌ Chromium não instala

```bash
npx playwright install chromium --with-deps
```

### ⚠️ Tests Playwright no funcionan

- Usar Playwright Inspector para extraer locators correctos
- Indicar URL base clara al agente
- Regenerar tests si la app cambió

---

## ❓ Preguntas Frecuentes

**¿Cuánto cuesta?**
Gratis totalmente. GitHub Models ofrece 8.000 tokens/día sin costo.

**¿Mis datos se envían a Internet?**
Solo el texto del chat → GitHub Models API. Archivos permanecen locales en `/outputs/`.

**¿Puedo usar otros modelos?**
Sí, 30+ modelos disponibles: GPT-4o, Claude 3.5, Llama 3, DeepSeek, Mistral, etc.

**¿Puedo crear mis propios agentes?**
Sí, desde 🤖 Agentes → ➕ Crear agente (o manualmente en `/agents/`).

**¿Dónde se guardan los outputs?**
En carpeta `/outputs/` del proyecto (visible en 📁 Historial).

**¿Puedo usar Mission Control en equipo?**
Actualmente está pensado para uso single-user local. Para equipo, deployar en servidor + autenticación.

**¿Qué pasa si se cae el servidor?**
Reiniciar con `npm start`. Historial en `/outputs/` se mantiene, pero conversaciones en-memory se pierden.

---

## 📞 Soporte

- 🐛 Bug report → Crear issue en GitHub
- 📚 Más info → Ver `READMEAPP/` para documentación técnica
- 💡 Sugerencias → GitHub Discussions

---

**v2.0.0 - Abril 2026 | Hecho con ❤️ para QA Automático**
