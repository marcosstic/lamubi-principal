# Planificación — Web Principal LA MUBI

## Objetivo
Web principal (hub premium B2B + comunidad) en HTML/CSS/JS puro, modular, SEO y performance.

## Dominios / Rutas
- Producción: https://www.lamubimcbo.com
- Registro (prod): https://registro.lamubimcbo.com
- Tickets (prod futuro): https://ticket.lamubimcbo.com
- Temporal: usar rutas locales en la web principal
  - /tickets
  - /registro
- Migración: mantener links a /tickets y /registro; cambiar redirects en Vercel a subdominios cuando existan.

## Identidad visual (fuente)
- Documento: DISENO-LAMUBI-GUIA.md
- Referencia efectos/animaciones: proyecto lamubi-qr
- Paleta: primary #bb1175, secondary #f43cb8, accent #f361e5, black #000, white #fff
- Tipografía: Montserrat

## Efectos/animaciones a replicar (lamubi-qr)
- Glow multicapa con drop-shadow (logo/Mubito)
- Partículas flotantes (accent/secondary)
- Cards con look 3D (tilt)
- CTA con pulso radial + sombras
- Shimmer sutil para detalles

## Mapa del sitio (Home)
- Hero (Mubito protagonista + CTAs /tickets y /registro)
- Sobre
- Portafolio (B2B)
- Experiencia
- Contacto
- Footer

## Portafolio (Instagram)
- 1 embed grande (featured): https://www.instagram.com/reel/DVXJ3DHjz9u/
- 6 cards (sin embed, con thumbnail + link externo):
  1) https://www.instagram.com/reel/DVj-MJ-DYYV/
  2) https://www.instagram.com/reel/DUyiJ8CD-ka/
  3) https://www.instagram.com/reel/DVKMh1NDfyf/
  4) https://www.instagram.com/reel/DVHJ7kZj1EX/
  5) https://www.instagram.com/p/DVbvwlmj4rQ/
  6) https://www.instagram.com/reel/DUbpBBCD8PS/

## Navegación
- Links: Sobre, Portafolio, Experiencia, Contacto
- CTAs: Tickets (/tickets), Registro (/registro)

## Arquitectura (sin frameworks)
- index.html
- src/styles: variables, base, layout, components, animations, responsive
- src/js: config/links.js, main.js, components/*, utils/*
