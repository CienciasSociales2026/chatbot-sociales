// Conexión con la IA de Google (Gemini) — opción gratuita.
// Usa la API REST streamGenerateContent con eventos SSE.

const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class ErrorIA extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

// Envía la conversación y va llamando escribir(texto) a medida que llega.
// Devuelve el motivo de fin: "ok", "max_tokens" o "bloqueado".
export async function responderConGemini({ instrucciones, mensajes, escribir }) {
  const modelo = process.env.MODELO_GEMINI || "gemini-3.8-flash";
  const r = await fetch(`${URL_BASE}/${modelo}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instrucciones }] },
      contents: mensajes.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 32000 },
    }),
  });

  if (!r.ok) {
    const detalle = await r.text().catch(() => "");
    console.error("Error de Gemini:", r.status, detalle.slice(0, 500));
    if (r.status === 429)
      throw new ErrorIA("Se alcanzó el límite gratuito de la IA por ahora. Espere un minuto e intente de nuevo.", 429);
    if (r.status === 400 && /API key/i.test(detalle))
      throw new ErrorIA("La clave de Gemini del servidor no es válida.", 401);
    if (r.status === 403)
      throw new ErrorIA("La clave de Gemini no tiene permiso para usar este modelo.", 403);
    if (r.status === 404)
      throw new ErrorIA("El modelo de Gemini configurado no existe. Revise la variable MODELO_GEMINI.", 404);
    throw new ErrorIA("Ocurrió un error al consultar la IA. Intente de nuevo en un momento.", r.status);
  }

  let fin = "ok";
  let pendiente = "";
  const dec = new TextDecoder();

  const procesar = (linea) => {
    if (!linea.startsWith("data:")) return;
    const json = linea.slice(5).trim();
    if (!json) return;
    let trozo;
    try { trozo = JSON.parse(json); } catch { return; }
    if (trozo.promptFeedback?.blockReason) fin = "bloqueado";
    const cand = trozo.candidates?.[0];
    for (const p of cand?.content?.parts || []) {
      if (p.text && !p.thought) escribir(p.text);
    }
    const razon = cand?.finishReason;
    if (razon === "MAX_TOKENS") fin = "max_tokens";
    else if (razon && !["STOP", "FINISH_REASON_UNSPECIFIED"].includes(razon)) fin = "bloqueado";
  };

  for await (const bytes of r.body) {
    pendiente += dec.decode(bytes, { stream: true });
    const lineas = pendiente.split(/\r?\n/);
    pendiente = lineas.pop();
    lineas.forEach(procesar);
  }
  pendiente += dec.decode();
  if (pendiente) procesar(pendiente);
  return fin;
}
