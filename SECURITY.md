# BizYako Security Policy and Owner Runbook

## Reporting a vulnerability

Report suspected vulnerabilities privately to `hello@bizyako.com`. Include the affected URL, reproduction steps, impact, and any relevant request identifiers. Do not include customer data or publish the issue before BizYako has had a reasonable opportunity to investigate.

The canonical machine-readable contact is `https://bizyako.com/.well-known/security.txt`.

## Supported release

The deployed `main` branch is supported. Older local archives and superseded hosting packages should be treated as unsupported and removed from public document roots.

## Security baseline

BizYako uses layered controls: scrypt password hashing, short-lived HMAC-signed admin sessions, host-only `HttpOnly` cookies, `SameSite=Strict`, CSRF tokens, exact-origin checks, strict payload and raster-image validation, bounded request bodies, in-process request throttling, static-file allowlists, security headers, and platform firewall controls.

No internet-facing application can be described as 100% secure. Keep Node, hosting, DNS, credentials, dependencies, and deployment settings maintained alongside this code.

## Initial credential setup

1. Run `npm run security:credentials` on the owner's trusted computer.
2. Store the displayed one-time password, `BIZYAKO_ADMIN_PASSWORD_HASH`, and `BIZYAKO_SESSION_SECRET` in a password manager.
3. Do not commit the output, paste it into source files, send it through chat, or upload it in a hosting ZIP.
4. If a local handoff file is necessary, use the ignored `BIZYAKO_SECURITY_SETUP.txt`, restrict it to the owner account, and delete it after configuring both hosts.
5. Set `BIZYAKO_ALLOWED_ORIGINS` to an exact comma-separated list. The production starting value is `https://bizyako.com,https://www.bizyako.com,https://bizyako.vercel.app`.

### Vercel

Set these Production environment variables in Project Settings or with the Vercel CLI, then redeploy:

- `BIZYAKO_ADMIN_PASSWORD_HASH`
- `BIZYAKO_SESSION_SECRET`
- `BIZYAKO_ALLOWED_ORIGINS`

Do not expose them with a public prefix. Vercel carousel writes remain intentionally read-only; edit persistent posters with the secured local/Namecheap Node admin and commit the resulting data file.

### Namecheap cPanel

Open **Setup Node.js App**, select the BizYako application, and add the same three values under **Environment variables**. Keep the application in Production mode, use `server.js` as the startup file, save, and restart the app. Do not place a `.env` file under `public_html` or another web-accessible directory.

Use cPanel permissions appropriate for the account: directories `0755`, public files `0644`, and owner-only temporary credential files `0600`. Remove deployment ZIPs from the public application directory after extraction and verification.

## Password and secret rotation

Perform rotation immediately after suspected disclosure and routinely after administrator changes.

1. Create a fresh set with `npm run security:credentials`.
2. Update `BIZYAKO_ADMIN_PASSWORD_HASH` and `BIZYAKO_SESSION_SECRET` together on Vercel and cPanel.
3. Keep `BIZYAKO_ALLOWED_ORIGINS` unchanged unless domains changed.
4. Redeploy Vercel and restart the cPanel Node application.
5. Confirm the old password fails and the new password succeeds.
6. Confirm existing sessions are invalidated. Replacing the session secret invalidates every prior signed cookie.
7. Remove the retired values from password-manager history where policy permits and securely delete temporary files.

## Emergency lockout

To disable administration immediately:

1. Remove `BIZYAKO_ADMIN_PASSWORD_HASH` from both hosts, or replace it with an invalid non-scrypt value.
2. Redeploy/restart both hosts. Authentication then fails closed with administration unavailable.
3. If abuse continues, temporarily block `/api/admin-auth` and `/by-admin` in the Vercel Firewall and cPanel/LiteSpeed controls.
4. Rotate the password hash and session secret before restoring access.
5. Review redacted security events and hosting access logs. Never paste raw cookies, passwords, CSRF tokens, or environment values into a ticket.

## HTTPS, DNSSEC, and CAA

- Keep HTTPS enforced and verify automatic certificate renewal on both the apex and `www` hostname.
- Enable DNSSEC at the authoritative DNS provider and confirm the DS record is visible from the parent zone before considering the change complete.
- Review the active certificate issuer before adding CAA. Permit only the certificate authorities actually used by Namecheap/cPanel and Vercel; an incorrect CAA record can stop renewal.
- Keep HSTS enabled only while every included hostname is consistently available over HTTPS.
- Periodically verify A/AAAA/CNAME records so the apex and `www` do not point to abandoned services.

## Firewall rollout

Application throttles are per running process and are not a substitute for an edge firewall. Create Vercel rules for abnormal `/api/admin-auth` and `/api/contact` request rates in **log-only** mode first. Review legitimate traffic and false positives, then publish blocking or rate-limiting actions from the Vercel dashboard. Never publish a new blocking rule without reviewing the staged diff.

Apply equivalent cPanel/LiteSpeed/ModSecurity protections where available. Keep automatic DDoS mitigation and managed rules enabled.

## Deployment verification

For each release:

1. Run `npm test`, `npm run syntax:check`, `npm run security:scan`, and `npm audit --omit=dev`.
2. Confirm `vercel.json`, `manifest.webmanifest`, and carousel JSON parse successfully.
3. Confirm `/server.js`, `/package.json`, `/lib/`, and `/data/carouselSlides.json` are not publicly readable.
4. Confirm `/.well-known/security.txt` is public.
5. Confirm `/by-admin` shows only the sign-in gate without a session.
6. Test failed login, successful login, authorized save behavior, logout, and session expiry.
7. Confirm contact form success, honeypot rejection, body-size rejection, and `429` throttling.
8. Inspect CSP, HSTS, `nosniff`, frame denial, referrer, permissions, COOP, and CORP headers.
9. Check desktop and mobile layouts, support-icon contrast, the process/contact transition, and browser console errors.
10. Confirm service worker version activation and that admin/auth/mutation routes are not cached.

## Backup and recovery

The GitHub `main` branch is the source of truth. Before replacing carousel posters, keep the prior `data/carouselSlides.json` revision and original image files in version control or an encrypted backup.

For recovery:

1. Disable administration with the Emergency lockout procedure if integrity is uncertain.
2. Restore the last known-good commit and matching raster assets.
3. Rotate the admin password and session secret.
4. Redeploy Vercel and upload/restart the matching cPanel package.
5. Purge obsolete service-worker/CDN content where required.
6. Re-run the full deployment verification checklist before reopening administration.

Document the incident timeline, affected versions, containment, recovery, and follow-up controls without recording secrets.