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
http://localhost:5173/api/chat
```

## Deploy To Vercel

1. Push this folder to GitHub.
2. Import the GitHub repository in Vercel.
3. Keep the framework preset as Other or static project.
4. Add the four SILICONFLOW environment variables shown in .env.example, using a real key only in Vercel's protected settings.
5. Deploy.

Vercel serves the allowlisted frontend output and the serverless functions in api/. See SECURITY.md for exact advisor, admin, origin, rotation, and verification settings.

## Deploy To Namecheap cPanel

Use Setup Node.js App with app.js as the startup file and the BizYako folder as the application root. Add the same protected environment variables in the cPanel application settings, restart the app, and never upload a real .env file. The prepared Node package keeps backend source outside the public static allowlist.
## Project Structure

```text
assets/              Exact BizYako logo photo and hero image assets
app.js               cPanel Passenger startup entry
api/                 Vercel serverless API routes
data/                Shared site/product data
index.html           Frontend markup
styles.css           Responsive UI and animation styles
chat-history.js       Bounded 30-day browser conversation storage
lib/advisor.js        Server-only SiliconFlow advisor client
script.js            Frontend interactions and API calls
server.js            Local Node server for development
vercel.json          Vercel deployment settings
```

## Notes

- The hero carousel uses the supplied BizYako poster assets under assets/.
- The logo photo is assets/bizyako-logo.png and is loaded directly before the BizYako name in the header and footer.
- Product routing uses data-console-product attributes so product controls open the relevant product content and demos.
- Chat history stays in the visitor's browser for 30 days; provider credentials and name/phone lead fields are never stored there.

## Logo Asset Requirement

Keep the exact supplied BizYako logo image at assets/bizyako-logo.png. Do not replace it with a recreated SVG, text mark, or generated substitute.
