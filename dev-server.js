// Servidor solo para probar en el computador (npm run local).
// En internet la página la sirve Vercel; este archivo no se usa allá.
//
// - Si existe ANTHROPIC_API_KEY (en .env), habla con Claude de verdad.
// - Si no existe, entra en MODO DEMOSTRACIÓN: responde un plan de ejemplo
//   sin gastar saldo, para revisar cómo se ve la página.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PORT || 3000);

// Cargar .env sencillo (CLAVE=valor)
const envPath = path.join(dir, ".env");
if (fs.existsSync(envPath)) {
  for (const linea of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const demo = !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY;
if (demo && !process.env.CODIGOS_ACCESO) process.env.CODIGOS_ACCESO = "prueba";
const handler = demo ? null : (await import("./api/chat.js")).default;

// Adaptador mínimo para que el handler de Vercel funcione con node:http
function adaptar(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); };
  return res;
}

const PLAN_DEMO = `## Datos generales
- **Área:** Ciencias Sociales · **Grado:** 8.° · **Duración:** 55 minutos
- **Supuestos:** (respuesta de DEMOSTRACIÓN, no generada por la IA)

## Objetivo de aprendizaje
Explicar cambios del territorio comparando dos mapas de épocas distintas.

## Secuencia didáctica
| Momento | Tiempo | Actividad |
|---|---|---|
| Inicio | 10 min | Pregunta detonante y observación de un mapa antiguo. |
| Desarrollo | 35 min | Análisis en parejas de dos fuentes cartográficas. |
| Cierre | 10 min | Puesta en común y ticket de salida. |

_Así se verá la respuesta real cuando la página esté conectada a Claude._`;

async function api(req, res) {
  let cuerpo = "";
  for await (const trozo of req) cuerpo += trozo;
  try { req.body = JSON.parse(cuerpo || "{}"); } catch { req.body = {}; }
  adaptar(res);

  if (!demo) return handler(req, res);

  const { codigo, soloVerificar } = req.body;
  const codigos = process.env.CODIGOS_ACCESO.split(",").map((c) => c.trim());
  if (!codigos.includes(String(codigo || "").trim())) return res.status(401).json({ error: "Código de acceso incorrecto." });
  if (soloVerificar) return res.status(200).json({ ok: true });
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  for (const palabra of PLAN_DEMO.split(/(?<= )/)) {
    res.write(palabra);
    await new Promise((r) => setTimeout(r, 15));
  }
  res.end();
}

http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/chat")) return await api(req, res);
    if (req.url === "/" || req.url.startsWith("/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(path.join(dir, "index.html")));
    }
    res.writeHead(404).end("No encontrado");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end("Error");
  }
}).listen(PUERTO, () => {
  console.log(`Abra http://localhost:${PUERTO}`);
  console.log(demo
    ? `MODO DEMOSTRACIÓN (sin clave de IA). Código de acceso: ${process.env.CODIGOS_ACCESO}`
    : `Conectado a ${process.env.GEMINI_API_KEY ? "Gemini" : "Claude"}.`);
});
