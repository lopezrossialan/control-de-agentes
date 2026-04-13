# Playwright Locators

Reglas para escribir locators robustos en Playwright.

## Orden de prioridad de locators
1. `getByRole()` + opción `name` — preferido siempre
2. `getByLabel()` — para inputs con label asociado
3. `getByPlaceholder()` — como segunda opción para inputs
4. `getByText()` — para textos visibles únicos
5. `getByTestId()` — cuando hay atributo `data-testid` definido
6. CSS/XPath — SOLO como último recurso, comentar por qué

## Reglas de escritura
- Nunca usar índice numérico: `.nth(0)` es frágil; buscar locator más específico
- Para elementos dinámicos usar `.filter()` con condición de texto o atributo
- Agrupar locators de la misma página en un Page Object o fixture
- Siempre verificar con `await expect(locator).toBeVisible()` antes de interactuar

## Timeouts
- No setear timeouts menores a 5000ms en assertions de red
- Para animaciones usar `await page.waitForFunction()` en vez de `page.waitForTimeout()`

## Marcas TODO
- Comentar `// TODO: ajustar locator` donde el selector depende de datos dinámicos reales
