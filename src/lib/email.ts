import { Resend } from "resend";
import type { Lead } from "@prisma/client";

export async function sendDailyLeadEmail(region: string, leads: Lead[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return { sent: false, reason: "RESEND_API_KEY, EMAIL_TO, or EMAIL_FROM not configured" };
  }
  if (leads.length === 0) {
    return { sent: false, reason: "no new leads" };
  }

  const resend = new Resend(apiKey);

  const rows = leads
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(l.businessName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(l.city)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(l.weaknessNotes ?? "")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(l.sizeNotes ?? "")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${l.instagram ? `<a href="${escapeHtml(l.instagram)}">IG</a>` : "-"}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;color:#0f172a;">
      <h2 style="margin-bottom:4px;">Gym Lead Tracker — ${leads.length} new lead${leads.length === 1 ? "" : "s"}</h2>
      <p style="color:#64748b;margin-top:0;">Sourced from <strong>${escapeHtml(region)}</strong>, Florida — all added with status "New".</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead>
          <tr style="text-align:left;background:#f1f5f9;">
            <th style="padding:8px 12px;">Business</th>
            <th style="padding:8px 12px;">City</th>
            <th style="padding:8px 12px;">Weakness</th>
            <th style="padding:8px 12px;">Size signal</th>
            <th style="padding:8px 12px;">IG</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Gym Lead Tracker: ${leads.length} new lead${leads.length === 1 ? "" : "s"} in ${region}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "unknown error" };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
