# Control de Agentes

> Panel web local para crear, gestionar y chatear con agentes de IA usando GitHub Models API.

## Instalacion

### Opcion A — Ejecutable (recomendada)

1. Pedir el archivo `control-de-agentes.exe` (55 MB) al administrador del proyecto
2. Copiar a cualquier carpeta
3. Doble clic en el archivo
4. Se abre automaticamente en http://localhost:3000

No requiere instalar Node.js ni ningun otro software. Al primer inicio se crean automaticamente las carpetas necesarias junto al .exe.

### Opcion B — Desde el codigo fuente

**Requisitos:** [Node.js v16+](https://nodejs.org) + cuenta de GitHub (gratuita)

```bash
git clone https://github.com/lopezrossialan/control-de-agentes.git
cd control-de-agentes
npm install
npm start
```

Abri http://localhost:3000 en tu navegador.

> Tambien podes descargar el ZIP desde GitHub: boton verde **Code** > **Download ZIP**, descomprimir, y ejecutar `npm install` + `npm start` en esa carpeta.

---

## Primer inicio

La primera vez que abras el panel aparece un **wizard de configuracion** que te pide un GitHub Token (gratuito). Este token te da acceso a 30+ modelos de IA (GPT-4.1, Llama 4, DeepSeek, etc.) con 8.000 tokens/dia sin costo.

### Como obtener el token

1. Anda a [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Nombre: `control-de-agentes`
4. No marques ningun scope (dejar vacio)
5. **Generate token** y copialo (empieza con `ghp_...`)
6. Pegalo en el wizard del panel

El token se guarda en un archivo `.env` local que nunca se sube al repositorio.

---

## Secciones del panel

### WORKSPACE

- **Inicio** — Workflow visual de agentes + Playwright Inspector
- **Agentes** — Crear, editar, eliminar y chatear con agentes
- **Historial** — Outputs generados (.md guardados)

### HERRAMIENTAS

- **Modelos LLM** — 30+ modelos disponibles, cuota visible
- **MCPs** — Configurar servidores MCP para VS Code Copilot
- **Jira** — Conexion nativa: buscar issues, delegar a agentes, crear bugs

### SISTEMA

- **Configuracion** — GitHub Token, credenciales Jira

---

## Crear un agente

1. Ir a **Agentes** > **Crear agente**
2. Completar: ID, nombre, icono, descripcion, prompt del sistema
3. Seleccionar skills globales (BDD, Playwright, API Testing, etc.)
4. Guardar

No hay agentes precargados. Vos creas los que necesites.

---

## Chatear

1. Clic en la tarjeta de un agente
2. Escribir mensaje o adjuntar archivo (.doc, .docx, .pdf)
3. Elegir modelo de IA desde el dropdown
4. Enviar — la respuesta llega en streaming (tiempo real)
5. Guardar la respuesta como .md si queres

Los chats se persisten en disco (carpeta `chats/`).

---

## Jira (opcional)

1. Obtener un API Token en [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. En la seccion **Jira** del panel, completar:
   - URL: `https://tu-empresa.atlassian.net`
   - Email de Jira
   - API Token
3. Guardar — aparece indicador verde "Conectado"
4. Buscar issues por JQL, delegarlos a agentes, crear bugs

---

## Skills globales

Bloques de conocimiento reutilizables que se inyectan en el prompt del agente al chatear. Las skills globales (en `config/skills/`) estan disponibles para **todos** los agentes.

Skills incluidas: BDD/Gherkin, Playwright Locators, Test Strategy, Doc Analysis, Accessibility, API Testing, Jira MCP.

Para agregar una nueva: crear un archivo `.skill.md` en `config/skills/`.

---

## MCPs

Desde la seccion MCPs podes configurar servidores [Model Context Protocol](https://modelcontextprotocol.io/) visualmente. Se guardan en `.vscode/mcp.json` y los usa GitHub Copilot en VS Code.

---

## Estructura del proyecto

```
control-de-agentes/
  server.js                  # Backend Express (API + streaming)
  package.json               # Dependencias
  .env                       # Tokens locales (NO se sube)
  panel/
    index.html               # Frontend
    panel.js                 # Logica del panel
    panel.css                # Estilos
  agents/                    # Agentes creados por el usuario
  config/
    skills/                  # Skills globales (.skill.md)
    active-agents.json       # Agentes activos
  playwright-inspector/      # Inspector de locators
  outputs/                   # Respuestas guardadas
  chats/                     # Historial de conversaciones
  scripts/
    build-exe.js             # Build a ejecutable portable
    start.bat                # Inicio rapido Windows
```

---

## Troubleshooting

**Puerto 3000 ocupado:** `set PORT=3001 && npm start`

**Token no funciona:** Regenerar en [github.com/settings/tokens](https://github.com/settings/tokens) y pegarlo en Configuracion.

**Inspector no detecta navegador:** El Inspector usa Edge o Chrome del sistema. Si no hay ninguno disponible: `npx playwright install chromium`

---

## Build ejecutable (para desarrollo)

Si modificas el codigo fuente y queres regenerar el .exe:

```bash
npm run build
```

Genera `control-de-agentes.exe` en `build/`. El .exe incluye Node.js v20, el panel web completo, y usa Edge/Chrome del sistema para el Inspector.

---

**v2.0 — Abril 2026**
