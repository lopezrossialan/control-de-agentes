# ⚙️ Configuración Inicial

## Token GitHub (Obligatorio)

Mission Control necesita un **GitHub Token** para acceder a los modelos de IA. Es gratuito y toma 2 minutos.

---

## 🔑 Obtener tu GitHub Token

### Paso 1: Abrír GitHub Settings

1. Ve a [github.com/settings/tokens](https://github.com/settings/tokens)
2. Asegúrate de estar logueado en tu cuenta GitHub

### Paso 2: Generar Token Clásico

1. Click en **"Generate new token"**
2. Selecciona **"Generate new token (classic)"**

### Paso 3: Configurar Token

Rellenar:

| Campo             | Valor                                  |
| ----------------- | -------------------------------------- |
| **Token name**    | `mission-control` (o lo que prefieras) |
| **Expiration**    | `No expiration` (sin fecha límite)     |
| **Select scopes** | Solo `read:user` (solo lectura)        |

Dejar todo lo demás sin checkear.

### Paso 4: Generar

1. Click en **"Generate token"** (abajo)
2. **IMPORTANTE:** Copiar el token inmediatamente (formato: `ghp_...`)
   - Se mostrará solo una vez
   - Si lo pierdes, tienes que generar uno nuevo

---

## 🛠️ Configurar en Mission Control

### Opción A: Módal Automático (Recomendado)

1. Abrír http://localhost:3000
2. Verás un **banner naranja con ⚠️**
3. Click en el banner
4. Seguir los pasos del modal:
   - **Step 1:** Explicación
   - **Step 2:** Link a GitHub (click abre en nueva ventana)
   - **Step 3:** Pegar el token
   - **Step 4:** Guardar
5. ✅ Modal cierra y estás listo

### Opción B: Manual (Si el modal no aparece)

1. En el panel, ir a **⚙️ Configuración**
2. Sección **🤖 GitHub Copilot**
3. Campo de input: **GitHub Token**
4. Pegar el token (aparecerá como `•••••••`)
5. Click **💾 Guardar configuración**

---

## ✅ Verificar Que Funciona

### Opción 1: Panel

1. Ir a **⚡ Modelos LLM**
2. Click en **🔄 Actualizar** (esquina inferior)
3. Debería mostrarse tu cuota disponible

**Verás uno de estos:**

✅ **Acceso autorizado:** `8,000 tokens disponibles hoy`

❌ **Error:** `Acceso no autorizado` → [Ver solución abajo](#-problemas)

### Opción 2: Terminal

```bash
curl -H "Authorization: Bearer ghp_TUTOKEN" https://api.github.com/user
```

Debe devolver tu info de usuario (JSON).

---

## ❓ Problemas Comunes

### ❌ "Acceso no autorizado"

**Causas posibles:**

1. **Token incorrecto o expirado**
   - Regenerar token en [github.com/settings/tokens](https://github.com/settings/tokens)
   - Copiar token completo (sin espacios)

2. **Token sin acceso a GitHub Models**
   - GitHub Models está en "Public Beta"
   - Requiere invitación explícita
   - Solicitar acceso en [github.com/models](https://github.com/models)
   - Esperar correo de confirmación

3. **Token sin scopes necesarios**
   - Ir a token settings
   - Asegurarse que tiene al menos `read:user`

### ❌ "Token guardado como ....... (puntos)"

✅ **Esto es normal** (por seguridad, los tokens se enmascarán en pantalla)

Para verificar que fue guardado:

1. Ir a **⚡ Modelos LLM**
2. Click en **🔄 Actualizar**
3. Si aparece tu cuota → Token está guardado correctamente

---

## 🔒 Seguridad del Token

### ¿Dónde se guarda?

El token se guarda en el archivo `.env` **localmente en tu máquina**.

```
mission-control/
├── .env  ← Aquí (nunca subir a git)
└── .gitignore → Excluye .env automáticamente
```

### ¿Es seguro?

✅ **Sí:**

- Se guarda solo en tu máquina
- No se envía a internet (excepto a GitHub API)
- Nunca se comparte o registra
- Si lo comprometes, lo regeneras en [github.com/settings/tokens](https://github.com/settings/tokens)

### ¿Qué pueden hacer con mi token?

- Leer tu perfil público
- Usar tu cuota de GitHub Models

No puede:

- ❌ Hacer push a tus repos
- ❌ Acceder a repos privados
- ❌ Borrar nada

---

## 🎯 Próximos Pasos

Después de configurar exitosamente:

1. **Conocer los agentes** → [Guía de Agentes](GUIA_AGENTES.md)
2. **Primer tutorial** → [Tutoriales](TUTORIALES.md)
3. **Ayuda si algo falla** → [Solucionar Problemas](SOLUCIONAR_PROBLEMAS.md)

---

## 📞 Sigo con Problemas

Si aún hay error después de verificar:

1. Copiar el error exacto del panel
2. Abrir DevTools (F12 → Console)
3. Búscar "error" o "unauthorized"
4. [Crear issue en GitHub](https://github.com/tu-usuario/mission-control/issues) con:
   - Error exacto
   - Sistema operativo
   - Versión de Node.js
