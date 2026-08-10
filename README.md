# Portfolio API (Next.js)

Remplacement de Strapi : API publique compatible + back-office admin.

## Prérequis

- Node.js 20+
- PostgreSQL local (ex. base `portfolio_api`)

## Démarrage

```bash
npm install
# configure DATABASE_URL in .env then:
npm run db:setup
npm run dev
```

- API + admin : [http://localhost:1337](http://localhost:1337)
- Back-office : [http://localhost:1337/admin](http://localhost:1337/admin)
- Identifiants par défaut (`.env`) : `admin@portfolio.local` / `admin123`

`DATABASE_URL` exemple :

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/portfolio_api?schema=public"
```

## Front Vite

Dans `Portfolio-Augustin/.env` :

```env
VITE_STRAPI_URL=http://localhost:1337
```

Les endpoints publics gardent les mêmes chemins Strapi (`/api/projects`, `/api/articles`, etc.).

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Next.js sur le port **1337** |
| `npm run db:ensure` | Crée la base PostgreSQL si besoin |
| `npm run db:setup` | Crée la DB + schema + seed |
| `npm run db:seed` | Re-seed contenu + admin |
| `npm run db:import` | Importe `prisma/sqlite-export.json` vers Postgres |

## Contenu seed

Le seed réutilise `Portfolio-backend/src/seed/data.js` (projets, services, articles, etc.).
