# Ozastra

Official static website for https://ozastra.com/.

The `site/` directory contains the production website and the approved Ozastra
brain-cloud favicon. Every push to `main` deploys through GitHub Actions to
GitHub Pages. The custom domain is configured in Settings > Pages.

Local preview: `python3 -m http.server 4173 --directory site`.

This repository contains the public website only. Build diagnostics and local
working documents are excluded from the deployment directory.
