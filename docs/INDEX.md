# 📑 ÍNDICE DE DOCUMENTACIÓN

**Control de Agentes** es simple y está completamente documentado.

---

## 🚀 Inicio Rápido (Windows)

| Documento                         | Para quién            | Tiempo |
| --------------------------------- | --------------------- | ------ |
| [README.md](../README.md)         | Todos                 | 5 min  |
| [Instalación](INSTALACION.md)     | Nuevos usuarios       | 10 min |
| [Configuración](CONFIGURACION.md) | Primeras credenciales | 5 min  |

---

## 🤖 Creando Agentes

| Documento                          | Contenido                      |
| ---------------------------------- | ------------------------------ |
| [Guía de Agentes](GUIA_AGENTES.md) | Cómo crear y gestionar agentes |
| [Tutoriales](TUTORIALES.md)        | Ejemplos prácticos             |

---

## 🆘 Problemas

| Necesitas...           | Lee...                                               |
| ---------------------- | ---------------------------------------------------- |
| Tu token no funciona   | [Solucionar Problemas](SOLUCIONAR_PROBLEMAS.md)      |
| Se congela el servidor | [Solucionar Problemas](SOLUCIONAR_PROBLEMAS.md)      |
| ¿Cómo hago X?          | [FAQ](SOLUCIONAR_PROBLEMAS.md#-preguntas-frecuentes) |

---

## 👨‍💻 Para Desarrolladores

| Documento                         | Tema                 |
| --------------------------------- | -------------------- |
| [Arquitectura](ARQUITECTURA.md)   | Cómo está construido |
| [API Reference](API_REFERENCE.md) | Endpoints REST       |

---

## 📦 Cómo Está Organizado

```
mission-control/
│
├── 📖 README.md                    ← Comienza aquí
│
├── 📚 docs/                        ← TODA la documentación
│   ├── INDEX.md                    ├─ Estás aquí
│   ├── INSTALACION.md              ├─ Cómo instalar
│   ├── CONFIGURACION.md            ├─ Setup token
│   ├── GUIA_AGENTES.md             ├─ Qué hace cada agente
│   ├── TUTORIALES.md               ├─ Paso a paso
│   ├── SOLUCIONAR_PROBLEMAS.md     ├─ FAQ & troubleshooting
│   ├── ARQUITECTURA.md             ├─ Cómo está hecho
│   ├── DOCKER_OPTIMIZACIONES.md    ├─ Docker, perf, seguridad
│   └── API_REFERENCE.md            └─ Endpoints (próximamente)
│
├── 🛠️ scripts/                      ← Ejecutables
│   ├── start.bat                   ├─ Doble-clic (Windows)
│   ├── start.sh                    ├─ Terminal (Mac/Linux)
│   ├── launcher.js                 ├─ Auto-launcher
│   └── build-exe.js                └─ Compilar .exe
│
├── 📦 assets/                       ← Recursos
│   └── PRESENTACION.pptx            └─ Diapositivas
│
├── 🤖 agents/                       ← 4 agentes especializados
├── 🖥️ panel/                        ← Frontend web
├── ⚙️ config/                       ← Configuración
├── 📤 outputs/                      ← Archivos generados
├── 📥 inputs/                       ← Documentos a procesar
└── [resto del proyecto...]
```

---

## 🎯 Por Escenario

### "Acabo de descargar, ¿qué hago?"

1. Lee [README.md](../README.md) (5 min)
2. Sigue [Instalación](INSTALACION.md) (10 min)
3. Configura [Token GitHub](CONFIGURACION.md) (5 min)
4. ¡Listo! Empieza con los tutoriales

### "Quiero analizar mi documentación"

→ [Guía de Agentes → Doc Interpreter](GUIA_AGENTES.md#️-doc-interpreter-análisis)

### "Quiero generar tests automatizados"

→ [Guía de Agentes → Playwright](GUIA_AGENTES.md#️-playwright-agent-tests-automatizados)

### "¿Cómo creo mi propio agente?"

→ [Arquitectura → Agregar Agente Custom](ARQUITECTURA.md#cómo-agregar-un-agente-custom)

### "Algo está roto"

→ [Solucionar Problemas](SOLUCIONAR_PROBLEMAS.md)

### "Quiero entender el código"

→ [Arquitectura](ARQUITECTURA.md) + [Docker & Optimizaciones](DOCKER_OPTIMIZACIONES.md)

---

## 📊 Comparativa de Documentos

| Doc                   | Público | Long  | Tema        |
| --------------------- | ------- | ----- | ----------- |
| README.md             | ✅      | Breve | Inicio      |
| INSTALACION           | ✅      | Media | Setup       |
| CONFIGURACION         | ✅      | Corta | Token       |
| GUIA_AGENTES          | ✅      | Larga | Agentes     |
| TUTORIALES            | ✅      | Larga | Paso a paso |
| SOLUCIONAR_PROBLEMAS  | ✅      | Larga | FAQ         |
| ARQUITECTURA          | 🏗️      | Larga | Dev         |
| DOCKER_OPTIMIZACIONES | 🏗️      | Larga | DevOps      |
| API_REFERENCE         | 🏗️      | Media | API         |

✅ = Para usuarios finales | 🏗️ = Para desarrolladores

---

## 🚀 Scripts y Ejecutables

### Doble-Clic (Windows)

```
scripts/start.bat
```

Qué hace:

- ✅ Verifica Node.js
- ✅ Instala dependencias
- ✅ Descarga Chromium
- ✅ Inicia servidor
- ✅ Abre navegador automáticamente

### Terminal (Mac/Linux)

```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

### Generar .EXE (para distribución)

```bash
# Instalar pkg
npm install -g pkg

# Generar
node scripts/build-exe.js

# Resultado: build/mission-control.exe (~45 MB)
# Distribución: Sin necesidad de instalar Node.js
```

---

## 📞 Ir Directamente a...

**Problemas técnicos:**

- Node.js no funciona → [Error Node.js](SOLUCIONAR_PROBLEMAS.md#-nodejs-no-encontrado)
- Puerto en uso → [Error Puerto](SOLUCIONAR_PROBLEMAS.md#-puerto-3000-en-uso)
- Token no va → [Error Token](SOLUCIONAR_PROBLEMAS.md#-github_token-no-detectado)

**Como usar:**

- Primer uso → [Instalación](INSTALACION.md)
- Setup token → [Configuración](CONFIGURACION.md)
- Qué agente usar → [Guía Agentes](GUIA_AGENTES.md)

**Para devs:**

- Entender arquitectura → [Arquitectura](ARQUITECTURA.md)
- Optimizaciones → [Docker & Optims](DOCKER_OPTIMIZACIONES.md)
- API → [API Reference](API_REFERENCE.md)

---

## ✅ Cobertura Documentación

- ✅ Instalación (4 métodos: Windows, Mac, Linux, Docker)
- ✅ Configuración (Token GitHub paso a paso)
- ✅ Agentes (4 especializados, casos de uso)
- ✅ Troubleshooting (15+ problemas comunes)
- ✅ FAQ (20+ preguntas)
- ✅ Arquitectura (Stack, APIs, Flujos)
- ✅ Docker (Setup, optimizaciones, seguridad)
- ✅ Scripts ejecutables (Batch, Shell, Node.js)

---

## 🎯 Hoja de Trucos

### Instalar

```bash
npm install && npm start
```

### Usar agentes

Panel → 🤖 Agentes → Seleccionar → Adjuntar doc

### Generar tests

🎭 Playwright → URL → Agentes genera `.spec.ts`

### Crear agente propio

🤖 Agentes → ➕ Crear → Rellenar y guardar

### Troubleshoot

Abre F12 → Network → Ver errores → [Solucionar Problemas](SOLUCIONAR_PROBLEMAS.md)

---

**Para comenzar:** [README.md](../README.md) → [Instalación](INSTALACION.md) → [Primeros pasos](CONFIGURACION.md)

---

_Última actualización: Abril 2026_  
_Documentación v2.0_
