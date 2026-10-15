# Komal Parashar — Portfolio

Personal portfolio for Komal Parashar, a product designer with a product manager's perspective.

`index.html` is the whole site (markup, styles and scripts, no build step). `api/enquiry.js` is a small serverless function that emails enquiry-form messages through [Resend](https://resend.com).

## Files

- `index.html` — the site
- `api/enquiry.js` — sends form enquiries by email via Resend (runs on Vercel)
- `assets/komal-logo.svg` — the k. logo mark

## Deploy on Vercel (needed for the enquiry emails)

GitHub Pages only serves static files, so the form can't send email there. Use Vercel:

1. In Vercel, choose **Add New → Project**, import `komalparashar62/ohkay`, and deploy with the default settings (no framework, no build command).
2. In Resend, create an API key with **Sending access**.
3. In the Vercel project, open **Settings → Environment Variables** and add `RESEND_API_KEY` with that key. Then redeploy.
4. Open the live site, send yourself a test enquiry, and check your inbox.

Keep the API key only in Vercel's environment variables. Never paste it into `index.html` or commit it.

### Optional settings

| Variable | Default | Use |
|---|---|---|
| `ENQUIRY_TO` | `ikomalparashar@gmail.com` | Where enquiries are delivered |
| `ENQUIRY_FROM` | `Portfolio enquiries <onboarding@resend.dev>` | The sender. Resend's `onboarding@resend.dev` only delivers to the email address that owns your Resend account. If that isn't `ikomalparashar@gmail.com`, verify your own domain in Resend and set e.g. `Komal <hello@yourdomain.com>`. |

Replies go straight to the visitor: each email's reply-to is the address they typed in the form.

## If sending fails

When the function can't be reached (for example on GitHub Pages or in a preview), the form shows the visitor their message ready to copy, with your email address, so no enquiry is lost.

## Run locally

Open `index.html` in a browser to view the site. To test the email function locally, install the Vercel CLI and run `vercel dev` with `RESEND_API_KEY` set in a local `.env` file (which is git-ignored).
