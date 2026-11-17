# Explore Sri Lanka

Offline-first React and TypeScript tour guide for a tablet running Fully Kiosk Browser. Guest routes use `HashRouter`; editable content, contacts, settings and imported media are stored locally with Dexie/IndexedDB. There is no app backend or cloud sync.

## Development

Requires Node.js and Yarn Classic 1.22.22.

```powershell
yarn install
yarn dev
yarn build
yarn preview
```

The production single-file build is `dist/index.html`. Copy the complete `dist` folder to the tablet; do not launch the development server in production.

## First use

Open the app and use the hidden administrator gesture on the logo (press and hold, or tap five times quickly). Create an administrator PIN on first access. The PIN is a locally derived PBKDF2 verifier and protects against casual access only; it is not server-grade protection against someone with full access to the tablet or files.

The seeded Kande Viharaya profile is an unpublished draft. Verify and translate destination facts and sources before publishing. The administrator can edit destinations, translations, areas, categories, journeys, local media, contact settings and backups.

## Device compatibility

`file://` IndexedDB and local-media behavior varies by Android version, WebView and Fully Kiosk configuration. A successful Vite development session is not proof of offline tablet compatibility. Follow [DEVICE_TEST_CHECKLIST.md](./DEVICE_TEST_CHECKLIST.md) on the actual device before storing operational data. See [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md) for deployment steps.
