// Vercel serverless function: receives the portfolio enquiry form and emails it via Resend.
// Set RESEND_API_KEY in the Vercel project's environment variables. Never put the key in index.html.
//
// Optional environment variables:
//   ENQUIRY_TO    where enquiries go (default: ikomalparashar@gmail.com)
//   ENQUIRY_FROM  sender shown on the email. The default onboarding@resend.dev only delivers to the
//                 email address that owns the Resend account; verify your own domain in Resend to send
//                 to any address, then set e.g. "Komal's portfolio <hello@yourdomain.com>".

const LIMITS = { name: 120, email: 200, stage: 100, help: 10, helpItem: 80, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Use POST." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ ok: false, error: "Email is not set up yet." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: people never see this field, bots tend to fill it. Pretend success.
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const stage = clean(body.stage, LIMITS.stage);
  const help = Array.isArray(body.help) ? body.help.slice(0, LIMITS.help).map((h) => clean(h, LIMITS.helpItem)).filter(Boolean) : [];
  const message = String(body.message ?? "").trim().slice(0, LIMITS.message);

  if (!name || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ ok: false, error: "Name, a valid email and a message are required." });
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    help.length ? `Help with: ${help.join(", ")}` : null,
    stage ? `Stage: ${stage}` : null,
    "",
    message,
  ].filter((l) => l !== null);

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#2B1828">
      <p style="margin:0 0 4px"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
      ${help.length ? `<p style="margin:0 0 4px">Help with: ${escapeHtml(help.join(", "))}</p>` : ""}
      ${stage ? `<p style="margin:0 0 4px">Stage: ${escapeHtml(stage)}</p>` : ""}
      <hr style="border:0;border-top:1px solid #e5dccd;margin:16px 0">
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ENQUIRY_FROM || "Portfolio enquiries <onboarding@resend.dev>",
        to: [process.env.ENQUIRY_TO || "ikomalparashar@gmail.com"],
        reply_to: email,
        subject: `Project enquiry from ${name}`,
        text: lines.join("\n"),
        html,
      }),
    });
    if (!response.ok) {
      console.error("Resend rejected the email", response.status, await response.text());
      return res.status(502).json({ ok: false, error: "The email could not be sent." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Could not reach Resend", err);
    return res.status(502).json({ ok: false, error: "The email could not be sent." });
  }
}
