# Notea

Plataforma educativa: cursos, cuadernos, juegos y repaso. El tutor publica; el estudiante practica.

**Demo:** [notea-6a76e.web.app](https://notea-6a76e.web.app)

## Qué incluye

- Biblioteca de materiales y cursos
- Editor de cuadernos (bloques, matemáticas, interactivos)
- Estudio y juegos (solo y lobby multijugador)
- Perfiles de creador y catálogo público
- Verificación de educadores
- Panel de administración

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Firebase Auth, Firestore, Storage, Hosting
- **UI:** Lucide, Motion, KaTeX

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

```bash
npm run build
npm run lint
npm test
```

No subas `.env`, reglas desplegadas a la fuerza ni secretos de Firebase. El proyecto de hosting es `notea-6a76e`.

## Licencia

Uso privado del autor. El código está publicado como portafolio.
