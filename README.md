# Planeador de Sociales

Página web con un asistente de IA que prepara planes de clase de Ciencias Sociales para Colombia. Usa como estrategia el análisis de fuentes históricas y cartográficas y respeta los referentes del MEN sin inventar citas.

- **Código:** se guarda en GitHub.
- **Página pública:** se publica gratis en Vercel, conectado a GitHub. Cada cambio que se suba a GitHub se publica solo.
- **IA:** por ahora **Gemini de Google (gratis)**. Ya está preparada para pasar a **Claude** (de pago) cuando se quiera. La clave de la IA queda guardada en Vercel y nunca llega al navegador.
- **Acceso:** solo entra quien tenga un código de acceso. Se puede dar un código distinto a cada persona.

> ¿Por qué no solo GitHub Pages? GitHub Pages solo sirve páginas estáticas. Allí la clave de la IA quedaría visible para cualquiera que abra la página. Vercel ejecuta la parte del servidor que esconde la clave.

---

## Paso a paso (una sola vez)

### 1. Cuenta de GitHub ✅
Ya creada.

### 2. Clave gratis de Gemini (Google AI Studio)
1. Entre a https://aistudio.google.com/apikey con una cuenta de Google.
   - Si el correo de la U de Caldas no lo deja entrar (algunas universidades bloquean AI Studio), use un **Gmail personal**.
2. Acepte los términos si se los pide.
3. Pulse **Create API key** (Crear clave de API). Si le pregunta por un proyecto, elija el que trae por defecto o cree uno nuevo.
4. **Copie la clave** (empieza por `AIza…`) y guárdela en un lugar seguro. **No la envíe por chat ni por correo.**

No pide tarjeta. El nivel gratuito tiene un límite de solicitudes por minuto y por día, suficiente para unas pocas personas. En el nivel gratuito, Google puede usar las conversaciones para mejorar sus productos: no escriba datos personales de estudiantes.

### 3. Subir el código a GitHub
Lo hace Claude con usted conectada a GitHub. Se crea un repositorio **privado** llamado `chatbot-sociales`.

### 4. Cuenta de Vercel y publicación
1. Entre a https://vercel.com/signup y elija **Hobby**. Pulse **Continue with GitHub** y autorice.
2. **Add New → Project** → importe `chatbot-sociales`.
3. Antes de pulsar Deploy, abra **Environment Variables** y agregue:
   | Nombre | Valor |
   |---|---|
   | `GEMINI_API_KEY` | la clave copiada en el paso 2 |
   | `CODIGOS_ACCESO` | los códigos separados por coma, ej.: `maria-7341,juan-2290,ana-5512` |
4. Pulse **Deploy**. Al terminar, Vercel muestra la dirección de la página (ej.: `https://chatbot-sociales.vercel.app`).

### 5. Compartir
Envíe a cada persona la dirección y **su** código. Para quitarle el acceso a alguien, borre su código en Vercel (**Settings → Environment Variables**) y pulse **Redeploy**.

---

## Pasar a Claude más adelante (opcional, de pago)
1. Cree la cuenta en https://platform.claude.com (elija **Individual**), cargue crédito en **Billing** (mínimo US$5) y cree una clave en **API Keys**.
2. En Vercel, agregue `ANTHROPIC_API_KEY` con esa clave y **borre** `GEMINI_API_KEY`. Pulse **Redeploy**.
3. Modelo por defecto: `claude-opus-5-5` (unos US$0,10 a US$0,25 por plan). Para gastar menos, agregue `MODELO` con `claude-haiku-5-5` (menos de US$0,01 por plan) o `claude-sonnet-5-5`.

## Cambiar el comportamiento del asistente
Las instrucciones (el filtro de temas, la estructura del plan y las reglas sobre DBA y estándares) están en [lib/instrucciones.js](lib/instrucciones.js). Sirven igual para Gemini y para Claude.

## Probar en el computador (opcional)
Requiere Node.js 20 o superior.
```bash
npm install
npm run local
```
Abra http://localhost:3000. Sin archivo `.env` funciona en **modo demostración** (código `prueba`, respuesta de ejemplo). Para usar la IA de verdad, copie `.env.example` como `.env` y llene la clave.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página: ingreso con código, formulario, chat, copiar y descargar para Word |
| `api/chat.js` | Servidor: valida el código y elige la IA |
| `lib/gemini.js` | Conexión con Gemini (gratis) |
| `lib/claude.js` | Conexión con Claude (de pago) |
| `lib/instrucciones.js` | Instrucciones del asistente |
| `dev-server.js` | Servidor de prueba local |
| `vercel.json` | Da hasta 5 minutos por respuesta |
