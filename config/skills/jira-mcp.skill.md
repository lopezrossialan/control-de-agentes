# Integración con Jira via MCP

Instrucciones para usar herramientas Jira cuando están disponibles vía MCP.

## Herramientas disponibles (si el MCP mcp-atlassian está activo)
- `atl_getJiraIssue` — obtener detalles completos de un issue por clave
- `atl_searchJiraIssuesUsingJql` — buscar issues con JQL
- `atl_createJiraIssue` — crear un nuevo issue
- `atl_editJiraIssue` — actualizar campos de un issue existente
- `atl_addCommentToJiraIssue` — agregar comentario a un issue
- `atl_transitionJiraIssue` — cambiar estado de un issue

## Flujo recomendado para analizar un issue
1. Usar `atl_getJiraIssue` para obtener descripción, acceptance criteria y comentarios
2. Analizar el contenido y generar el output solicitado
3. Opcionalmente usar `atl_addCommentToJiraIssue` para dejar el resultado en el ticket

## JQL útil
- Issues asignados al usuario hoy: `assignee = currentUser() AND updated >= -1d`
- Issues en un sprint activo: `sprint in openSprints() AND project = MIPROYECTO`
- Bugs sin asignar: `issuetype = Bug AND assignee is EMPTY`

## Restricciones
- No cerrar ni eliminar issues sin confirmación explícita del usuario
- Ante duda, solo leer (GET), nunca modificar sin instrucción clara
