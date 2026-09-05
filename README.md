# CarpenterVeta — Frontend (Astro)

Sitio corporativo de carpintería a medida. Embudo de conversión en la home: hero, servicios, proceso, El Taller (multimedia), FAQ y contacto.

## Arranque

```bash
# Desde la raíz del monorepo
npm install
npm run dev

# O solo frontend
cd frontend
npm install
npm run dev
```

- Dev: http://localhost:4321  
- Build: `npm run build` → `frontend/dist/`

## Estructura

```
frontend/src/
  components/   Hero, Services, Process, Workshop, FAQ, Contact…
  layouts/      BaseLayout.astro
  pages/        index, servicios, taller
  styles/       global.css (tokens de marca)
```

## Directus (servicios)

`Services.astro` lee `GET {PUBLIC_DIRECTUS_URL}/items/servicios` y renderiza `titulo` + `descripcion`.

```bash
# frontend/.env (opcional; por defecto http://127.0.0.1:8055)
PUBLIC_DIRECTUS_URL=http://127.0.0.1:8055
```

En Directus, el rol **Public** necesita permiso de lectura en la colección `servicios`.

## El Taller (vídeo)

Edita `src/components/Workshop.astro`:

- `videoSrc` — MP4 en `/public/videos/`
- `youtubeEmbed` — URL de embed
- `social` — enlaces de redes
