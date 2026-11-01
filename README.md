# KALASH & KUMKUM Admin

## Run locally

1. Copy `.env.example` to `.env.local`; set `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.
2. Configure `ADMIN_URL=http://localhost:3001` in the backend `.env`.
3. Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` (6–128 characters) in that file.
4. From `kk-backend`, run `npm run admin:create`.
5. Start the API with `npm run dev`.
6. From `kk-admin-panel`, run `npm ci`, then `npm run dev` and open `http://localhost:3001`.
7. Sign in with the administrator account configured above.

## Code organization

- `src/app` contains the Next.js route entry point and global styles.
- `src/components/admin` contains the login, dashboard, customer table, and admin layout components.
- `src/components/admin/categories` manages storefront categories and nested subcategories.
- `src/hooks` contains admin UI and data-loading state.
- `src/lib` contains API access and formatting helpers.
- `src/types` and `src/constants` contain shared admin data types and settings.

The overview metrics, customer table, homepage banner editor, and category manager use authenticated `/api/admin` endpoints. The Catalog sidebar dropdown contains Categories and Homepage banners. Banner and category image uploads use the backend Cloudinary integration; configure Cloudinary in the backend `.env` and apply the database migrations. The storefront reads active carousel slides from `/api/banners` and the category tree, including uploaded images, from `/api/categories`. Category management supports two levels; product-to-category assignments are not included yet.

The admin session is held in browser session storage and is cleared when you sign out or close the session.

## GitHub and deployment

Commit the application source, `public/` assets, `package.json`, `package-lock.json`,
TypeScript/Next.js configuration, `.gitignore`, `.env.example`, and this README.
Do not commit `.env.local` or other real environment files, `.npmrc`, credentials,
`node_modules/`, `.next/`, build output, or TypeScript build caches. `.env.example`
contains only a local API URL; set `NEXT_PUBLIC_API_URL` to your deployed backend
URL in your hosting provider's environment settings. This value is public in the
browser bundle, so never put secrets in `NEXT_PUBLIC_*` variables.

For a clean install and production build, run `npm ci` and `npm run build`.
