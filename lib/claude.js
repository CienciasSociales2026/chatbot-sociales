// Conexión con Claude (Anthropic) — opción de pago, para más adelante.

import Anthropic from "@anthropic-ai/sdk";
import { ErrorIA } from "./gemini.js";

let client = null;

export async function responderConClaude({ instrucciones, mensajes, escribir }) {
  client ??= new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
  try {
    const stream = client.beta.messages.stream({
      model: process.env.MODELO || "claude-opus-5-5",
      max_tokens: 32000,
      system: instrucciones,
      messages: mensajes.map((m) => ({ role: m.role, content: m.content })),
      cache_control: { type: "ephemeral" },
      output_config: { effort: "medium" },
      // Si el modelo declina una solicitud por sus filtros de seguridad,
      // la API reintenta sola con el modelo alterno que corresponda.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        escribir(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") return "bloqueado";
    if (final.stop_reason === "max_tokens") return "max_tokens";
    return "ok";
  } catch (err) {
    console.error("Error de Claude:", err?.status, err?.message);
    if (err instanceof Anthropic.AuthenticationError)
      throw new ErrorIA("La clave de Claude del servidor no es válida.", 401);
    if (err instanceof Anthropic.RateLimitError)
      throw new ErrorIA("Hay muchas solicitudes en este momento. Espere un minuto e intente de nuevo.", 429);
    if (err instanceof Anthropic.BadRequestError && /credit/i.test(err.message || ""))
      throw new ErrorIA("La cuenta de Claude se quedó sin saldo. Avise a la administradora.", 402);
    throw new ErrorIA("Ocurrió un error al consultar la IA. Intente de nuevo en un momento.", err?.status || 500);
  }
}
