# Testing de APIs REST

Reglas para diseñar casos de prueba de endpoints REST.

## Estructura de un caso de test de API
- **Endpoint**: método + ruta (ej: `POST /api/users`)
- **Headers**: Content-Type, Authorization si aplica
- **Body**: payload de entrada (JSON/Form)
- **Resultado esperado**: código HTTP + estructura del response
- **Validaciones adicionales**: campos específicos del body de respuesta

## Códigos HTTP a cubrir por endpoint
| Escenario | Código esperado |
|-----------|----------------|
| Éxito | 200 / 201 / 204 |
| Input inválido | 400 |
| No autenticado | 401 |
| Sin permisos | 403 |
| No encontrado | 404 |
| Conflicto (ya existe) | 409 |
| Error del servidor | 500 |

## Casos obligatorios
- Flujo exitoso con datos válidos (happy path)
- Request sin campo requerido → 400
- Request con tipo de dato incorrecto → 400
- Request sin token / token expirado → 401
- Recurso inexistente → 404

## Variables y entornos
- Usar variables para base URL, tokens y IDs: `{{BASE_URL}}`, `{{TOKEN}}`
- No hardcodear IDs de recursos reales en los tests
- Documentar si el test requiere datos seed en la base de datos

## Seguridad básica
- Testear acceso a recursos de otro usuario (IDOR)
- Verificar que campos sensibles (password, token) no se devuelven en responses
