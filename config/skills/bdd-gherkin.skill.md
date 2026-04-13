# BDD & Gherkin

Reglas para escritura de escenarios Gherkin de alta calidad.

## Principios obligatorios
- Cada Feature debe incluir narrativa: `Como [rol] / Quiero [acción] / Para [beneficio]`
- Un Scenario por comportamiento concreto (no combinar múltiples flujos en uno)
- Preferir lenguaje del negocio, no técnico: "el usuario ve un mensaje de error" en vez de "el elemento #err-msg está visible"
- Steps reutilizables: Given/When/Then deben poder compartirse entre Scenarios
- Usar `Scenario Outline` + `Examples` cuando hay variaciones de datos

## Tags obligatorios
- `@smoke` → flujo feliz mínimo, ejecutar en cada deploy
- `@regression` → suite completa
- `@negative` → inputs inválidos, errores esperados
- `@pendiente` → escenario identificado pero aún sin implementar

## Prohibiciones
- No usar XPath ni CSS selectors en los steps (esos van en el código de pasos)
- No mezclar Given/When/Then en el mismo step
- No agregar implementación técnica en el .feature
