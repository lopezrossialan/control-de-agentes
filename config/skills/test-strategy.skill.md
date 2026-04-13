# Estrategia de Testing

Framework de clasificación y cobertura de casos de prueba.

## Tipos de tests (usar en columna Tipo)
- **Funcional** — verifica que el flujo funciona según spec
- **Regresión** — cubre comportamiento que ya existía y no debe romperse
- **Integración** — puntos de contacto entre módulos o servicios externos
- **Borde** (Edge) — valores límite, máximos, mínimos, vacíos
- **Negativo** — inputs inválidos, acciones no permitidas, errores esperados

## Reglas de cobertura mínima por módulo
- Al menos 1 caso Funcional (flujo feliz)
- Al menos 1 caso Negativo (campo vacío, formato inválido, permiso denegado)
- Al menos 1 caso de Borde (valor máximo, string vacío, caracteres especiales)
- Casos de Integración cuando el módulo consume APIs o servicios externos

## IDs de casos
- Formato correlativo: `TC-001`, `TC-002`, etc.
- Si hay múltiples módulos: `AUTH-001`, `CART-001`, etc.

## Marcas especiales
- `[REQUIERE CLARIFICACIÓN]` — prerequisito ambiguo o resultado esperado no especificado
- `[BLOQUEADO]` — depende de otro ticket sin resolver

## Precondiciones
- Escribir en modo imperativo: "El usuario está logueado", "El carrito tiene ≥1 producto"
- Evitar precondiciones implícitas: explicitar el estado del sistema siempre
