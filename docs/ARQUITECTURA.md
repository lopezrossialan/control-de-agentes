# 🏗️ Arquitectura de Mission Control

## Visión General

Mission Control es una **aplicación web local** que conecta documentación de requisitos con herramientas de testing IA.

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                      │
│                  http://localhost:3000                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTML5 + JS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                           │
│                    panel/panel.js (~2KB)                    │
│    - Init workflow                                          │
│    - 4 Agentes                                              │
│    - Historial de outputs                                   │
│    - Configuración                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP / SSE
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js)                           │
│                  server.js (~1200l)                         │
│    - REST API (/api/*)                                      │
│    - File upload (multer)                                   │
│    - Streaming chat (SSE)                                   │
│    - Agent orchestration                                    │
└────────────────────────┬────────────────────────────────────┘
           ┌─────────────┼─────────────┬──────────────┐
           ↓             ↓             ↓              ↓
       ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  Chat  │  │ Document │  │ Browsers │  │ Configs  │
       │  LLM   │  │ Extract  │  │Playwright│  │ Storage  │
       │  API   │  │          │  │          │  │          │
       └────────┘  └──────────┘  └──────────┘  └──────────┘
           │             │             │              │
           ↓             ↓             ↓              ↓
    GitHub Models  Mammoth/PDF-Parse Playwright  FileSystem
    (30+ modelos)   (DOC/PDF parse)   (Chromium)  (outputs/)
```

---

## Stack Tecnológico

### Backend

| Componente       | Librería   | Versión | Función              |
| ---------------- | ---------- | ------- | -------------------- |
| **Server**       | Express    | 4.19+   | HTTP server          |
| **LLM API**      | OpenAI SDK | 4.47+   | GitHub Models client |
| **File Upload**  | Multer     | 2.1+    | Manejo de archivos   |
| **DOCX Parse**   | Mammoth    | 1.12+   | Leer .docx           |
| **PDF Parse**    | pdf-parse  | 1.1+    | Leer .pdf            |
| **Browser Auto** | Playwright | 1.58+   | Automatización       |
| **Config**       | dotenv     | 16.4+   | Gestionar .env       |

### Frontend

| Componente    | Tecnología               | Propósito         |
| ------------- | ------------------------ | ----------------- |
| **Markup**    | HTML5                    | Estructura        |
| **Styling**   | CSS3                     | Diseño responsivo |
| **Logic**     | Vanilla JS               | ~2000 líneas      |
| **Utils**     | Fetch API                | HTTP calls        |
| **Streaming** | Server-Sent Events (SSE) | Chat en vivo      |

### DevOps

| Componente           | Tecnología     |
| -------------------- | -------------- |
| **Containerización** | Docker         |
| **Orquestación**     | Docker Compose |
| **Node Version**     | 20 LTS (slim)  |

---

## Estructura de Carpetas

```
mission-control/
│
├── 🔧 server.js                    ← Punto de entrada Express
├── 📦 package.json                 ← Dependencias Node
├── 📝 .env                         ← Tokens locales (NO git)
│
├── 🖥️ panel/                        ← Frontend SPA
│   ├── index.html                  ├─ HTML (~250l)
│   ├── panel.js                    ├─ Lógica JS (~2000l)
│   └── panel.css                   └─ Estilos (~300l)
│
├── 🤖 agents/                       ← Agentes IA
│   ├── doc-interpreter/            ├─ Análisis documentos
│   ├── testcase-general/           ├─ Casos prueba
│   ├── testcase-gherkin/           ├─ BDD features
│   ├── playwright-agent/           ├─ Tests E2E
│   └── skills/                     └─ Prompts especializados
│
├── 🔍 playwright-inspector/        ← Inspector visual
│   ├── index.html
│   ├── inspector.js
│   └── inspector-agent.md
│
├── ⚙️ config/                       ← Configuración
│   ├── agent-dirs.json             └─ Registro de agentes
│   └── active-agents.json          └─ Agentes activados
│
├── 📤 outputs/                      ← Archivos generados
│   ├── <timestamp>-chat.md
│   ├── <timestamp>-tests.spec.ts
│   └── ...
│
├── 📥 inputs/                       ← Documentos a procesar
│   └── (archivos subidos)
│
├── 📚 docs/                         ← Documentación
│   ├── INSTALACION.md
│   ├── CONFIGURACION.md
│   ├── GUIA_AGENTES.md
│   ├── TUTORIALES.md
│   ├── SOLUCIONAR_PROBLEMAS.md
│   └── ARQUITECTURA.md
│
├── 🛠️ scripts/                      ← Utilidades
│   ├── start.bat                   ├─ Doble-clic (Windows)
│   ├── start.sh                    ├─ Terminal (Mac/Linux)
│   ├── launcher.js                 ├─ Auto-launcher
│   └── build-exe.js                └─ Compilar .exe
│
├── 🐳 docker-compose.yml           ← Orquestación Docker
├── 🐳 Dockerfile                   ← Imagen Node+Chromium
│
└── 📖 README.md                    ← Documentación inicio
```

---

## Flujo de Datos

### 1. Usuario sube documento

```
browser (input file)
    ↓ POST /api/upload
Express multer middleware
    ↓ fs.writeFileSync(tmpdir)
temp file
    ↓ mamm.extractRawText() / pdf-parse
document content (string)
```

### 2. Usuario envía chat a agente

```
browser (message + documentID)
    ↓ POST /api/chat
Express backend
    ↓ OpenAI client (streaming)
GitHub Models API
    ↓ SSE stream (Server-Sent Events)
browser (response in real-time)
    ↓ showToast / updateChat
```

### 3. Usuario genera output

```
chat response (markdown/code)
    ↓ user clicks "Guardar"
POST /api/save {content, filename}
    ↓ fs.writeFileSync(outputs/<timestamp>-<name>)
file on disk
    ↓ file available in Historial
browser download / view
```

---

## APIs REST

### Agentes

```bash
# Listar agentes
GET /api/agents
Response: { agents: [{id, name, icon, isActive, ...}, ...] }

# Crear agente
POST /api/agents
Body: { name, id, description, icon, prompt, skills[] }
Response: { agent }

# Editar agente
PUT /api/agents/:id
Body: { name, description, ... }
Response: { agent }

# Eliminar agente
DELETE /api/agents/:id
Response: { success }

# Actualizar agentes activos
POST /api/agents/active
Body: { activeIds: ["agent1", "agent2"] }
Response: { activeAgents }
```

### Chat

```bash
# Chat con streaming (Server-Sent Events)
POST /api/chat
Body: { agentId, message, documentId?, inputFile? }
Response: Stream text/event-stream

# Upload documento
POST /api/upload
Content-Type: multipart/form-data
File: buffer
Response: { documentId, filename, preview }

# Guardar resultado
POST /api/save
Body: { content, filename, format }
Response: { success, path }

# Listar outputs
GET /api/outputs
Response: { files: [{timestamp, filename, size, ...}, ...] }
```

### Configuración

```bash
# Leer configuración
GET /api/config
Response: { hasToken, modelCount, ... }

# Actualizar token
POST /api/config
Body: { operation: "set-token", token }
Response: { success }
```

---

## Cómo Funciona el Chat

### Arquitectura SSE (Server-Sent Events)

```
┌─ Browser ─────────────┐
│                       │
│  POST /api/chat       │ ← Envía agentID + message
│                       │
└───────────┬───────────┘
            │
┌───────────▼─────────────┐
│    Express Backend      │
│                         │
│  1. Parse request       │
│  2. Load agent prompt   │
│  3. Create OpenAI msg   │
│  4. Call GitHub Models  │
│  5. Stream response     │
│                         │
│  res.setHeader(        │
│    'Content-Type',     │
│    'text/event-stream' │
│  )                     │
└───────────┬─────────────┘
            │
┌───────────▼──────────────────────┐
│    GitHub Models API             │
│ (streaming LLM response)         │
│                                  │
│  data: {"choices":[{"delta":{   │
│    "content":"Aquí va..."        │
│  }}]}                            │
│                                  │
│  data: {"choices":[{"delta":{   │
│    "content":" el siguiente"     │
│  }}]}                            │
│                                  │
│  ...                             │
│  [DONE]                          │
└────────────────────────┬─────────┘
                         │
┌────────────────────────▼────────────┐
│         Browser JS                  │
│                                     │
│ EventSource('/api/chat')            │
│                                     │
│ onmessage = (event) => {           │
│   content += event.data            │
│   updateUI(content)                │
│ }                                   │
│                                     │
│ Resultado visible en tiempo real    │
└─────────────────────────────────────┘
```

---

## Persistencia de Datos

### Archivos Generados

```
outputs/
├── <timestamp>-chat-001.md        ← Chat exportado
├── <timestamp>-tests.spec.ts      ← Tests Playwright
├── <timestamp>-cases.csv          ← Casos de prueba
├── <timestamp>-features.feature   ← Gherkin
└── <index.json>                   ← Índice de outputs
```

**Límite:** Max 100 archivos. Más antiguos se eliminan automáticamente.

### Configuración Local

```
mission-control/
├── .env                           ← GitHub token (NO git)
├── config/
│   ├── agent-dirs.json            ├─ Rutas de agentes extra
│   └── active-agents.json         └─ Agentes mostrados
```

**¿Dónde se guardan?** Carpeta del proyecto = 100% local.

---

## Cómo Agregar un Agente Custom

### Estructura Mínima

```
agents/
└── mi-agente/
    ├── mi-agente.agent.md         ← Metadata + prompt
    └── skills/
        └── skill-1.skill.md       ← Prompts especializados
```

### Archivo: `mi-agente.agent.md`

```yaml
---
name: Mi Agente Personalizado
id: mi-agente
version: 1.0.0
description: Qué hace este agente
icon: 🎯
model: gpt-4o
temperature: 0.7
max_tokens: 2000
skills:
  - skill-1
  - skill-2
---

# Sistema Prompt

Eres un especialista en [TEMA].

Tu tarea es [DESCRIPCIÓN].

Sigue estos pasos:
1. [Paso 1]
2. [Paso 2]
```

### Archivo: `skills/skill-1.skill.md`

```yaml
---
skill: skill-1
version: 1.0.0
description: Para qué sirve
---

## Instrucción

Cuando el usuario [SITUACIÓN], debes [ACCIÓN].

Ejemplo:
- Input: "..."
- Output: "..."
```

---

## Docker Optimization

### Imagen Docker

```dockerfile
FROM node:20-slim

# Solo dependencias necesarias (no recomendado tener node-gyp)
RUN apt-get update && apt-get install -y chromium libnss3 ...

WORKDIR /app
COPY package* ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

**Tamaño:** ~450 MB comprimido

### Docker Compose

```yaml
version: "3.9"

services:
  mission-control:
    build: .
    container_name: mission-control
    ports:
      - "3000:3000"
    volumes:
      - ./outputs:/app/outputs # Persistir resultados
      - ./inputs:/app/inputs # Documentos
      - ./.env:/app/.env # Token
      - ./agents:/app/agents # Agentes
      - ./config:/app/config # Config
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Performance

### Benchmarks

| Operación               | Duración                   |
| ----------------------- | -------------------------- |
| Iniciar servidor        | ~500ms                     |
| Cargar agentes          | ~100ms                     |
| Chat OpenAI (streaming) | 5-40s (depende del prompt) |
| Parse PDF               | ~2s (por MB)               |
| Parse DOCX              | ~1s (por MB)               |

### Optimizaciones Posibles

- [ ] Caché LLM (Redis)
- [ ] Worker threads para uploads pesados
- [ ] CDN para assets estáticos (panel.js)
- [ ] Compression gzip en Express
- [ ] Límite de rate limiting
- [ ] Almacenamiento comprimido en S3

---

[← Atrás](GUIA_AGENTES.md) | [Siguiente →](API_REFERENCE.md)
