# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Deployment

This project can be deployed to Vercel or Netlify. The app builds to the `dist` folder using `npm run build`.

Quick steps for both providers:

### Vercel

1. Push this repo to GitHub.
2. In the Vercel dashboard, click "New Project" → import from GitHub.
3. Set Framework preset to "Vite" (or let Vercel auto-detect). Build command: `npm run build`. Output directory: `dist`.
4. Deploy. Vercel will build and publish automatically on each push.

### Netlify

1. Push this repo to GitHub.
2. In Netlify, click "New site from Git" → choose GitHub repo.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Connect and deploy. Netlify will run builds on each push.

Notes

- Both platforms detect a Vite project automatically. The repo includes `netlify.toml` and `vercel.json` to help with configuration.
- If you use environment variables, add them in the provider's project settings.
- To preview the production build locally:

```bash
npm run build
npm run preview
```

### Automatic deploy via GitHub Actions → Netlify

This repo includes a workflow at `.github/workflows/deploy-netlify.yml` that will build the app and deploy the `dist` folder to Netlify whenever you push to `main` or `master`.

To enable automatic deploys:

1. Create a site in Netlify (or use an existing site) and get the **Site ID**.
2. Create a Personal Access Token in Netlify (User Settings → Applications → Personal access tokens) — copy the token.
3. In your GitHub repository, go to `Settings → Secrets → Actions` and add two secrets:

- `NETLIFY_AUTH_TOKEN` = the Netlify personal access token
- `NETLIFY_SITE_ID` = the Netlify site id

4. Push to `main` (or `master`) — GitHub Actions will run and deploy automatically.

If you want, I can guide you step-by-step to create the Netlify site and add the secrets.
