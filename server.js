const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Manejo de errores global (evita que la ventana se cierre sin mensaje) ───
const IS_PKG = typeof process.pkg !== "undefined";

if (IS_PKG) {
  process.on("uncaughtException", (err) => {
    console.error("\n❌ Error fatal:", err.message);
    console.error(err.stack);
    console.log("\nPresioná ENTER para cerrar...");
    process.stdin.resume();
    process.stdin.once("data", () => process.exit(1));
  });
  process.on("unhandledRejection", (reason) => {
    console.error("\n❌ Error no manejado:", reason);
    console.log("\nPresioná ENTER para cerrar...");
    process.stdin.resume();
    process.stdin.once("data", () => process.exit(1));
  });
}

// ─── Base dirs: pkg empaqueta en snapshot virtual (read-only) ────────────────
// DATA_DIR = carpeta real junto al .exe (writable) para agents, config, chats, etc.
// APP_DIR  = __dirname (snapshot dentro del .exe) para archivos estaticos (panel/)
const DATA_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;
const APP_DIR = __dirname;

// En modo .exe: crear carpetas necesarias junto al ejecutable
if (IS_PKG) {
  for (const d of ["agents", "config", "config/skills", "chats", "outputs", "inputs"]) {
    const p = path.join(DATA_DIR, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  // Copiar config por defecto si no existe
  const defaults = ["config/active-agents.json", "config/agent-dirs.json"];
  for (const f of defaults) {
    const dest = path.join(DATA_DIR, f);
    const src = path.join(APP_DIR, f);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
  // Copiar skills globales por defecto
  const srcSkills = path.join(APP_DIR, "config", "skills");
  const destSkills = path.join(DATA_DIR, "config", "skills");
  if (fs.existsSync(srcSkills)) {
    for (const sk of fs.readdirSync(srcSkills)) {
      const dest = path.join(destSkills, sk);
      if (!fs.existsSync(dest)) fs.copyFileSync(path.join(srcSkills, sk), dest);
    }
  }

  // Crear acceso directo en el Escritorio (solo la primera vez)
  try {
    const desktopPath = path.join(os.homedir(), "Desktop");
    const shortcutPath = path.join(desktopPath, "Control de Agentes.lnk");
    if (!fs.existsSync(shortcutPath) && fs.existsSync(desktopPath)) {
      const exePath = process.execPath;
      const workDir = path.dirname(exePath);
      const ps = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $s.TargetPath = '${exePath.replace(/'/g, "''")}'; $s.WorkingDirectory = '${workDir.replace(/'/g, "''")}'; $s.Description = 'Control de Agentes - Panel de IA'; $s.Save()`;
      require("child_process").execSync(
        `powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`,
        { stdio: "ignore", timeout: 5000 },
      );
      console.log("   ✅ Acceso directo creado en el Escritorio");
    }
  } catch (e) {
    console.log("   ℹ️  No se pudo crear acceso directo:", e.message);
  }
}

require("dotenv").config({ path: path.join(DATA_DIR, ".env") });
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai").default;
const mammoth = require("mammoth");
const WordExtractor = require("word-extractor");
const multer = require("multer");
const { inspectUrl } = require("./playwright-inspector/inspector");

// ─── Abrir el navegador automáticamente al iniciar ───────────────────────────
function openBrowser(url) {
  const { exec, spawn } = require("child_process");
  const platform = process.platform;
  if (platform === "win32") {
    // En Windows, usar spawn con 'cmd' para mayor compatibilidad con pkg
    const child = spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    child.on("error", () => console.log(`   Abrí manualmente: ${url}`));
  } else {
    const cmd = platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, (err) => {
      if (err) console.log(`   Abrí manualmente: ${url}`);
    });
  }
}

// ─── Upload (doc/docx/pdf) ───────────────────────────────────────────────────
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/pdf",
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.match(/\.(doc|docx|pdf)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos .doc, .docx y .pdf"));
    }
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  express.static(path.join(APP_DIR, "panel"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-store");
    },
  }),
);

// ─── LLM Client ─────────────────────────────────────────────────────────────
let client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN || "placeholder",
});

// ─── (Agentes ahora son 100% file-based, sin prompts hardcodeados) ──────────


const ALLOWED_MODELS = new Set([
  // OpenAI
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/gpt-4.1-nano",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/o3-mini",
  "openai/o4-mini",
  // Meta
  "meta/llama-4-maverick-17b-128e-instruct-fp8",
  "meta/llama-4-scout-17b-16e-instruct",
  "meta/llama-3.3-70b-instruct",
  "meta/meta-llama-3.1-405b-instruct",
  "meta/meta-llama-3.1-8b-instruct",
  // DeepSeek
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1-0528",
  "deepseek/deepseek-v3-0324",
  // Mistral
  "mistral-ai/mistral-small-2503",
  "mistral-ai/mistral-medium-2505",
  "mistral-ai/codestral-2501",
  // xAI
  "xai/grok-3",
  "xai/grok-3-mini",
  // Microsoft
  "microsoft/phi-4",
  "microsoft/phi-4-mini-instruct",
  "microsoft/phi-4-reasoning",
  "microsoft/mai-ds-r1",
  // Cohere
  "cohere/cohere-command-a",
  "cohere/cohere-command-r-plus-08-2024",
  // IDs legacy
  "gpt-4o",
  "gpt-4o-mini",
  "DeepSeek-R1",
  "Phi-4",
  "Mistral-Large-2411",
  "Meta-Llama-3.3-70B-Instruct",
  "Meta-Llama-3.1-8B-Instruct",
  "o3-mini",
]);

// ─── YAML frontmatter parser ─────────────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(
    /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+([\s\S]*)/,
  );
  if (!match) return { data: {}, body: content };
  const data = {};
  const lines = match[1].split("\n").map((l) => l.replace(/\r$/, ""));
  let currentKey = null;
  for (const line of lines) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    const keyValue = line.match(/^([\w-]+):\s*(.*)$/);
    if (arrayItem && currentKey && Array.isArray(data[currentKey])) {
      data[currentKey].push(arrayItem[1].trim());
    } else if (keyValue) {
      currentKey = keyValue[1];
      const val = keyValue[2].trim();
      data[currentKey] = val === "" ? [] : val;
    }
  }
  return { data, body: match[2] };
}

// ─── Rutas de agentes extra ──────────────────────────────────────────────────
const EXTRA_DIRS_FILE = path.join(DATA_DIR, "config", "agent-dirs.json");

function readExtraDirs() {
  try {
    if (fs.existsSync(EXTRA_DIRS_FILE)) {
      return JSON.parse(fs.readFileSync(EXTRA_DIRS_FILE, "utf8"));
    }
  } catch (_) {}
  return [];
}

function writeExtraDirs(dirs) {
  const dir = path.dirname(EXTRA_DIRS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EXTRA_DIRS_FILE, JSON.stringify(dirs, null, 2), "utf8");
}

function getAllAgentDirs() {
  return [path.join(DATA_DIR, "agents"), ...readExtraDirs()];
}

// ─── SEGURIDAD: helper para validar que una ruta está dentro de un directorio base ──
function isSafePath(basePath, targetPath) {
  const resolved = path.resolve(targetPath);
  const base = path.resolve(basePath);
  return resolved.startsWith(base + path.sep) || resolved === base;
}

function findAgentPromptFile(agentId) {
  // Validar que el agentId no contenga path traversal
  const safeId = path.basename(agentId);
  for (const dir of getAllAgentDirs()) {
    const promptInSubfolder = path.join(dir, safeId, `${safeId}.prompt.md`);
    if (fs.existsSync(promptInSubfolder) && isSafePath(dir, promptInSubfolder))
      return promptInSubfolder;
    const agentInSubfolder = path.join(dir, safeId, `${safeId}.agent.md`);
    if (fs.existsSync(agentInSubfolder) && isSafePath(dir, agentInSubfolder))
      return agentInSubfolder;
    const agentFlat = path.join(dir, `${safeId}.agent.md`);
    if (fs.existsSync(agentFlat) && isSafePath(dir, agentFlat))
      return agentFlat;
  }
  return null;
}

function readAgentFromFile(agentFile, promptFile, agentsDir, defaultDir) {
  const { data, body } = parseFrontmatter(fs.readFileSync(agentFile, "utf8"));
  const folder = path.basename(agentFile, ".agent.md");
  const agentId = data.id || folder;
  let promptBody = body.trim();
  if (promptFile && fs.existsSync(promptFile)) {
    const { body: pb } = parseFrontmatter(fs.readFileSync(promptFile, "utf8"));
    promptBody = pb.trim();
  }
  return {
    id: agentId,
    name: data.name || folder,
    version: data.version || "1.0.0",
    description: data.description || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    icon: data.icon || "\uD83E\uDD16",
    flow: data.flow || "",
    hint: data.hint || "Pegá el contenido del documento aquí.",
    prompt: promptBody,
    sourceDir: agentsDir,
    isDefault: agentsDir === defaultDir,
    isFlat: true,
    agentFile,
  };
}

// ─── API: Directorios extra de agentes ──────────────────────────────────────
app.get("/api/agent-dirs", (req, res) => {
  res.json({ dirs: readExtraDirs() });
});

app.post("/api/agent-dirs", (req, res) => {
  const { dir } = req.body;
  if (!dir || typeof dir !== "string")
    return res.status(400).json({ error: "dir requerido" });
  const normalized = path.normalize(dir.trim());
  if (!path.isAbsolute(normalized))
    return res.status(400).json({ error: "Debe ser una ruta absoluta" });
  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isDirectory()) {
    return res
      .status(400)
      .json({ error: "La ruta no existe o no es una carpeta" });
  }
  const existing = readExtraDirs();
  if (existing.includes(normalized))
    return res.status(400).json({ error: "La ruta ya está registrada" });
  existing.push(normalized);
  writeExtraDirs(existing);
  res.json({ ok: true, dirs: existing });
});

app.delete("/api/agent-dirs", (req, res) => {
  const { dir } = req.body;
  if (!dir) return res.status(400).json({ error: "dir requerido" });
  const normalized = path.normalize(dir.trim());
  const updated = readExtraDirs().filter((d) => d !== normalized);
  writeExtraDirs(updated);
  res.json({ ok: true, dirs: updated });
});

// ─── Gestión de Agentes Activos (Server-side Persistence) ───────────────────
const ACTIVE_AGENTS_FILE = path.join(DATA_DIR, "config", "active-agents.json");

function readActiveAgents() {
  try {
    if (fs.existsSync(ACTIVE_AGENTS_FILE)) {
      const content = fs.readFileSync(ACTIVE_AGENTS_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (_) {}
  return [];
}

function writeActiveAgents(agents) {
  const dir = path.dirname(ACTIVE_AGENTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ACTIVE_AGENTS_FILE, JSON.stringify(agents, null, 2), "utf8");
}

function addActiveAgent(agentId) {
  const active = readActiveAgents();
  if (!active.includes(agentId)) {
    active.push(agentId);
    writeActiveAgents(active);
  }
}

function removeActiveAgent(agentId) {
  const active = readActiveAgents();
  const filtered = active.filter((id) => id !== agentId);
  writeActiveAgents(filtered);
}

function setActiveAgents(agentIds) {
  writeActiveAgents(
    agentIds.filter((id) => typeof id === "string" && id.trim().length > 0),
  );
}

// ─── API: Skills globales ─────────────────────────────────────────────────────
const GLOBAL_SKILLS_DIR = path.join(DATA_DIR, "config", "skills");

app.get("/api/skills", (req, res) => {
  try {
    if (!fs.existsSync(GLOBAL_SKILLS_DIR)) return res.json({ skills: [] });
    const files = fs.readdirSync(GLOBAL_SKILLS_DIR).filter((f) => f.endsWith(".skill.md"));
    const skills = files.map((f) => {
      const id = f.replace(/\.skill\.md$/, "");
      const content = fs.readFileSync(path.join(GLOBAL_SKILLS_DIR, f), "utf8");
      const firstLine = content.split("\n").find((l) => l.startsWith("# ")) || "";
      const name = firstLine.replace(/^# /, "").trim() || id;
      const descLine = content.split("\n").find((l, i) => i > 0 && l.trim() && !l.startsWith("#")) || "";
      return { id, name, description: descLine.trim().slice(0, 120) };
    });
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Listar agentes ─────────────────────────────────────────────────────
app.get("/api/agents", (req, res) => {
  const defaultDir = path.join(DATA_DIR, "agents");
  const allDirs = getAllAgentDirs();
  const result = [];
  const seenIds = new Set();
  for (const agentsDir of allDirs) {
    if (!fs.existsSync(agentsDir)) continue;
    try {
      const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const entry of entries.filter((e) => e.isDirectory())) {
        const folder = entry.name;
        const agentFile = path.join(agentsDir, folder, `${folder}.agent.md`);
        const promptFile = path.join(agentsDir, folder, `${folder}.prompt.md`);
        if (!fs.existsSync(agentFile)) continue;
        if (!isSafePath(agentsDir, agentFile)) continue;
        const { data, body } = parseFrontmatter(
          fs.readFileSync(agentFile, "utf8"),
        );
        const agentId = data.id || folder;
        if (seenIds.has(agentId)) continue;
        seenIds.add(agentId);
        let promptBody = body.trim();
        if (fs.existsSync(promptFile) && isSafePath(agentsDir, promptFile)) {
          const { body: pb } = parseFrontmatter(
            fs.readFileSync(promptFile, "utf8"),
          );
          promptBody = pb.trim();
        }
        result.push({
          id: agentId,
          name: data.name || folder,
          version: data.version || "1.0.0",
          description: data.description || "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          icon: data.icon || "\uD83E\uDD16",
          flow: data.flow || "",
          hint: data.hint || "Pegá el contenido del documento aquí.",
          prompt: promptBody,
          sourceDir: agentsDir,
          isDefault: agentsDir === defaultDir,
          isFlat: false,
          agentFile: agentFile,
        });
      }
      for (const entry of entries.filter(
        (e) => e.isFile() && e.name.endsWith(".agent.md"),
      )) {
        const agentFile = path.join(agentsDir, entry.name);
        if (!isSafePath(agentsDir, agentFile)) continue;
        const { data, body } = parseFrontmatter(
          fs.readFileSync(agentFile, "utf8"),
        );
        const folder = entry.name.replace(/\.agent\.md$/, "");
        const agentId = data.id || folder;
        if (seenIds.has(agentId)) continue;
        seenIds.add(agentId);
        result.push({
          id: agentId,
          name: data.name || folder,
          version: data.version || "1.0.0",
          description: data.description || "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          icon: data.icon || "\uD83E\uDD16",
          flow: data.flow || "",
          hint: data.hint || "Pegá el contenido del documento aquí.",
          prompt: body.trim(),
          sourceDir: agentsDir,
          isDefault: agentsDir === defaultDir,
          isFlat: true,
          agentFile: agentFile,
        });
      }
    } catch (_) {}
  }

  // ─── Gestión de agentes activos (server-side persistence) ───
  let activeIds = readActiveAgents();
  // Si no hay activos registrados, marcar todos como activos por defecto
  if (activeIds.length === 0) {
    activeIds = result.map((a) => a.id);
    setActiveAgents(activeIds);
  }
  const activeSet = new Set(activeIds);
  const resultWithActive = result.map((agent) => ({
    ...agent,
    isActive: activeSet.has(agent.id),
  }));

  res.json({ agents: resultWithActive });
});

// ─── API: Importar agente desde ruta local ───────────────────────────────────
app.post("/api/agents/import", (req, res) => {
  const { agentId, agentFile } = req.body;
  if (!agentId || !agentFile)
    return res.status(400).json({ error: "agentId y agentFile requeridos" });
  const normalizedFile = path.normalize(agentFile);
  // SEGURIDAD: validar que el archivo está dentro de una carpeta registrada
  const allowedDirs = getAllAgentDirs().map((d) => path.resolve(d));
  const isAllowed = allowedDirs.some((d) => isSafePath(d, normalizedFile));
  if (!isAllowed || !fs.existsSync(normalizedFile)) {
    return res
      .status(400)
      .json({ error: "Archivo no permitido o no encontrado" });
  }
  const localAgentsDir = path.join(DATA_DIR, "agents");
  const safeAgentId = path.basename(agentId).replace(/[^a-zA-Z0-9\-_]/g, "-");
  const targetDir = path.join(localAgentsDir, safeAgentId);
  if (!isSafePath(localAgentsDir, targetDir)) {
    return res.status(400).json({ error: "ID de agente inválido" });
  }
  try {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(
      normalizedFile,
      path.join(targetDir, `${safeAgentId}.agent.md`),
    );
    const srcDir = path.dirname(normalizedFile);
    const siblingPrompt = path.join(srcDir, `${safeAgentId}.prompt.md`);
    if (fs.existsSync(siblingPrompt) && isSafePath(srcDir, siblingPrompt)) {
      fs.copyFileSync(
        siblingPrompt,
        path.join(targetDir, `${safeAgentId}.prompt.md`),
      );
    }
    const skillsDir = path.join(targetDir, "skills");
    if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir);
    res.json({ ok: true, agentId: safeAgentId, targetDir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Importar agente desde archivos del browser ────────────────────────
app.post("/api/agents/import-files", (req, res) => {
  const { agentContent, promptContent, skillsContent, folderName } = req.body;
  if (!agentContent || !folderName) {
    return res
      .status(400)
      .json({ error: "agentContent y folderName son requeridos" });
  }
  const idMatch = agentContent.match(/^---[\r\n]+[\s\S]*?^id:\s*(.+)$/m);
  const rawId = idMatch ? idMatch[1].trim() : folderName;
  const agentId = rawId.replace(/[^a-zA-Z0-9\-_]/g, "-");
  const localAgentsDir = path.join(DATA_DIR, "agents");
  const targetDir = path.join(localAgentsDir, agentId);
  if (!isSafePath(localAgentsDir, targetDir)) {
    return res.status(400).json({ error: "ID de agente inválido" });
  }
  try {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(
      path.join(targetDir, `${agentId}.agent.md`),
      agentContent,
      "utf8",
    );
    if (promptContent) {
      fs.writeFileSync(
        path.join(targetDir, `${agentId}.prompt.md`),
        promptContent,
        "utf8",
      );
    }
    if (skillsContent && skillsContent.length > 0) {
      const skillsDir = path.join(targetDir, "skills");
      if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir);
      for (const skill of skillsContent) {
        const safeName = path
          .basename(skill.name)
          .replace(/[^a-zA-Z0-9\-_.]/g, "_");
        fs.writeFileSync(path.join(skillsDir, safeName), skill.content, "utf8");
      }
    } else {
      const skillsDir = path.join(targetDir, "skills");
      if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir);
    }
    res.json({ ok: true, agentId, targetDir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Chat con streaming SSE ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { agentId, messages, model: requestedModel } = req.body;

  if (!agentId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "agentId y messages son requeridos" });
  }

  // Verificar que hay token configurado
  if (!process.env.GITHUB_TOKEN) {
    return res
      .status(401)
      .json({
        error:
          "No hay GITHUB_TOKEN configurado. Andá a ⚙️ Configuración para ingresarlo.",
      });
  }

  const systemPrompt = (() => {
    const promptFile = findAgentPromptFile(agentId);
    if (promptFile) {
      const { body } = parseFrontmatter(fs.readFileSync(promptFile, "utf8"));
      return body.trim();
    }
    return null;
  })();

  if (!systemPrompt) {
    return res.status(400).json({ error: `Agente desconocido: ${agentId}` });
  }

  // ─── Inyectar skills del agente en el system prompt ──────────────────────
  const agentData = (() => {
    const agentFile = findAgentPromptFile(agentId)?.replace(/\.prompt\.md$/, ".agent.md");
    if (agentFile && fs.existsSync(agentFile)) {
      const { data } = parseFrontmatter(fs.readFileSync(agentFile, "utf8"));
      return data;
    }
    // Buscar .agent.md directo
    for (const dir of getAllAgentDirs()) {
      const agentFileDirect = path.join(dir, agentId, `${agentId}.agent.md`);
      if (fs.existsSync(agentFileDirect)) {
        const { data } = parseFrontmatter(fs.readFileSync(agentFileDirect, "utf8"));
        return data;
      }
    }
    return {};
  })();

  const agentSkills = Array.isArray(agentData.skills) ? agentData.skills : [];
  const skillBlocks = [];
  for (const skillId of agentSkills) {
    const safeSkillId = path.basename(skillId).replace(/[^a-zA-Z0-9\-_]/g, "-");
    // 1. Skill global en config/skills/
    const globalSkillFile = path.join(DATA_DIR, "config", "skills", `${safeSkillId}.skill.md`);
    // 2. Skill local en agents/{agentId}/skills/
    const localSkillFile = path.join(DATA_DIR, "agents", agentId, "skills", `${safeSkillId}.skill.md`);
    let skillContent = null;
    if (fs.existsSync(globalSkillFile)) {
      skillContent = fs.readFileSync(globalSkillFile, "utf8");
    } else if (fs.existsSync(localSkillFile)) {
      skillContent = fs.readFileSync(localSkillFile, "utf8");
    }
    if (skillContent) {
      skillBlocks.push(`\n\n---\n## Skill: ${safeSkillId}\n${skillContent.trim()}`);
    }
  }
  const finalSystemPrompt = systemPrompt
    + (skillBlocks.length > 0 ? skillBlocks.join("") : "")
    + getInputsContext();

  const model = ALLOWED_MODELS.has(requestedModel)
    ? requestedModel
    : "openai/gpt-4o";

  const RESTRICTED_MODELS = new Set([
    "deepseek/deepseek-r1",
    "deepseek/deepseek-r1-0528",
    "microsoft/mai-ds-r1",
    "xai/grok-3",
    "xai/grok-3-mini",
    "openai/o3-mini",
    "openai/o4-mini",
    "DeepSeek-R1",
    "o3-mini",
  ]);
  const LARGE_CONTEXT_MODELS = new Set([
    "openai/gpt-4.1",
    "openai/gpt-4.1-mini",
    "openai/gpt-4.1-nano",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "meta/llama-4-maverick-17b-128e-instruct-fp8",
    "meta/llama-4-scout-17b-16e-instruct",
    "meta/meta-llama-3.1-405b-instruct",
    "gpt-4o",
    "gpt-4o-mini",
  ]);

  let tokenLimit;
  if (RESTRICTED_MODELS.has(model)) tokenLimit = 3000;
  else if (LARGE_CONTEXT_MODELS.has(model)) tokenLimit = 60000;
  else tokenLimit = 15000;

  const MAX_HISTORY_CHARS = tokenLimit * 4;
  const MAX_SINGLE_MSG_CHARS = (tokenLimit - 1000) * 4;

  let trimmedMessages = messages.map((m) => {
    if (m.content && m.content.length > MAX_SINGLE_MSG_CHARS) {
      return {
        ...m,
        content:
          m.content.substring(0, MAX_SINGLE_MSG_CHARS) +
          "\n\n[... documento truncado por límite del modelo ...]",
      };
    }
    return m;
  });

  while (trimmedMessages.length > 1) {
    const totalChars =
      trimmedMessages.reduce((sum, m) => sum + (m.content || "").length, 0) +
      finalSystemPrompt.length;
    if (totalChars <= MAX_HISTORY_CHARS) break;
    trimmedMessages.shift();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: [{ role: "system", content: finalSystemPrompt }, ...trimmedMessages],
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = "";
    let usage = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      if (chunk.usage) usage = chunk.usage;
    }

    console.log(
      `[${agentId}] model=${model} | prompt=${usage?.prompt_tokens} completion=${usage?.completion_tokens} total=${usage?.total_tokens}`,
    );
    res.write(
      `data: ${JSON.stringify({ done: true, fullContent, usage, model })}\n\n`,
    );
    res.end();
  } catch (err) {
    console.error("Error llamando a GitHub Models:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── API: Guardar output como .md ───────────────────────────────────────────
app.post("/api/save", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content)
    return res.status(400).json({ error: "filename y content son requeridos" });
  const safeName = filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^\./, "");
  const finalName = safeName.endsWith(".md") ? safeName : `${safeName}.md`;
  const outputsDir = path.join(DATA_DIR, "outputs");
  if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
  const outputPath = path.join(outputsDir, finalName);
  if (!isSafePath(outputsDir, outputPath))
    return res.status(400).json({ error: "Nombre de archivo inválido" });

  // Límite de outputs: conservar los últimos 100 archivos
  try {
    const files = fs
      .readdirSync(outputsDir)
      .filter((f) => f.endsWith(".md") || f.endsWith(".json"));
    if (files.length >= 100) {
      const sorted = files
        .map((f) => ({
          name: f,
          mtime: fs.statSync(path.join(outputsDir, f)).mtimeMs,
        }))
        .sort((a, b) => a.mtime - b.mtime);
      fs.unlinkSync(path.join(outputsDir, sorted[0].name));
    }
  } catch (_) {}

  try {
    fs.writeFileSync(outputPath, content, "utf8");
    res.json({ success: true, filename: finalName });
  } catch (err) {
    res.status(500).json({ error: `Error al guardar: ${err.message}` });
  }
});

// ─── API: Upload .doc / .docx / .pdf ────────────────────────────────────────
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        return res
          .status(400)
          .json({ error: "El archivo supera el límite de 50 MB" });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    try {
      let text = "";
      if (req.file.originalname.match(/\.docx$/i)) {
        const result = await mammoth.extractRawText({ path: req.file.path });
        text = result.value.trim();
      } else if (req.file.originalname.match(/\.doc$/i)) {
        const extractor = new WordExtractor();
        const doc = await extractor.extract(req.file.path);
        text = doc.getBody().trim();
      } else if (req.file.originalname.match(/\.pdf$/i)) {
        // Soporte PDF: intentar con pdf-parse si está disponible
        try {
          const pdfParse = require("pdf-parse");
          const pdfBuffer = fs.readFileSync(req.file.path);
          const pdfData = await pdfParse(pdfBuffer);
          text = pdfData.text.trim();
        } catch (pdfErr) {
          fs.unlinkSync(req.file.path);
          return res
            .status(422)
            .json({
              error: "Para leer PDFs instalá pdf-parse: npm install pdf-parse",
            });
        }
      } else {
        fs.unlinkSync(req.file.path);
        return res
          .status(422)
          .json({ error: "Solo se admiten archivos .doc, .docx y .pdf" });
      }
      fs.unlinkSync(req.file.path);
      if (!text)
        return res
          .status(422)
          .json({ error: "No se pudo extraer texto del documento" });
      res.json({ text, filename: req.file.originalname });
    } catch (e) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
      res
        .status(500)
        .json({ error: `Error al procesar el archivo: ${e.message}` });
    }
  });
});

// ─── API: Cuota de GitHub Models ─────────────────────────────────────────────
app.get("/api/quota", async (req, res) => {
  const model = req.query.model || "openai/gpt-4o-mini";
  if (!ALLOWED_MODELS.has(model))
    return res.status(400).json({ error: "Modelo no permitido" });
  try {
    const response = await fetch(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
        }),
      },
    );
    const h = response.headers;
    const allHeaders = {};
    h.forEach((v, k) => {
      if (k.startsWith("x-ratelimit") || k.startsWith("x-ms"))
        allHeaders[k] = v;
    });
    res.json({
      model,
      status: response.status,
      remaining_tokens:
        h.get("x-ratelimit-remaining-tokens") !== null
          ? parseInt(h.get("x-ratelimit-remaining-tokens"))
          : null,
      limit_tokens:
        h.get("x-ratelimit-limit-tokens") !== null
          ? parseInt(h.get("x-ratelimit-limit-tokens"))
          : null,
      remaining_requests:
        h.get("x-ratelimit-remaining-requests") !== null
          ? parseInt(h.get("x-ratelimit-remaining-requests"))
          : null,
      limit_requests:
        h.get("x-ratelimit-limit-requests") !== null
          ? parseInt(h.get("x-ratelimit-limit-requests"))
          : null,
      region: h.get("x-ms-region") || "",
      headers_found: allHeaders,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Playwright Inspector ───────────────────────────────────────────────
app.post("/api/inspect", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL requerida" });
  // Validar que sea una URL http/https
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res
        .status(400)
        .json({ error: "Solo se permiten URLs http o https" });
    }
  } catch {
    return res.status(400).json({ error: "URL inválida" });
  }
  try {
    const result = await inspectUrl(url);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({
        error: `Error al inspeccionar: ${err.message}. Verificá que la URL sea accesible.`,
      });
  }
});

// ─── API: Guardar JSON ───────────────────────────────────────────────────────
app.post("/api/save-json", (req, res) => {
  const { filename, data } = req.body;
  if (!filename || !data)
    return res.status(400).json({ error: "Faltan filename o data" });
  const safe =
    filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_").replace(/\.json$/i, "") +
    ".json";
  const outputsDir = path.join(DATA_DIR, "outputs");
  if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
  const filePath = path.join(outputsDir, safe);
  if (!isSafePath(outputsDir, filePath))
    return res.status(400).json({ error: "Nombre inválido" });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  res.json({ ok: true, filename: safe });
});

// ─── API: Outputs ────────────────────────────────────────────────────────────
app.get("/api/outputs", (req, res) => {
  const outputsDir = path.join(DATA_DIR, "outputs");
  try {
    const files = fs
      .readdirSync(outputsDir)
      .filter((f) => f.endsWith(".md") || f.endsWith(".json"))
      .map((f) => {
        const stat = fs.statSync(path.join(outputsDir, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json({ files });
  } catch {
    res.json({ files: [] });
  }
});

app.get("/api/outputs/:filename", (req, res) => {
  const safe = path
    .basename(req.params.filename)
    .replace(/[^a-zA-Z0-9\-_\.]/g, "_");
  const outputsDir = path.join(DATA_DIR, "outputs");
  const filePath = path.join(outputsDir, safe);
  if (!isSafePath(outputsDir, filePath))
    return res.status(403).json({ error: "No permitido" });
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Archivo no encontrado" });
  res.json({ content: fs.readFileSync(filePath, "utf8"), filename: safe });
});

app.delete("/api/outputs/:filename", (req, res) => {
  const safe = path
    .basename(req.params.filename)
    .replace(/[^a-zA-Z0-9\-_\.]/g, "_");
  const outputsDir = path.join(DATA_DIR, "outputs");
  const filePath = path.join(outputsDir, safe);
  if (!isSafePath(outputsDir, filePath))
    return res.status(403).json({ error: "No permitido" });
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "No encontrado" });
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

// ─── CONFIG / .env ───────────────────────────────────────────────────────────
const ENV_PATH = path.join(DATA_DIR, ".env");
const CONFIG_KEYS = [
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_TOKEN",
];

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) result[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return result;
}

function writeEnvFile(configObj) {
  const existing = readEnvFile();
  const merged = { ...existing, ...configObj };
  for (const k of Object.keys(merged)) {
    if (merged[k] === "") delete merged[k];
  }
  const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf8");
}

app.get("/api/config", (req, res) => {
  const env = readEnvFile();
  const masked = {};
  for (const key of CONFIG_KEYS) {
    const val = env[key] || "";
    masked[key] = val ? "***" + val.slice(-4) : "";
  }
  res.json({ config: masked, isConfigured: !!env.GITHUB_TOKEN });
});

app.post("/api/config", (req, res) => {
  const { config } = req.body;
  if (!config || typeof config !== "object")
    return res.status(400).json({ error: "config requerido" });
  const sanitized = {};
  for (const key of CONFIG_KEYS) {
    if (config[key] !== undefined && !String(config[key]).includes("***")) {
      sanitized[key] = String(config[key]).trim();
    }
  }
  try {
    writeEnvFile(sanitized);
    for (const [k, v] of Object.entries(sanitized)) {
      if (v) process.env[k] = v;
    }
    if (sanitized.GITHUB_TOKEN) {
      client = new OpenAI({
        baseURL: "https://models.github.ai/inference",
        apiKey: sanitized.GITHUB_TOKEN,
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MCP MANAGEMENT ──────────────────────────────────────────────────────────
const MCP_FILE = path.join(DATA_DIR, ".vscode", "mcp.json");

function readMcpFile() {
  try {
    if (fs.existsSync(MCP_FILE))
      return JSON.parse(fs.readFileSync(MCP_FILE, "utf8"));
  } catch (_) {}
  return { servers: {} };
}

function writeMcpFile(data) {
  const dir = path.dirname(MCP_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(MCP_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/mcp", (req, res) => {
  res.json(readMcpFile());
});

app.post("/api/mcp", (req, res) => {
  const { name, command, args, env: envVars } = req.body;
  if (!name || !command)
    return res.status(400).json({ error: "name y command requeridos" });
  const safeName = name.replace(/[^a-zA-Z0-9\-_]/g, "-");
  const data = readMcpFile();
  if (!data.servers) data.servers = {};
  data.servers[safeName] = {
    command,
    args: Array.isArray(args) ? args : [],
    env: envVars || {},
  };
  writeMcpFile(data);
  res.json({ ok: true, servers: data.servers });
});

app.delete("/api/mcp/:name", (req, res) => {
  const data = readMcpFile();
  if (data.servers) delete data.servers[req.params.name];
  writeMcpFile(data);
  res.json({ ok: true, servers: data.servers || {} });
});

// ─── AGENT CRUD ───────────────────────────────────────────────────────────────
app.post("/api/agents/create", (req, res) => {
  const { id, name, description, icon, flow, hint, prompt, skills } = req.body;
  if (!id || !name)
    return res.status(400).json({ error: "id y name son requeridos" });
  const safeId = id.replace(/[^a-zA-Z0-9\-_]/g, "-").toLowerCase();
  const agentDir = path.join(DATA_DIR, "agents", safeId);
  if (!isSafePath(path.join(DATA_DIR, "agents"), agentDir)) {
    return res.status(400).json({ error: "ID de agente inválido" });
  }
  if (fs.existsSync(agentDir))
    return res
      .status(409)
      .json({ error: `Ya existe un agente con ID "${safeId}"` });
  const skillsList = Array.isArray(skills) ? skills : [];
  const skillsBlock =
    skillsList.length > 0
      ? skillsList.map((s) => `  - ${s}`).join("\n")
      : "  []";
  const agentContent = `---\nname: ${name}\nid: ${safeId}\nversion: 1.0.0\ndescription: ${description || ""}\nicon: ${icon || "🤖"}\nflow: ${flow || ""}\nhint: ${hint || "Pegá el contenido del documento aquí."}\nskills:\n${skillsBlock}\n---\n\n${prompt || ""}\n`;
  const promptContent = `---\nagent: ${safeId}\nversion: 1.0.0\n---\n${prompt || ""}\n`;
  try {
    fs.mkdirSync(agentDir, { recursive: true });
    fs.mkdirSync(path.join(agentDir, "skills"), { recursive: true });
    fs.writeFileSync(
      path.join(agentDir, `${safeId}.agent.md`),
      agentContent,
      "utf8",
    );
    fs.writeFileSync(
      path.join(agentDir, `${safeId}.prompt.md`),
      promptContent,
      "utf8",
    );
    // ─── Agregar a la lista de agentes activos automáticamente ───
    addActiveAgent(safeId);
    res.json({ ok: true, agentId: safeId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/agents/:id", (req, res) => {
  const safeId = path.basename(req.params.id).replace(/[^a-zA-Z0-9\-_]/g, "-");
  const { name, description, icon, flow, hint, prompt, skills } = req.body;
  const agentDir = path.join(DATA_DIR, "agents", safeId);
  if (!isSafePath(path.join(DATA_DIR, "agents"), agentDir))
    return res.status(400).json({ error: "ID inválido" });
  if (!fs.existsSync(agentDir))
    return res.status(404).json({ error: "Agente no encontrado" });
  const skillsList = Array.isArray(skills) ? skills : [];
  const skillsBlock =
    skillsList.length > 0
      ? skillsList.map((s) => `  - ${s}`).join("\n")
      : "  []";
  const agentContent = `---\nname: ${name}\nid: ${safeId}\nversion: 1.0.0\ndescription: ${description || ""}\nicon: ${icon || "🤖"}\nflow: ${flow || ""}\nhint: ${hint || "Pegá el contenido del documento aquí."}\nskills:\n${skillsBlock}\n---\n\n${prompt || ""}\n`;
  const promptContent = `---\nagent: ${safeId}\nversion: 1.0.0\n---\n${prompt || ""}\n`;
  try {
    fs.writeFileSync(
      path.join(agentDir, `${safeId}.agent.md`),
      agentContent,
      "utf8",
    );
    fs.writeFileSync(
      path.join(agentDir, `${safeId}.prompt.md`),
      promptContent,
      "utf8",
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/agents/:id", (req, res) => {
  const safeId = path.basename(req.params.id).replace(/[^a-zA-Z0-9\-_]/g, "-");
  const agentDir = path.join(DATA_DIR, "agents", safeId);
  if (!isSafePath(path.join(DATA_DIR, "agents"), agentDir))
    return res.status(400).json({ error: "ID inválido" });
  if (!fs.existsSync(agentDir))
    return res.status(404).json({ error: "Agente no encontrado" });
  try {
    fs.rmSync(agentDir, { recursive: true, force: true });
    // ─── Remover de la lista de agentes activos ───
    removeActiveAgent(safeId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Actualizar lista de agentes activos (Gestionar / Server-side) ────────
app.post("/api/agents/active", (req, res) => {
  const { activeIds } = req.body;
  if (!Array.isArray(activeIds))
    return res.status(400).json({ error: "activeIds debe ser un array" });
  try {
    setActiveAgents(activeIds);
    res.json({ ok: true, activeIds: readActiveAgents() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── IMPORT FROM GITHUB ───────────────────────────────────────────────────────
app.post("/api/agents/import-github", async (req, res) => {
  const { repoUrl, token } = req.body;
  if (!repoUrl) return res.status(400).json({ error: "repoUrl requerido" });
  const urlMatch = repoUrl
    .trim()
    .match(/github\.com\/([^\/]+)\/([^\/\?#]+)(?:\/tree\/([^\/]+)\/?(.*))? /);
  if (!urlMatch)
    return res.status(400).json({ error: "URL de GitHub inválida." });
  const owner = urlMatch[1];
  const repo = urlMatch[2].replace(/\.git$/, "");
  const branch = urlMatch[3] || "main";
  const subdir = (urlMatch[4] || "").replace(/\/$/, "");
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "MissionControl/2.0",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const apiPath = subdir ? `${subdir}/` : "";
    const dirRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${apiPath}?ref=${branch}`,
      { headers },
    );
    if (!dirRes.ok) {
      if (dirRes.status === 404)
        return res.status(404).json({ error: "Repo o ruta no encontrada." });
      if (dirRes.status === 401 || dirRes.status === 403)
        return res
          .status(403)
          .json({ error: "Token inválido o sin permisos." });
      return res
        .status(dirRes.status)
        .json({ error: `GitHub API error: ${dirRes.status}` });
    }
    const files = await dirRes.json();
    if (!Array.isArray(files))
      return res
        .status(400)
        .json({
          error: "La URL no apunta a una carpeta con archivos de agente.",
        });
    const agentFile = files.find(
      (f) => f.name.endsWith(".agent.md") && f.type === "file",
    );
    if (!agentFile)
      return res
        .status(400)
        .json({
          error: "No se encontró ningún .agent.md en la ruta especificada.",
        });
    const agentContent = await (
      await fetch(agentFile.download_url, { headers })
    ).text();
    const idMatch = agentContent.match(/^id:\s*(.+)$/m);
    const agentId = (
      idMatch ? idMatch[1].trim() : agentFile.name.replace(/\.agent\.md$/, "")
    ).replace(/[^a-zA-Z0-9\-_]/g, "-");
    const localAgentDir = path.join(DATA_DIR, "agents", agentId);
    if (!isSafePath(path.join(DATA_DIR, "agents"), localAgentDir)) {
      return res.status(400).json({ error: "ID de agente inválido" });
    }
    if (fs.existsSync(localAgentDir))
      return res
        .status(409)
        .json({
          error: `Ya existe un agente con ID "${agentId}". Eliminalo primero.`,
        });
    fs.mkdirSync(localAgentDir, { recursive: true });
    fs.mkdirSync(path.join(localAgentDir, "skills"), { recursive: true });
    fs.writeFileSync(
      path.join(localAgentDir, `${agentId}.agent.md`),
      agentContent,
      "utf8",
    );
    const promptFile = files.find(
      (f) => f.name.endsWith(".prompt.md") && f.type === "file",
    );
    if (promptFile) {
      const txt = await (
        await fetch(promptFile.download_url, { headers })
      ).text();
      fs.writeFileSync(
        path.join(localAgentDir, `${agentId}.prompt.md`),
        txt,
        "utf8",
      );
    }
    const skillsDirEntry = files.find(
      (f) => f.name === "skills" && f.type === "dir",
    );
    if (skillsDirEntry) {
      const skillsRes = await fetch(skillsDirEntry.url, { headers });
      if (skillsRes.ok) {
        const skillFiles = await skillsRes.json();
        for (const sf of (skillFiles || []).filter((f) =>
          f.name.endsWith(".skill.md"),
        )) {
          const txt = await (await fetch(sf.download_url, { headers })).text();
          fs.writeFileSync(
            path.join(
              localAgentDir,
              "skills",
              sf.name.replace(/[^a-zA-Z0-9\-_.]/g, "_"),
            ),
            txt,
            "utf8",
          );
        }
      }
    }
    res.json({
      ok: true,
      agentId,
      message: `Agente "${agentId}" importado exitosamente desde GitHub.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── JIRA INTEGRATION ────────────────────────────────────────────────────────
function getJiraHeaders() {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_TOKEN;
  if (!email || !token) return null;
  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

app.get("/api/jira/test", async (req, res) => {
  const baseUrl = (process.env.JIRA_BASE_URL || "").replace(/\/$/, "");
  const headers = getJiraHeaders();
  if (!baseUrl || !headers)
    return res
      .status(400)
      .json({
        error:
          "Jira no configurado. Completá JIRA_BASE_URL, JIRA_EMAIL y JIRA_TOKEN en ⚙️ Configuración.",
      });
  try {
    const r = await fetch(`${baseUrl}/rest/api/3/myself`, { headers });
    if (!r.ok)
      return res
        .status(r.status)
        .json({
          error: `Jira respondió ${r.status}. Verificá las credenciales.`,
        });
    const user = await r.json();
    res.json({
      ok: true,
      displayName: user.displayName,
      email: user.emailAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/jira/projects", async (req, res) => {
  const baseUrl = (process.env.JIRA_BASE_URL || "").replace(/\/$/, "");
  const headers = getJiraHeaders();
  if (!baseUrl || !headers)
    return res.status(400).json({ error: "Jira no configurado" });
  try {
    const r = await fetch(
      `${baseUrl}/rest/api/3/project/search?maxResults=50`,
      { headers },
    );
    if (!r.ok)
      return res.status(r.status).json({ error: `Jira respondió ${r.status}` });
    const data = await r.json();
    res.json({
      projects: (data.values || []).map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/jira/issues", async (req, res) => {
  const baseUrl = (process.env.JIRA_BASE_URL || "").replace(/\/$/, "");
  const headers = getJiraHeaders();
  if (!baseUrl || !headers)
    return res.status(400).json({ error: "Jira no configurado" });
  const jql = req.query.jql || "assignee = currentUser() ORDER BY updated DESC";
  const maxResults = Math.min(parseInt(req.query.maxResults) || 20, 50);
  try {
    const body = JSON.stringify({
      jql,
      maxResults,
      fields: [
        "summary",
        "status",
        "assignee",
        "issuetype",
        "priority",
        "description",
      ],
    });
    const r = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: "POST",
      headers,
      body,
    });
    if (!r.ok)
      return res.status(r.status).json({ error: `Jira respondió ${r.status}` });
    const data = await r.json();
    const issues = (data.issues || []).map((i) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name,
      type: i.fields.issuetype?.name,
      priority: i.fields.priority?.name,
      description: i.fields.description?.content?.[0]?.content?.[0]?.text || "",
    }));
    res.json({ issues, total: data.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/jira/comment", async (req, res) => {
  const { issueKey, comment } = req.body;
  const baseUrl = (process.env.JIRA_BASE_URL || "").replace(/\/$/, "");
  const headers = getJiraHeaders();
  if (!baseUrl || !headers)
    return res.status(400).json({ error: "Jira no configurado" });
  if (!issueKey || !comment)
    return res.status(400).json({ error: "issueKey y comment requeridos" });
  try {
    const body = JSON.stringify({
      body: {
        type: "doc",
        version: 1,
        content: [
          { type: "paragraph", content: [{ type: "text", text: comment }] },
        ],
      },
    });
    const r = await fetch(`${baseUrl}/rest/api/3/issue/${issueKey}/comment`, {
      method: "POST",
      headers,
      body,
    });
    if (!r.ok)
      return res.status(r.status).json({ error: `Jira respondió ${r.status}` });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/jira/bug", async (req, res) => {
  const { projectKey, summary, description } = req.body;
  const baseUrl = (process.env.JIRA_BASE_URL || "").replace(/\/$/, "");
  const headers = getJiraHeaders();
  if (!baseUrl || !headers)
    return res.status(400).json({ error: "Jira no configurado" });
  if (!projectKey || !summary)
    return res.status(400).json({ error: "projectKey y summary requeridos" });
  try {
    const body = JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description || "" }],
            },
          ],
        },
        issuetype: { name: "Bug" },
      },
    });
    const r = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers,
      body,
    });
    if (!r.ok) {
      const errText = await r.text();
      return res
        .status(r.status)
        .json({ error: `Jira error ${r.status}: ${errText.slice(0, 200)}` });
    }
    const data = await r.json();
    res.json({ ok: true, key: data.key, url: `${baseUrl}/browse/${data.key}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Inputs (archivos de referencia para agentes) ────────────────────────────
const INPUTS_DIR = path.join(DATA_DIR, "inputs");
if (!fs.existsSync(INPUTS_DIR)) fs.mkdirSync(INPUTS_DIR, { recursive: true });

const inputUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// GET /api/inputs — listar archivos en inputs/
app.get("/api/inputs", (req, res) => {
  try {
    if (!fs.existsSync(INPUTS_DIR)) return res.json({ files: [] });
    const files = fs.readdirSync(INPUTS_DIR).filter((f) => !f.startsWith(".")).map((f) => {
      const stat = fs.statSync(path.join(INPUTS_DIR, f));
      return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
    });
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inputs/upload — subir archivo a inputs/
app.post("/api/inputs/upload", inputUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se envió archivo" });
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._\-\s()]/g, "_");
  const dest = path.join(INPUTS_DIR, safeName);
  if (!isSafePath(INPUTS_DIR, dest))
    return res.status(403).json({ error: "Nombre de archivo no permitido" });
  try {
    fs.copyFileSync(req.file.path, dest);
    fs.unlinkSync(req.file.path);
    res.json({ ok: true, name: safeName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inputs/:name — eliminar archivo de inputs/
app.delete("/api/inputs/:name", (req, res) => {
  const safeName = path.basename(req.params.name);
  const filePath = path.join(INPUTS_DIR, safeName);
  if (!isSafePath(INPUTS_DIR, filePath))
    return res.status(403).json({ error: "No permitido" });
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Archivo no encontrado" });
  try {
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inputs/:name/content — leer contenido de un archivo de inputs (texto)
app.get("/api/inputs/:name/content", (req, res) => {
  const safeName = path.basename(req.params.name);
  const filePath = path.join(INPUTS_DIR, safeName);
  if (!isSafePath(INPUTS_DIR, filePath))
    return res.status(403).json({ error: "No permitido" });
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Archivo no encontrado" });
  try {
    const content = fs.readFileSync(filePath, "utf8");
    res.json({ name: safeName, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: leer todos los inputs como contexto para inyectar en el prompt
function getInputsContext() {
  if (!fs.existsSync(INPUTS_DIR)) return "";
  const files = fs.readdirSync(INPUTS_DIR).filter((f) => !f.startsWith("."));
  if (files.length === 0) return "";
  const blocks = [];
  for (const f of files) {
    const fp = path.join(INPUTS_DIR, f);
    try {
      const stat = fs.statSync(fp);
      // Solo archivos de texto de hasta 500KB
      if (stat.size > 500 * 1024) {
        blocks.push(`\n### Archivo: ${f}\n(Archivo demasiado grande para inyectar: ${(stat.size / 1024).toFixed(0)} KB)`);
        continue;
      }
      const content = fs.readFileSync(fp, "utf8");
      blocks.push(`\n### Archivo: ${f}\n\`\`\`\n${content}\n\`\`\``);
    } catch {
      // No es texto legible, skip
    }
  }
  if (blocks.length === 0) return "";
  return `\n\n---\n## Archivos de referencia (inputs/)\nEl usuario tiene los siguientes archivos de referencia disponibles. Usalos como contexto si es relevante para la consulta:\n${blocks.join("\n")}`;
}

// ─── Chat History (persistencia local en disco) ──────────────────────────────
const CHATS_DIR = path.join(DATA_DIR, "chats");

function getChatFile(agentId) {
  const safeId = path.basename(agentId).replace(/[^a-zA-Z0-9\-_]/g, "-");
  return path.join(CHATS_DIR, `${safeId}.json`);
}

// GET /api/chats/:agentId — cargar historial de un agente
app.get("/api/chats/:agentId", (req, res) => {
  const chatFile = getChatFile(req.params.agentId);
  if (!isSafePath(CHATS_DIR, chatFile))
    return res.status(403).json({ error: "No permitido" });
  if (!fs.existsSync(chatFile))
    return res.json({ history: [], lastContent: "" });
  try {
    const data = JSON.parse(fs.readFileSync(chatFile, "utf8"));
    res.json(data);
  } catch {
    res.json({ history: [], lastContent: "" });
  }
});

// POST /api/chats/:agentId — guardar historial de un agente
app.post("/api/chats/:agentId", (req, res) => {
  const { history, lastContent, conversations, activeConvId } = req.body;
  if (!Array.isArray(history) && !Array.isArray(conversations))
    return res.status(400).json({ error: "Se requiere history o conversations" });
  const chatFile = getChatFile(req.params.agentId);
  if (!isSafePath(CHATS_DIR, chatFile))
    return res.status(403).json({ error: "No permitido" });
  try {
    if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });
    const data = conversations
      ? { conversations, activeConvId: activeConvId || null, savedAt: new Date().toISOString() }
      : { history, lastContent: lastContent || "", savedAt: new Date().toISOString() };
    fs.writeFileSync(
      chatFile,
      JSON.stringify(data, null, 2),
      "utf8",
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chats/:agentId — borrar historial de un agente
app.delete("/api/chats/:agentId", (req, res) => {
  const chatFile = getChatFile(req.params.agentId);
  if (!isSafePath(CHATS_DIR, chatFile))
    return res.status(403).json({ error: "No permitido" });
  if (fs.existsSync(chatFile)) fs.unlinkSync(chatFile);
  res.json({ ok: true });
});

// DELETE /api/chats — borrar historial de TODOS los agentes
app.delete("/api/chats", (req, res) => {
  try {
    if (fs.existsSync(CHATS_DIR)) {
      const files = fs
        .readdirSync(CHATS_DIR)
        .filter((f) => f.endsWith(".json"));
      files.forEach((f) => fs.unlinkSync(path.join(CHATS_DIR, f)));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Arranque del servidor ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🛸 Mission Control corriendo en http://localhost:${PORT}`);
  console.log(`   Panel: http://localhost:${PORT}/index.html\n`);

  // Wizard: avisar si no hay token configurado
  const env = readEnvFile();
  if (!env.GITHUB_TOKEN) {
    console.log("⚠️  No se detectó GITHUB_TOKEN.");
    console.log(
      "   El panel te guiará para configurarlo en la sección ⚙️ Configuración.\n",
    );
  }

  if (IS_PKG) {
    console.log("   (No cierres esta ventana mientras uses el panel)\n");
  }

  // Abrir el navegador automáticamente
  setTimeout(() => openBrowser(`http://localhost:${PORT}`), 1200);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ El puerto ${PORT} ya está en uso.`);
    console.error("   Cerrá la otra instancia o usá PORT=XXXX para cambiar.\n");
  } else {
    console.error("\n❌ Error al iniciar el servidor:", err.message);
  }
  if (IS_PKG) {
    console.log("Presioná ENTER para cerrar...");
    process.stdin.resume();
    process.stdin.once("data", () => process.exit(1));
  }
});
