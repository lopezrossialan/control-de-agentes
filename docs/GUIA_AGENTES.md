# 🤖 Guía de Agentes

## Los 4 Agentes Especializados

Mission Control incluye **4 agentes IA**, cada uno especializado en una tarea:

```
┌──────────────────────────────────────────────────────┐
│                  📄 DOC INTERPRETER                  │
│         Lee documentación y extrae requisitos        │
│                                                      │
│  Input: PDF, DOCX, DOC      Output: Requisitos      │
│  Tiempo: ~5-15 segundos     Ideal para: QA Lead     │
└──────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────┐
│  🧪 TEST   │  🎭 PLAYWRIGHT  │  🥒 GHERKIN         │
│  CASES     │  TESTS           │  BDD               │
│  Tab QA    │  Automation E2E  │  Behavior Driven   │
└──────────────────────────────────────────────────────┘
```

---

## 1️⃣ 📄 Doc Interpreter (Análisis)

**Propósito:** Extraer requisitos estructurados de documentación.

### ¿Qué sube?

- Documento PDF con especificaciones
- Documento WORD (.doc, .docx) con features
- O pegar texto directamente

**Máximo:** 50 MB

### ¿Qué retorna?

Análisis estructurado con:

```markdown
## Módulos del Sistema

- Autenticación
- Perfil de Usuario
- Dashboard
- Reportes

## Actores

- Admin (acceso total)
- Usuario Regular (acceso limitado)
- Guest (lectura solo)

## Flujos Principales

1. Login del usuario
   - Pre: Usuario no logueado
   - Post: Usuario en dashboard
   - Excepciones: Las 3 posibles

2. Cambiar password
   - ...

## Ambigüedades Detectadas

- ⚠️ "Notificar" no especifica por dónde
- ⚠️ Falta definir timeout de sesión
```

### Ejemplo Uso

```
Panel → 🤖 Agentes → 📄 Doc Interpreter
         → Adjuntar documento
         → Chat: "Analiza este documento de requerimientos"
         → Esperar respuesta
         → Descargar resultado
```

### ¿Para quién?

- 🎯 QA Leads: Entender los requerimientos
- 🎯 Product Managers: Clarificar features
- 🎯 Developers: Context para desarrollo

---

## 2️⃣ 🧪 Test Case General (Casos de Prueba)

**Propósito:** Generar matriz completa de casos de prueba.

### Entrada

- Documento original
- O resultado del Doc Interpreter

### Salida

Tabla Excel-friendly con:

| ID     | Título                     | Precondiciones                      | Pasos                                                | Resultado Esperado             | Tipo      |
| ------ | -------------------------- | ----------------------------------- | ---------------------------------------------------- | ------------------------------ | --------- |
| TC-001 | Login exitoso              | Usuario no logueado, URL disponible | 1. Ir a /login 2. Ingresar email 3. Click Login      | Usuario en dashboard           | Funcional |
| TC-002 | Login falla email inválido | Usuario no logueado                 | 1. Ir a /login 2. Ingresar email fake 3. Click Login | Mensaje error "Email inválido" | Negativo  |
| TC-003 | Session timeout            | Usuario logueado hace 1h            | 1. Esperar/simular timeout 2. Click                  | Redirigido a login             | Borde     |

### Tipos de Casos

- **Funcional:** Happy path, lo que debería funcionar
- **Negativo:** Casos fallidos, manejo de errores
- **Borde:** Edge cases, límites del sistema
- **Regresión:** Casos que ya pasaron antes

### Salida Ejemplo

```markdown
## Casos de Prueba - Módulo Checkout

### TC-001: Checkout exitoso

- Precondiciones: Usuario logueado, carrito con 1+ items
- Pasos:
  1. Click en "Ir a Checkout"
  2. Llenar dirección
  3. Seleccionar método envío
  4. Revisar resumen
  5. Click "Confirmar"
- Resultado esperado: Orden creada, email de confirmación enviado

### TC-002: Error si carrito vacío

- Precondiciones: Usuario logueado, carrito vacío
- Pasos:
  1. Intentar acceder a /checkout
- Resultado esperado: Redirige a /cart con mensaje "Carrito vacío"
```

### ¿Para quién?

- 🎯 QA Engineers: Documento formal para testing
- 🎯 Auditorías: Cobertura de pruebas
- 🎯 Compliance: Documentación de QA

---

## 3️⃣ 🎭 Playwright Agent (Tests Automatizados)

**Propósito:** Generar tests end-to-end en TypeScript/Playwright.

### Entrada

- Documento de requerimientos
- O resultado del Doc Interpreter
- URL de la aplicación a testear

### Salida

Archivo `.spec.ts` listo para ejecutar:

```typescript
// tests/checkout.spec.ts
import { test, expect } from "@playwright/test";

test("Usuario puede completar checkout exitosamente", async ({ page }) => {
  // Setup
  await page.goto("https://app.example.com/cart");

  // Ir a checkout
  await page.getByRole("button", { name: "Ir a Checkout" }).click();

  // Llenar dirección
  await page.getByLabel("Calle").fill("Main St 123");
  await page.getByLabel("Ciudad").fill("Buenos Aires");
  await page.getByLabel("ZIP").fill("1425");

  // Seleccionar envío
  await page.getByRole("radio", { name: "Express 24hs" }).check();

  // Confirmar
  await page.getByRole("button", { name: "Confirmar Compra" }).click();

  // Verificación
  await expect(page).toHaveURL("https://app.example.com/confirmation/success");
  await expect(
    page.getByRole("heading", { name: "Orden Confirmada" }),
  ).toBeVisible();
});

test("Carrito vacío muestra error", async ({ page }) => {
  await page.goto("https://app.example.com/cart/empty");
  const button = page.getByRole("button", { name: "Ir a Checkout" });
  await expect(button).toBeDisabled();
});
```

### Ejecutar Tests

1. Copiar archivo `.spec.ts` a tu proyecto
2. En tu repo:

```bash
npm install -D @playwright/test

# Primero inspecciona la app con Mission Control Inspector
# para sacar locators más precisos

# Ejecutar tests
npx playwright test

# Ver reporte HTML
npx playwright show-report
```

### ¿Qué Necesita?

- 📌 URL de la app a testear (ej: https://app.example.com)
- 📌 Casos de prueba o requerimientos
- 📌 Acceso a la aplicación (no debe pedir login complicado)

### ¿Para quién?

- 🎯 QA Automation: Tests CI/CD
- 🎯 Developers: TDD y feature testing
- 🎯 DevOps: Integración en pipelines

---

## 4️⃣ 🥒 Gherkin Agent (BDD)

**Propósito:** Generar features Gherkin para Cucumber/SpecFlow/Behave.

### Entrada

- Documento de requerimientos
- Historias de usuario

### Salida

Archivo `.feature` en formato Gherkin:

```gherkin
# features/checkout.feature
Feature: Proceso de Checkout

  Scenario: Usuario completa compra exitosamente
    Given que estoy en la página de carrito
    And mi carrito tiene al menos 1 artículo
    When hago click en "Ir a Checkout"
    And completo el formulario de dirección
    And selecciono método de envío
    And confirmo la compra
    Then debo ver "Orden confirmada"
    And debo recibir email de confirmación

  Scenario: No puedo chatear si carrito está vacío
    Given que tengo el carrito vacío
    When intento acceder a /checkout
    Then soy redirigido a /cart
    And veo mensaje "Tu carrito está vacío"

  Scenario: Promo code inválido muestra error
    Given que estoy en el checkout
    When ingreso código "INVALID2024"
    Then veo error "Código no válido"
    And el descuento no se aplica
```

### Integrar con Cucumber

**Node.js:**

```bash
npm install -D @cucumber/cucumber
npx cucumber-js
```

**Python (Behave):**

```bash
pip install behave
behave features/
```

**C# (SpecFlow):**

```bash
dotnet add SpecFlow
dotnet test
```

### Ventajas

- ✅ Escrito en lenguaje natural (no técnico)
- ✅ Lo entienden BA, QA, developers
- ✅ Especificación clara = test automático
- ✅ Fácil mantener y actualizar

### ¿Para quién?

- 🎯 Teams ágiles con BDD
- 🎯 BA → Developers feedback loop
- 🎯 Specification by Example

---

## 🔀 Flujo Recomendado

```
DOCUMENTACIÓN (PDF, WORD)
         ↓
     (Agente: Doc Interpreter)
         ↓
   REQUISITOS STRUTURADOS
         ↓
   ┌─────┴─────┬─────────────┐
   ↓           ↓             ↓
Test Cases  Playwright    Gherkin
(QA Focus) (Automation)   (BDD)
   ↓           ↓             ↓
Cobertura   Tests E2E    Features
```

---

## 📊 Comparativa de Agentes

| Agente             | Input     | Output     | Tiempo | Salida       |
| ------------------ | --------- | ---------- | ------ | ------------ |
| 📄 Doc Interpreter | PDF/DOCX  | Requisitos | 5-15s  | Markdown     |
| 🧪 Test Cases      | Req       | Tabla QA   | 15-30s | CSV/Markdown |
| 🎭 Playwright      | Req + URL | Tests TS   | 20-40s | .spec.ts     |
| 🥒 Gherkin         | Req       | Features   | 10-20s | .feature     |

---

## 💡 Tips

- **Empezar siempre con Doc Interpreter** para context
- **Usar Playwright Inspector** para extraer locators precisos
- **Combinar agentes**: Docs → Test Cases + Playwright + Gherkin
- **Revisar siempre** la salida ante de ejecutar

---

[← Atrás](CONFIGURACION.md) | [Tutoriales →](TUTORIALES.md)
