# 🪚 CarpenterVeta — Web Corporativa & Plataforma de Captación

> **Caso de Estudio de Rebranding:** Transformación de un modelo de artesanía personal hacia una estructura corporativa escalable mediante un canal digital automatizado.

🌐 **Demo en vivo:** [Ver sitio publicado en Netlify](https://app.netlify.com)

---

## Estrategia de Negocio & Rebranding

* **Objetivo de escalabilidad:** Desvincular la operativa diaria de la figura del fundador, proyectando una imagen de estudio/taller especializado capaz de asumir proyectos de mayor volumen.
* **Embudo de conversión sin fricción:** Diseño *mobile-first* orientado a la llamada a la acción directa mediante integración nativa de **WhatsApp** (`wa.me`).
* **Filtro de operaciones:** Módulos de *Proceso de Trabajo (4 Pasos)* y *Preguntas Frecuentes (FAQ)* para resolver dudas sobre plazos, materiales y garantías sin intervención humana.
* **Espacio Multimedia Adaptativo:** Sección preparada para contenido en vídeo del taller, Reels de Instagram y TikTok, alimentada desde Directus.

---

## Arquitectura Técnica & Infraestructura ($0/mes)

El sitio utiliza una arquitectura de **Generación de Sitios Estáticos (SSG)** que extrae los datos del CMS local durante la fase de compilación y los empaqueta en archivos estáticos listos para CDN. El visitante nunca accede a Directus: todo el contenido queda embebido en `/dist`.

| Capa | Tecnología | Función |
| :--- | :--- | :--- |
| **Frontend** | Astro 5 | Framework de alto rendimiento y cero JS por defecto. |
| **Headless CMS** | Directus 11 | Gestión dinámica de servicios, FAQ, vídeos e imágenes. |
| **Database** | PostgreSQL 16 | Motor de datos relacional orquestado con Docker. |
| **Hosting** | Netlify | Despliegue estático gratuito sin costes de servidor. |
| **Captación** | WhatsApp (`wa.me`) | CTA comercial con mensaje predefinido. |

### Flujo de trabajo estático

```text
[ Directus CMS Local ] ──(npm run build)──> [ /dist (Compilación Estática) ] ──> [ Netlify CDN ]
```

Durante el build:

* Se leen las colecciones `servicios`, `faq` y `videos`.
* Las imágenes de servicios se descargan y empaquetan en `dist/media/`.
* Los Reels de Instagram se renderizan con embed oficial / iframe reproducible in-page.
* Los CTA apuntan a WhatsApp (pestaña nueva), sin backend en producción.

---

## Estructura del Proyecto

```text
frontend/src/
├── components/       # Hero, Services, Process, Workshop, FAQ, Contact, Footer…
├── layouts/          # Layout principal con meta-tags SEO y Open Graph
├── lib/              # Directus, WhatsApp, redes sociales
├── pages/            # Rutas (Landing, Servicios, El Taller)
└── styles/           # Design tokens y estilos globales
```

---

## Cómo ejecutarlo

### 1. Requisitos previos

* Instancia local de Directus activa en el puerto **8055** (desde la raíz del monorepo: `docker compose up -d`).
* Node.js **22+**.
* Rol **Public** de Directus con lectura en `servicios`, `faq`, `videos` y archivos asociados.

### 2. Entorno de desarrollo

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321).

Opcional — `frontend/.env` (ver `.env.example`):

```bash
PUBLIC_DIRECTUS_URL=http://127.0.0.1:8055
```

### 3. Versión estática de producción

Con Directus en marcha:

```bash
npm run build      # genera dist/
npm run preview    # previsualiza el estático localmente
```

Despliega la carpeta `dist/` en Netlify (Drag & Drop o CI).

---

## Contacto de la marca

| Canal | Valor |
|-------|--------|
| WhatsApp | 652 391 831 |
| Email | carpenterveta05092026@gmail.com |
| Instagram | [@carpenter.veta](https://www.instagram.com/carpenter.veta/) |
| TikTok | [@carpenterveta](https://www.tiktok.com/@carpenterveta) |

---

*CarpenterVeta — Ingeniería y artesanía en madera. Proyectos a medida sin sorpresas.*
