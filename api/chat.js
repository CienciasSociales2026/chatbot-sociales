// Función de servidor (Vercel). Recibe la conversación desde la página,
// verifica el código de acceso y se la pasa a la IA.
// Las claves de la IA solo existen aquí, nunca en la página.
//
// Qué IA se usa:
//   - Si existe GEMINI_API_KEY  -> Gemini (gratis).
//   - Si no, y existe ANTHROPIC_API_KEY -> Claude (de pago).

import { INSTRUCCIONES } from "../lib/instrucciones.js";
import { responderConGemini } from "../lib/gemini.js";

const MAX_MENSAJES = 40;        // mensajes por conversación
const MAX_CARACTERES = 8000;    // por mensaje del docente

function codigosValidos() {
  return (process.env.CODIGOS_ACCESO || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function validarMensajes(mensajes) {
  if (!Array.isArray(mensajes) || mensajes.length === 0) return "No llegó ningún mensaje.";
  if (mensajes.length > MAX_MENSAJES)
    return "La conversación es muy larga. Pulse «Nueva conversación» para empezar otra.";
  for (let i = 0; i < mensajes.length; i++) {
    const m = mensajes[i];
    const rolEsperado = i % 2 === 0 ? "user" : "assistant";
    if (!m || m.role !== rolEsperado || typeof m.content !== "string" || !m.content.trim())
      return "El formato de la conversación no es válido.";
    if (m.role === "user" && m.content.length > MAX_CARACTERES)
      return `Cada mensaje puede tener máximo ${MAX_CARACTERES} caracteres.`;
  }
  if (mensajes[mensajes.length - 1].role !== "user") return "El último mensaje debe ser del docente.";
  return null;
}

async function elegirIA() {
  if (process.env.GEMINI_API_KEY) return responderConGemini;
  if (process.env.ANTHROPIC_API_KEY) return (await import("../lib/claude.js")).responderConClaude;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { codigo, mensajes, soloVerificar } = req.body || {};

  const codigos = codigosValidos();
  if (codigos.length === 0) {
    res.status(500).json({ error: "El servidor no tiene códigos de acceso configurados (CODIGOS_ACCESO)." });
    return;
  }
  if (typeof codigo !== "string" || !codigos.includes(codigo.trim())) {
    res.status(401).json({ error: "Código de acceso incorrecto." });
    return;
  }
  if (soloVerificar) {
    res.status(200).json({ ok: true });
    return;
  }

  const problema = validarMensajes(mensajes);
  if (problema) {
    res.status(400).json({ error: problema });
    return;
  }

  const responder = await elegirIA();
  if (!responder) {
    res.status(500).json({ error: "El servidor no tiene clave de IA configurada (GEMINI_API_KEY o ANTHROPIC_API_KEY)." });
    return;
  }

  let empezado = false;
  const escribir = (texto) => {
    if (!empezado) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
      empezado = true;
    }
    res.write(texto);
  };

  try {
    const fin = await responder({ instrucciones: INSTRUCCIONES, mensajes, escribir });
    if (fin === "bloqueado") escribir("\n\n_La IA no pudo responder esta solicitud. Intente reformularla._");
    else if (fin === "max_tokens") escribir("\n\n_La respuesta se cortó por longitud. Escriba «continúa» para seguir._");
    else if (!empezado) escribir("");
    res.end();
  } catch (err) {
    const mensaje = err?.message || "Ocurrió un error al consultar la IA.";
    if (!res.headersSent) {
      res.status(502).json({ error: mensaje });
    } else {
      res.write(`\n\n_${mensaje}_`);
      res.end();
    }
  }
}
