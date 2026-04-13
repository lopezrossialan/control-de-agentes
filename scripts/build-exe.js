#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────
 * Build EXE for Mission Control v2.0
 *
 * Este script genera un único ejecutable .exe de Mission Control
 * sin necesidad de que los usuarios instalen Node.js.
 *
 * Usa @yao-pkg/pkg (fork activo del pkg original).
 * No requiere instalación global — se ejecuta con npx automáticamente.
 *
 * Uso:
 *   node scripts/build-exe.js
 *
 * Salida:
 *   build/mission-control.exe (~50-80 MB)
 * ─────────────────────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BUILD_DIR = path.join(__dirname, "..", "build");
const PROJECT_ROOT = path.join(__dirname, "..");
const EXE_NAME = "mission-control.exe";
const OUTPUT_PATH = path.join(BUILD_DIR, EXE_NAME);

console.log("\n");
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║  🛸 Mission Control - Build EXE                         ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("\n");

// 1. Crear carpeta build si no existe
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  console.log("   ✅ Carpeta build/ creada");
}

// 2. Asegurar que package.json tiene la config de pkg
console.log("\n📦 Configurando package.json...");
const pkgJsonPath = path.join(PROJECT_ROOT, "package.json");
const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
const pkgJsonBackup = JSON.stringify(packageJson, null, 2);

packageJson.bin = "server.js";
packageJson.pkg = {
  assets: [
    "panel/**/*",
    "agents/**/*",
    "config/**/*",
    "playwright-inspector/**/*",
    "node_modules/mammoth/**/*",
    "node_modules/word-extractor/**/*",
    "node_modules/pdf-parse/**/*",
  ],
  targets: ["node20-win-x64"],
  scripts: ["server.js"],
};

fs.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2));
console.log("   ✅ package.json actualizado");

// 3. Instalar dependencias si no existen
if (!fs.existsSync(path.join(PROJECT_ROOT, "node_modules"))) {
  console.log("\n📥 Instalando dependencias...");
  try {
    execSync("npm install", { cwd: PROJECT_ROOT, stdio: "inherit" });
    console.log("   ✅ Dependencias instaladas");
  } catch (err) {
    console.log("   ❌ Error instalando dependencias");
    fs.writeFileSync(pkgJsonPath, pkgJsonBackup);
    process.exit(1);
  }
}

// 4. Generar el EXE usando @yao-pkg/pkg via npx (no requiere instalación global)
console.log("\n🔨 Compilando EXE con @yao-pkg/pkg...");
console.log("   Salida: " + OUTPUT_PATH);
console.log("   Tamaño esperado: ~50-80 MB");
console.log("   (La primera vez puede tardar 3-5 min — descarga Node binario)\n");

try {
  execSync(
    `npx --yes @yao-pkg/pkg . --output "${OUTPUT_PATH}" --targets node20-win-x64 --compress Brotli`,
    {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    },
  );

  // Restaurar package.json al estado original
  fs.writeFileSync(pkgJsonPath, pkgJsonBackup);

  console.log("\n✅ EXE generado exitosamente!\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  🎉 Mission Control.exe lista para distribuir!          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");
  console.log("📁 Ubicación: " + OUTPUT_PATH);
  console.log("\n🚀 Para usar:");
  console.log("   1. Copiar mission-control.exe a cualquier carpeta");
  console.log("   2. Doble clic en el archivo");
  console.log("   3. Se abre automáticamente en http://localhost:3000\n");
  console.log("📋 El .exe incluye:");
  console.log("   ✅ Node.js v20 (integrado)");
  console.log("   ✅ Panel web completo");
  console.log("   ✅ Chromium para Playwright Inspector");
  console.log("   ✅ Agentes (se crean dinámicamente desde el panel)\n");
  console.log("📦 No requiere instalación de Node.js\n");
} catch (err) {
  fs.writeFileSync(pkgJsonPath, pkgJsonBackup);
  console.log("\n❌ Error compilando EXE:");
  console.log(err.message);
  process.exit(1);
}
