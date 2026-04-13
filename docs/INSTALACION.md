# 📖 Guía de Instalación - Control de Agentes

## ⚡ Instalación Rápida (Windows)

### Opción A: .EXE Instalador (Recomendado)

1. **Descargar** `control-de-agentes-setup.exe`
2. **Doble-clic**
3. ✅ **¡Listo!** Se abre automáticamente en http://localhost:3000

**Próximas veces:** Doble-clic en el acceso directo del Escritorio

### Opción B: Manual (Para Developers)

#### Requisitos

- **Node.js v18+** — [Descargar aquí](https://nodejs.org)
- **Git** (opcional) — [Descargar aquí](https://git-scm.com)

#### Pasos

1. **Clonar el proyecto**

```bash
git clone https://github.com/tuusuario/Control-de-Agentes-GC.git
cd control-de-agentes
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Descargar Playwright (para automación)**

```bash
npx playwright install chromium
```

4. **Iniciar**

```bash
npm start
```

Abrirá automáticamente en http://localhost:3000

---

## ✅ Verificar que Funciona

1. Abrir http://localhost:3000
2. Verás el panel con:
   - 🎛️ **Inicio** — Centro de control
   - 🤖 **Agentes** — Crear y gestionar agentes
   - 📁 **Historial** — Outputs generados
   - ⚙️ **Configuración** — Token GitHub

3. Ve a **⚙️ Configuración** y agrega tu GitHub Token

---

## 🆘 Problemas de Instalación

### ❌ "Node.js no se encuentra"

```powershell
# Verificar versión
node --version  # Debe ser v18 o superior

# Si ves error, descargar e instalar desde nodejs.org
# Luego reiniciar Windows
```

### ❌ "Puerto 3000 en uso"

```powershell
# Ver qué ocupa el puerto
netstat -ano | findstr :3000

# Matar el proceso
taskkill /PID <PID> /F

# O usar otro puerto:
$env:PORT = 4000
npm start
```

### ❌ "npm install falla"

```powershell
# Limpiar caché
npm cache clean --force

# Eliminar carpeta node_modules
Remove-Item -Recurse node_modules
Remove-Item package-lock.json

# Reintentar
npm install
```

### ❌ "Chromium no descarga"

```powershell
npx playwright install chromium --with-deps
```

---

## 📍 Próximo Paso

[→ Configurar Token GitHub](CONFIGURACION.md)
