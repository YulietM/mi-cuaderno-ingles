# Mi Cuaderno de Inglés

App interactiva para aprender inglés desde cero: sonidos del abecedario, palabras CVC, patrones de lectura, sight words, gramática, vocabulario personal, dictado y repaso automático de errores.

Es un **archivo HTML único** (`index.html`), sin backend, sin build, sin dependencias que instalar. Todo el progreso (vocabulario, puntajes, repaso) se guarda en el navegador de quien la use (localStorage), por dispositivo.

## Cómo ponerla en internet (elige una opción)

### Opción 1: GitHub Pages (gratis, con tu propio repo)

1. Crea un repositorio nuevo en GitHub (por ejemplo `mi-cuaderno-ingles`).
2. Sube estos archivos tal cual están (`index.html` y este `README.md`) a la raíz del repo.
   - Puedes arrastrarlos directo en la interfaz web de GitHub ("Add file" → "Upload files"), o con git:
     ```
     git init
     git add .
     git commit -m "Mi cuaderno de inglés"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/mi-cuaderno-ingles.git
     git push -u origin main
     ```
3. En el repo, ve a **Settings → Pages**.
4. En "Build and deployment", elige **Deploy from a branch**, rama `main`, carpeta `/root`.
5. Guarda. En un par de minutos va a quedar disponible en:
   ```
   https://TU_USUARIO.github.io/mi-cuaderno-ingles/
   ```

### Opción 2: Netlify Drop (gratis, sin necesidad de Git)

1. Entra a https://app.netlify.com/drop
2. Arrastra la carpeta completa (o solo `index.html`) a la página.
3. Netlify te da una URL pública al instante (algo como `nombre-random.netlify.app`).
4. Puedes crear cuenta después para conectarlo a un repo de GitHub y tener despliegue automático cada vez que subas cambios.

### Opción 3: Vercel

1. Sube el repo a GitHub (como en la Opción 1, pasos 1-2).
2. Entra a https://vercel.com, conecta tu cuenta de GitHub, e importa el repositorio.
3. Como es un sitio estático, no necesita configuración adicional — solo dale "Deploy".

## Notas técnicas

- El sonido usa la **Web Speech API** del navegador (`speechSynthesis`), así que la calidad de voz depende del navegador/dispositivo de quien la abra, no del hosting.
- Los datos (vocabulario agregado, puntajes, palabras en repaso) se guardan con `localStorage`, es decir, **quedan en el navegador de cada persona que la usa**, no se comparten entre dispositivos ni se ven en tu repo.
- No requiere HTTPS obligatorio, pero se recomienda (GitHub Pages, Netlify y Vercel ya lo dan gratis) porque algunos navegadores limitan `speechSynthesis` en sitios sin HTTPS.
- Puedes editar `index.html` directamente para agregar más palabras, patrones o temas de gramática — todo el contenido está en el bloque `<script>` al final del archivo, en objetos como `CVC`, `PATTERNS`, `SIGHT`, `GRAMMAR`.

## Instalar como ícono en el celular (PWA básica)

Una vez desplegada con tu propia URL:
- **Android (Chrome):** abre la URL → menú (⋮) → "Añadir a pantalla de inicio".
- **iPhone (Safari):** abre la URL → compartir (⬆️) → "Añadir a pantalla de inicio".

## Sincronizar progreso entre dispositivos con Google (opcional)

La app ya trae el código para iniciar sesión con Google y guardar tu vocabulario,
puntaje y repaso en la nube (Firebase), para que sea el mismo en el celular y en
la web. Está desactivado hasta que conectes tu propio proyecto de Firebase
(gratis). Pasos, una sola vez:

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) →
   **Crear proyecto** (puedes desactivar Google Analytics, no hace falta).
2. Dentro del proyecto: ícono **</>** ("Web") para agregar una app web. Ponle
   un nombre (ej. "mi-cuaderno-ingles") y créala. Firebase te muestra un
   objeto `firebaseConfig` con `apiKey`, `authDomain`, etc. — cópialo.
3. En `index.html`, busca `const firebaseConfig = {` (sección
   `SYNC CON GOOGLE`) y reemplaza los valores `"TU_..."` por los que te dio
   Firebase. Estos valores no son secretos, está bien que queden en el
   repo público.
4. En el menú lateral, ve a **Authentication → Sign-in method** → habilita
   **Google**.
5. En **Authentication → Settings → Authorized domains**, agrega el dominio
   donde publicaste la app (por ejemplo `tuusuario.github.io`).
6. En **Firestore Database → Crear base de datos** (modo producción, la
   región no importa mucho). Luego en la pestaña **Reglas**, reemplaza el
   contenido por:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /progress/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   y dale **Publicar**. Esto hace que cada quien solo pueda leer/escribir su
   propio progreso.
7. Sube el cambio a GitHub (o vuelve a desplegar). Al abrir la app verás el
   botón **"Iniciar sesión con Google"** junto al puntaje. Al iniciar sesión
   por primera vez en un dispositivo nuevo, la app combina lo que tenías
   localmente con lo que ya había en la nube (no se pierde nada).
