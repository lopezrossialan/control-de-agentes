# Análisis de Documentos Funcionales

Reglas para interpretar y estructurar documentos de requerimientos.

## Secciones obligatorias del output
1. **Módulos identificados** — listado con nombre y responsabilidad
2. **Actores y Roles** — quién hace qué, con permisos si se mencionan
3. **Flujos por módulo** — principal, alternativo y de error para cada uno
4. **Reglas de negocio** — validaciones, restricciones, cálculos
5. **Precondiciones globales** — estado del sistema o usuario asumido
6. **Ambigüedades detectadas** — marcadas con ⚠️
7. **Resumen ejecutivo** — 3-5 oraciones del alcance global

## Criterios de ambigüedad (marcar con ⚠️)
- Flujo mencionado sin resultado esperado claro
- Rol sin permisos definidos
- Validación sin criterio explícito (ej: "contraseña segura" sin definir qué es segura)
- Número máximo/mínimo no especificado
- Caso de error sin mensaje ni comportamiento definido

## Prohibiciones
- No inventar funcionalidades no mencionadas en el documento
- No asumir implementaciones técnicas (framework, base de datos, etc.)
- No completar ambigüedades: siempre marcar con ⚠️ y documentar la duda
