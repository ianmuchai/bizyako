# BizYako

BizYako is a modern business technology website for CRM, ERP, POS, analytics, ISP management, and AI-powered workflow products.

## Stack

- Static frontend: `index.html`, `styles.css`, `script.js`
- Local backend: `server.js`
- cPanel Passenger entry: `app.js`
- Vercel backend: serverless API routes in `api/`
- Shared API data: `data/siteData.js`

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/
```

Useful API routes:

```text
http://localhost:5173/api/health
http://localhost:5173/api/site
```

## Deploy To Vercel

1. Push this folder to GitHub.
2. Import the GitHub repository in Vercel.
3. Keep the framework preset as `Other` or static project.
4. Deploy.

Vercel will serve the frontend files and automatically deploy the serverless functions in `api/`.

## Project Structure

```text
assets/              Exact BizYako logo photo and hero image assets
app.js               cPanel Passenger startup entry
api/                 Vercel serverless API routes
data/                Shared site/product data
index.html           Frontend markup
styles.css           Responsive UI and animation styles
script.js            Frontend interactions and API calls
server.js            Local Node server for development
vercel.json          Vercel deployment settings
```

## Notes

- The hero image is `assets/bizyako-hero.png` and has intentionally been left unchanged.
- The logo photo is `assets/bizyako-logo.png`. This should be the exact logo image supplied by BizYako, not a recreated SVG or generated asset.
- Product routing is handled with `data-console-product` attributes, so hero chips, orbit nodes, trust cards, and industry cards can activate relevant product content.

## Logo Asset Requirement

Before pushing or deploying, place the exact attached BizYako logo photo at:

`	ext
assets/bizyako-logo.png
` 

The site is already coded to load that photo before the izYako text in the header and footer.
