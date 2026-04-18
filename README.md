# OpenMachete

Browser extension built with CRXJS and Vite to hide Welcome to the Jungle job cards from specific companies.

## What it does

- Runs on `https://www.welcometothejungle.com/fr/jobs*`
- Stores a blocklist of company names in `chrome.storage.sync`
- Hides matching job cards as the page loads and as new cards appear
- Includes a popup to manage the company denylist

## Development

```bash
pnpm install
pnpm dev
```

Load the unpacked extension from Chrome or Edge using the generated `dist/` directory.

## Production build

```bash
pnpm build
```

This outputs:

- `dist/` for unpacked loading
- `release/openmachete.zip` for distribution

