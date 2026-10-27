# Cómo continuar el proyecto — Planeador de Sociales

Documento de traspaso para quien siga trabajando en el proyecto, sea una persona o un asistente de IA.
Estado al **27 de octubre de 2026**: **funcionando**, ya se generaron planes reales.

> Este archivo **no contiene claves ni códigos de acceso**. Las claves están guardadas en Vercel. Pídaselas a la administradora del proyecto, nunca por chat ni por correo.

---

## 1. Qué es

Página web con un chatbot que prepara **planes de clase de Ciencias Sociales para Colombia**. La estrategia es el análisis de fuentes históricas y cartográficas, con la estructura inicio, desarrollo y cierre, e incluye objetivo, competencias, conocimientos previos, actividades con tiempos, recursos, evaluación formativa, rúbrica y adaptaciones.

- Solo atiende planeación de Sociales: el **filtro de temas** rechaza lo demás.
- No inventa citas de DBA, estándares ni lineamientos. Marca las relaciones con **[Verificar en el documento oficial]**.
- Se entra con un **código de acceso**, uno por persona.

## 2. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Página publicada | https://chatbot-sociales.vercel.app |
| Código fuente (repositorio público) | https://github.com/CienciasSociales2026/chatbot-sociales |
| Publicación y variables secretas | Vercel → equipo **sociales1** → proyecto **chatbot-sociales** |
| Registro de errores del servidor | https://vercel.com/sociales1/chatbot-sociales/logs |
| Clave de la IA (Gemini) | Google AI Studio (https://aistudio.google.com/apikey), creada con una cuenta **personal** de Google, no la de la universidad |
| Carpeta local original | `C:\Users\PCMARIO2\Desktop\ChatBot Sociales` |
| Documentos de la exposición (Word) | `Exposicion\` dentro de la carpeta local. Git no los sube. |

## 3. Cómo está hecho

```
Navegador ──► index.html ──► /api/chat (servidor en Vercel) ──► IA (Gemini, o Claude)
               página          revisa el código de acceso         escribe el plan
                               y esconde la clave
```

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la página: ingreso con código, formulario (grado, tema, duración, contexto), chat, botones **Copiar** y **Descargar para Word**. Usa `marked` y `DOMPurify` desde cdnjs. Guarda la conversación en el navegador (localStorage). |
| `api/chat.js` | Función del servidor. Valida el código y la conversación (máximo 40 mensajes y 8000 caracteres por mensaje), elige la IA y envía la respuesta por partes (streaming). |
| `lib/instrucciones.js` | **Las instrucciones del asistente**: el filtro, la estructura del plan y las reglas sobre referentes. Aquí se cambia el comportamiento. |
| `lib/gemini.js` | Conexión con Gemini por REST (`streamGenerateContent`). Si un modelo responde 429, 500 o 503, prueba el siguiente. Da 3 vueltas con esperas de 0, 10 y 25 s. |
| `lib/claude.js` | Conexión con Claude (SDK `@anthropic-ai/sdk`), lista para usar más adelante. |
| `dev-server.js` | Servidor para probar en el computador. Sin clave funciona en **modo demostración**, con el código `prueba`. |
| `vercel.json` | Permite hasta 300 s por respuesta. |
| `README.md` | Guía paso a paso para crear las cuentas y publicar. |

### Variables de entorno (en Vercel → Settings → Environment Variables)

| Nombre | Valor | Obligatoria |
|---|---|---|
| `GEMINI_API_KEY` | Clave de Google AI Studio | Sí (mientras se use Gemini) |
| `CODIGOS_ACCESO` | Códigos separados por coma, sin espacios | Sí |
| `MODELO_GEMINI` | Lista de modelos separados por coma. Por defecto: `gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite` | No |
| `ANTHROPIC_API_KEY` | Clave de Claude. **Solo se usa si `GEMINI_API_KEY` está vacía.** | No |
| `MODELO` | Modelo de Claude. Por defecto `claude-opus-5-5`. Para gastar menos: `claude-haiku-5-5` o `claude-sonnet-5-5`. | No |

**Importante:** después de cambiar una variable hay que **volver a publicar**, con *Deployments → ⋯ → Redeploy* o subiendo cualquier cambio a GitHub.

## 4. Cómo hacer un cambio y publicarlo

1. Pedirle a la dueña del repositorio que lo invite como colaborador: GitHub → *Settings → Collaborators → Add people*.
2. Descargar el código:
   ```bash
   git clone https://github.com/CienciasSociales2026/chatbot-sociales.git
   ```
3. Probar en el computador (requiere Node.js 20 o superior):
   ```bash
   npm install
   npm run local
   ```
   Abrir http://localhost:3000. Sin archivo `.env`, funciona en modo demostración con el código `prueba`. Para usar la IA de verdad, copiar `.env.example` como `.env` y llenar la clave. El archivo `.env` **nunca** se sube: está en `.gitignore`.
4. Subir el cambio:
   ```bash
   git add -A
   git commit -m "Describir el cambio"
   git push
   ```
   **Vercel publica solo** en menos de un minuto. Se puede revisar en *Deployments*.

## 5. Problemas que ya pasaron (para no repetirlos)

| Síntoma | Causa | Solución |
|---|---|---|
| Todos los códigos dicen «incorrecto» | En Vercel, el **valor** de la variable quedó igual a su **nombre** | Editar el *Value*, no el *Key*, y volver a publicar |
| «Ocurrió un error al consultar la IA» | Error **503** de Google: modelo saturado | Ya hay reintentos y modelos de respaldo. Si persiste, revisar el registro en Vercel |
| La página no pasa del ingreso | Se abrió el archivo `index.html` local en vez del enlace publicado | Usar siempre https://chatbot-sociales.vercel.app |
| Google no deja crear la clave | La cuenta de la universidad bloquea proyectos de Google Cloud | Usar una cuenta personal de Google |
| `git push` se queda esperando | El Administrador de credenciales de Windows abre una ventana para elegir cuenta y queda escondida | La dirección del repositorio ya incluye el usuario (`https://CienciasSociales2026@github.com/...`). En otro computador, elegir la cuenta correcta o usar «Add a new account» |
| GitHub Pages no sirve | Expondría la clave de la IA | Por eso se publica en Vercel |

## 6. Decisiones tomadas

- **Gemini (gratis) y no Claude por ahora:** la API de Claude exige una recarga mínima de US$5 y el proyecto debía ser gratuito para la clase. El código de Claude está listo en `lib/claude.js`.
- **Códigos compartidos en lugar de cuentas de usuario:** es suficiente para 5 a 10 personas.
- **Repositorio público:** el código no tiene secretos.
- **Privacidad:** en la versión gratuita, Google puede usar las conversaciones para entrenar su IA. Hay que pedir a los usuarios que **no escriban datos personales de estudiantes**.

## 7. Pendientes y próximos pasos

- [ ] **Cambiar la clave de Gemini.** La actual quedó escrita en una conversación. Crear una nueva en AI Studio, borrar la anterior, actualizar `GEMINI_API_KEY` en Vercel y volver a publicar.
- [ ] Probar varios grados y temas, y ajustar `lib/instrucciones.js` si los planes salen muy largos o muy cortos.
- [ ] Si se pasa a muchos usuarios (ver el Word «Por qué monetizar»):
  - pasar a Claude (`ANTHROPIC_API_KEY` y borrar `GEMINI_API_KEY`);
  - crear cuentas individuales y límites de uso por persona;
  - agregar pasarela de pagos y política de datos (Ley 1581 de 2012);
  - pasar Vercel al plan **Pro** (el plan Hobby es solo para uso no comercial y no permite agregar otros miembros al equipo).

## 8. Para un asistente de IA que continúe el trabajo

- Responder y escribir en **español de Colombia**, en lenguaje sencillo: la dueña del proyecto no es programadora.
- **No poner claves ni códigos de acceso en el repositorio.** Es público.
- Antes de cambiar `lib/instrucciones.js`, mantener las reglas de no inventar referentes del MEN y el filtro de temas.
- Si una respuesta falla, revisar primero el registro de Vercel: los errores de la IA aparecen como `Error de Gemini: <código>`.
