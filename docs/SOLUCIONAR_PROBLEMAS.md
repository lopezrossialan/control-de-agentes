# ❓ Solucionar Problemas & FAQ

## 🆘 Problemas Comunes

### ❌ "GITHUB_TOKEN no detectado"

**Síntoma:** Banner naranja en el panel

**Solución:**

1. Ve a ⚙️ **Configuración**
2. Sección **🤖 GitHub Copilot**
3. Obtén token en [github.com/settings/tokens](https://github.com/settings/tokens)
4. Pega el token
5. Click **💾 Guardar**

[→ Tutorial completo](CONFIGURACION.md)

---

### ❌ "Acceso no autorizado" (401 Unauthorized)

**Síntoma:** Error en el chat: `401 Unauthorized`

**Causas posibles:**

| Causa                      | Solución                                                           |
| -------------------------- | ------------------------------------------------------------------ |
| Token incorrecto           | Regenerar en GitHub settings                                       |
| Token expirado             | Generar uno nuevo                                                  |
| Sin acceso a GitHub Models | Solicitar acceso en [github.com/models](https://github.com/models) |
| Token sin scope read:user  | Crear token con ese scope                                          |

**Verificar:**

```bash
curl -H "Authorization: Bearer TU_TOKEN" https://api.github.com/user
```

---

### ❌ "Puerto 3000 en uso"

**Síntoma:** `Error: listen EADDRINUSE :::3000`

**Windows:**

```powershell
# Ver qué ocupa el puerto
netstat -ano | findstr :3000

# Matar el proceso
taskkill /PID <PID_NUMBER> /F

# O usar otro puerto
set PORT=4000 && npm start
```

**Mac/Linux:**

```bash
# Ver qué ocupa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O usar otro puerto
PORT=4000 npm start
```

---

### ❌ "Node.js no encontrado"

**Síntoma:** `'npm' is not recognized`

**Solución:**

1. Descargar [Node.js LTS](https://nodejs.org)
2. Ejecutar instalador (dejar opciones default)
3. **Reiniciar la computadora**
4. Abrir terminal nueva
5. Verificar: `node --version` (debe ser v18+)

---

### ❌ "Chromium no descarga"

**Síntoma:** Error en Playwright tests

**Solución:**

```bash
# Descargar manualmente
npx playwright install chromium --with-deps
```

Si sigue fallando:

- Verificar conexión a internet
- Usar VPN (en algunos países está bloqueado)
- 50 GB libres en disco

---

### ❌ "Los tests Playwright no funcionan"

**Síntoma:** Los tests fallan con "elemento no encontrado"

**Solución por pasos:**

1. **Usar Playwright Inspector**
   - Panel → 🏠 **INICIO**
   - Ir a **Playwright Inspector**
   - Pegar URL exacta de tu app
   - Click **🔍 Inspeccionar**

2. **Copiar locators correctos**
   - Verás tabla con elementos
   - Copiar JSON

3. **Regenerar los tests**
   - Ir a 🎭 **Playwright Agent**
   - Pegar los locators en el chat
   - "Regenera los tests con estos locators"

---

### ❌ "El chat no responde"

**Síntoma:** Spinner indefinido, nada sucede

**Soluciones:**

1. **Espera 30 segundos más** (primer request es lento)
2. **Verifica el token** → [github.com/settings/tokens](https://github.com/settings/tokens)
3. **Abre DevTools** (F12)
   - Ir a **Network**
   - Si ves error en `/api/chat` → Problema con token
4. **Reinicia el servidor:**
   - Cerrar terminal
   - Ejecutar `npm start` nuevamente

---

### ❌ "Error al subir PDF"

**Síntoma:** "Error: Solo se permiten .doc, .docx y .pdf"

**Causas:**

- Archivo corrompido → Descargarlo nuevamente
- Extensión incorrecta → Renombrar a `.pdf` o `.docx`
- Tamaño > 50 MB → Dividir en partes
- PDF protegido → Desproteger con Acrobat

---

### ❌ "Docker no arranca"

**Síntoma:** `docker compose up` falla

**Verifica:**

```bash
# Docker está corriendo?
docker --version

# Docker Desktop está abierto?
# (En Windows/Mac, debe estar en bandeja)

# Puerto 3000 está libre?
docker compose down  # Si hay uno viejo

# Intenta nuevamente
docker compose up
```

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta?

**Nada.** GitHub Models ofrece:

- ✅ 8,000 tokens/día **gratis**
- ✅ Sin tarjeta de crédito
- ✅ Plan Pro: tokens ilimitados (pagado)

---

### ¿Qué modelos puedo usar?

**30+ modelos disponibles:**

Ir a **⚡ Modelos LLM** para la lista completa:

- GPT-4o
- Claude 3.5 Sonnet
- Llama 3.1
- DeepSeek
- Mistral
- Y más...

---

### ¿Mis datos se envían a internet?

**No.** Solo el texto del chat:

- ✅ Documentos: almacenados locally en `/outputs/`
- ✅ Token: guardado en `.env` (no sale a internet)
- ✅ Solo se envía: texto del chat → GitHub Models API
- ✅ Respuestas: se quedan en `/outputs/`

---

### ¿Puedo crear mis propios agentes?

**Sí.**

**Opción A: Desde el panel** (recomendado)

- 🤖 Agentes → ➕ Crear agente
- Rellenar el formulario
- Click Crear

**Opción B: Manual**

- Crear carpeta `agents/mi-agente/`
- Crear archivo `.agent.md`
- Reiniciar servidor

[→ Ver documentación](ARQUITECTURA.md)

---

### ¿Funciona sin internet?

**El servidor:** Sí
**Los agentes IA:** No (necesitan GitHub Models API)
**Playwright Inspector:** No para URLs externas

---

### ¿Cuál es el tamaño máximo de documento?

**50 MB**

Para documentos más grandes:

- Dividir en partes
- O copiar/pegar el texto directamente

---

### ¿Cómo comparto agentes con mi equipo?

1. Ve a **🤖 Agentes → Gestionar**
2. Descargar carpeta `agents/<agente-id>/`
3. Tu equipo:
   - Copia la carpeta en su `agents/`
   - Reinicia el servidor
   - ¡Listo!

O mediante GitHub:

- Push agentes a repo
- Otros clonan el repo

---

### ¿Qué pasa si se cae el servidor?

- Historial en `/outputs/` se guarda
- Conversaciones en-memory se pierden
- Reiniciar: `npm start`

Para mantener historial entre sesiones → Descargar resultados.

---

### ¿Cómo hago tests de una app que pide login?

**Opción 1: Usar token hardcoded**

```typescript
// En el test
await page.goto("https://app.com/?token=ABC123");
```

**Opción 2: Setear cookies**

```typescript
await page
  .context()
  .addCookies([{ name: "auth", value: "token123", domain: "app.com" }]);
```

**Opción 3: Automatizar el login**

```typescript
await page.goto("https://app.com/login");
await page.fill("[name=email]", "user@example.com");
await page.fill("[name=password]", "pass123");
await page.click('button:has-text("Login")');
```

---

### ¿Funciona en Mac M1/M2?

**Sí**, pero necesitas:

```bash
# Instalar Playwright para ARM
npx playwright install --with-deps
```

---

### ¿Funciona en teléfono?

**Técnicamente sí**, pero:

- UI no es responsive (mejor en desktop)
- Mobile browsers no soportan bien SSE streaming

Recomendación: Usar en **desktop o tablet**.

---

## 📊 Decisiones de Arquitectura

### ¿Por qué no usar base de datos?

- Outputs son archivos JSON/MD (fácil versionarlos en Git)
- Usuarios no suelen manejar >100 archivos
- Persisten entre sesiones automáticamente

Si quieres escalabilidad: Agregar MongoDB / PostgreSQL.

### ¿Por qué Server-Sent Events (SSE) y no WebSockets?

- SSE es más simple para unidireccional (server → client)
- No requiere cliente especial
- Reconnect automático
- Mejor para streaming LLM

### ¿Por qué sin autenticación?

- Pensado para uso local (single-user)
- Cada máquina ejecuta su instancia
- Para multi-user → Agregar JWT + DB

---

## 🔍 Debugging

### Activar modo verbose

```bash
# Mac/Linux
DEBUG=* npm start

# Windows
set DEBUG=* && npm start
```

### Verificar token correctamente

```bash
# Reemplaza con tu token
curl -H "Authorization: Bearer ghp_..." https://api.github.com/user
```

Debería devolver info de tu usuario (JSON).

### Ver logs de requests

Abrir F12 → Network → Filtrar `/api/chat`

Debería ver:

- Status: 200
- Response type: event-stream

---

[← Atrás](GUIA_AGENTES.md) | [Documentación →](ARQUITECTURA.md)
