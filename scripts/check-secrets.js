#!/usr/bin/env node
// =============================================================================
// scripts/check-secrets.js
// =============================================================================
// Escanea archivos tracked y staged en busca de secretos reales que no
// deberian estar en el repo. Falla (exit 1) si encuentra coincidencias.
//
// Uso:
//   node scripts/check-secrets.js
//   npm run security:check
// =============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const PLACEHOLDER_VALUES = [
  "__REPLACE_WITH_YOUR_SUPABASE_URL__",
  "__REPLACE_WITH_YOUR_SUPABASE_PUBLISHABLE_KEY__",
  "__REPLACE_WITH_YOUR_GOOGLE_OAUTH_CLIENT_ID__",
  "__REPLACE_WITH_YOUR_GEMINI_API_KEY__",
  "__LEAVE_EMPTY_USE_BACKEND__",
  "",
];

const RULES = [
  {
    name: "Supabase service_role key",
    pattern: /supabase[_-]?service[_-]?role[_-]?key\s*[:=]\s*["']?([A-Za-z0-9._-]{20,})["']?/i,
    group: 1,
    suggestion: "Mueve la service_role key a backend/.env y NO la expongas al frontend.",
  },
  {
    name: "Google Gemini API key",
    pattern: /gemini[_-]?api[_-]?key\s*[:=]\s*["']?([A-Za-z0-9_-]{20,})["']?/i,
    group: 1,
    suggestion: "Las claves de Gemini viven solo en backend/.env. El frontend debe llamar al backend.",
  },
  {
    name: "Supabase publishable/anon key visible en archivo no seguro",
    pattern: /VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*["']?(sb_publishable_[A-Za-z0-9_-]{10,})["']?/i,
    group: 1,
    placeholderOk: ["__REPLACE_WITH_YOUR_SUPABASE_PUBLISHABLE_KEY__"],
    suggestion: "Asegurate de que el archivo .env (no .env.example) no se commitea.",
  },
  {
    name: "Token de Google OAuth tipo acceso (ya deprecated)",
    pattern: /ya29\.[A-Za-z0-9_-]{40,}/,
    group: 0,
    suggestion: "Migrar a Authorization Code + PKCE. No guardes tokens en el repo.",
  },
  {
    name: "Bearer token hardcodeado",
    pattern: /Bearer\s+eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    group: 0,
    suggestion: "Los JWT de servicio deben ir al backend y rotarse periodicamente.",
  },
];

const IGNORE_PATH_PATTERNS = [
  /(^|[\/\\])node_modules([\/\\]|$)/,
  /(^|[\/\\])dist([\/\\]|$)/,
  /(^|[\/\\])build([\/\\]|$)/,
  /(^|[\/\\])\.git([\/\\]|$)/,
  /(^|[\/\\])backend[\/\\]\.venv([\/\\]|$)/,
  /(^|[\/\\])venv([\/\\]|$)/,
  /(^|[\/\\])coverage([\/\\]|$)/,
];

const ALLOWED_FILE_SUFFIXES = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", ".md", ".css", ".html", ".py", ".yml", ".yaml", ".toml", ".example"]);
const SKIP_FILENAMES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);

function listTrackedFiles() {
  try {
    const out = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function shouldScan(relPath) {
  if (IGNORE_PATH_PATTERNS.some((re) => re.test(relPath))) return false;
  if (SKIP_FILENAMES.has(relPath.split(/[\/\\]/).pop())) return false;
  const lastDot = relPath.lastIndexOf(".");
  if (lastDot === -1) return true;
  return ALLOWED_FILE_SUFFIXES.has(relPath.slice(lastDot).toLowerCase());
}

function scanContent(relPath, content) {
  const findings = [];
  for (const rule of RULES) {
    const re = new RegExp(rule.pattern, "gi");
    let match;
    while ((match = re.exec(content)) !== null) {
      const value = match[rule.group] ?? match[0];
      const isPlaceholder = PLACEHOLDER_VALUES.includes(value) || (rule.placeholderOk ?? []).includes(value);
      if (isPlaceholder) continue;
      findings.push({ rule: rule.name, value, suggestion: rule.suggestion });
    }
  }
  return findings;
}

function walkLocalFiles(dir, acc) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === "build" || entry === ".venv" || entry === "venv" || entry === "scratch") continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walkLocalFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function main() {
  const tracked = listTrackedFiles();
  const filesToScan = new Set(tracked);
  if (existsSync(join(ROOT, ".env"))) filesToScan.add(".env");
  if (existsSync(join(ROOT, "backend", ".env"))) filesToScan.add(join("backend", ".env"));

  const allFindings = [];
  for (const rel of filesToScan) {
    const norm = rel.split(/[\/\\]/).join(sep);
    if (!shouldScan(norm)) continue;
    let content;
    try {
      content = readFileSync(join(ROOT, norm), "utf8");
    } catch {
      continue;
    }
    const findings = scanContent(norm, content);
    for (const f of findings) allFindings.push({ file: norm, ...f });
  }

  if (allFindings.length === 0) {
    console.log("\u2713 security:check OK - no se detectaron secretos en archivos tracked");
    process.exit(0);
  }

  console.error("\u2717 security:check FALLO - posibles secretos encontrados:\n");
  for (const f of allFindings) {
    console.error(`  [${f.rule}] en ${f.file}`);
    console.error(`    valor: ${f.value.slice(0, 6)}\u2026${f.value.slice(-4)}`);
    console.error(`    accion: ${f.suggestion}\n`);
  }
  process.exit(1);
}

main();
