import { BrevoClient } from '@getbrevo/brevo'

const EVENT_NAME     = process.env.NEXT_PUBLIC_EVENT_NAME     ?? 'Evento'
const EVENT_DATE     = process.env.NEXT_PUBLIC_EVENT_DATE     ?? ''
const EVENT_TIME     = process.env.NEXT_PUBLIC_EVENT_TIME     ?? ''
const EVENT_LOCATION = process.env.NEXT_PUBLIC_EVENT_LOCATION ?? ''
const EVENT_TYPE     = process.env.NEXT_PUBLIC_EVENT_TYPE     ?? ''
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL        ?? ''

export async function sendConfirmationEmail({
  to,
  principal,
  acompanante,
}: {
  to: string
  principal: string
  acompanante?: string | null
}) {
  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY! })

  const fromEmail = process.env.BREVO_FROM_EMAIL ?? 'comunicacion@bulnesmba.com'
  const fromName  = process.env.BREVO_FROM_NAME  ?? 'Bulnes Eurogroup'

  const attendees = acompanante
    ? `<strong style="color:#1c1917;">${principal}</strong> y <strong style="color:#1c1917;">${acompanante}</strong>`
    : `<strong style="color:#1c1917;">${principal}</strong>`

  const detailRow = (label: string, value: string, last = false) => `
    <tr>
      <td style="padding:14px 24px;${last ? '' : 'border-bottom:1px solid #e7e5e4;'}">
        <span style="display:block;font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:3px;">${label}</span>
        <span style="font-size:14px;color:#1c1917;font-weight:600;">${value}</span>
      </td>
    </tr>`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Confirmación de asistencia</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:48px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:580px;">

  <!-- Logo -->
  <tr>
    <td align="center" style="padding-bottom:24px;">
      <img src="${APP_URL}/BULNESGROUP.jpeg" alt="Bulnes Eurogroup" width="150"
           style="background:#ffffff;border-radius:12px;padding:10px 20px;display:block;" />
    </td>
  </tr>

  <!-- Header -->
  <tr>
    <td style="background:#1c1917;border-radius:20px 20px 0 0;padding:48px 48px 36px;text-align:center;">
      <p style="margin:0 0 20px;color:#c9a84c;font-size:22px;letter-spacing:0.3em;">✦ ✦ ✦</p>
      ${EVENT_TYPE ? `<p style="margin:0 0 8px;color:#c9a84c;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">${EVENT_TYPE}</p>` : ''}
      <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;font-weight:bold;line-height:1.3;font-family:'Georgia',serif;">
        ${EVENT_NAME}
      </h1>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="border-top:1px solid #c9a84c;opacity:0.4;"></td>
          <td style="padding:0 16px;color:#c9a84c;font-size:14px;white-space:nowrap;">✦</td>
          <td style="border-top:1px solid #c9a84c;opacity:0.4;"></td>
        </tr>
      </table>
      <span style="display:inline-block;background:#c9a84c;color:#1c1917;border-radius:999px;padding:8px 24px;font-size:13px;font-weight:700;letter-spacing:0.05em;font-family:Arial,sans-serif;">
        ✓ &nbsp;ASISTENCIA CONFIRMADA
      </span>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#ffffff;padding:36px 48px 32px;">
      <p style="margin:0 0 10px;color:#78716c;font-size:14px;line-height:1.6;">
        Estimado/a <strong style="color:#1c1917;">${principal}</strong>,
      </p>
      <p style="margin:0 0 28px;color:#57534e;font-size:15px;line-height:1.8;">
        Es un placer comunicarte que tu asistencia ha quedado registrada.<br/>
        ${acompanante
          ? `Esperamos con gran ilusión contar con la presencia de ${attendees}.`
          : `Esperamos con gran ilusión contar con tu presencia.`}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;margin-bottom:28px;">
        ${EVENT_DATE     ? detailRow('Fecha',   EVENT_DATE)          : ''}
        ${EVENT_TIME     ? detailRow('Horario', EVENT_TIME)          : ''}
        ${EVENT_LOCATION ? detailRow('Lugar',   EVENT_LOCATION, true): ''}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fdf8ec;border:1px solid #e9d99a;border-radius:12px;">
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:18px;">👔</span>
                  <span style="display:block;font-size:10px;color:#92803a;text-transform:uppercase;letter-spacing:0.1em;margin:6px 0 2px;">Vestimenta</span>
                  <span style="font-size:13px;font-weight:700;color:#1c1917;">Media etiqueta</span>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding-left:8px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
              <tr>
                <td style="padding:14px 18px;">
                  <span style="font-size:18px;">🅿️</span>
                  <span style="display:block;font-size:10px;color:#a8a29e;text-transform:uppercase;letter-spacing:0.1em;margin:6px 0 2px;">Parking</span>
                  <span style="font-size:13px;font-weight:700;color:#1c1917;">Paseo de Colón</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#a8a29e;font-size:13px;line-height:1.7;font-style:italic;text-align:center;">
        "Siete décadas de trayectoria, crecimiento y compromiso compartido."
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#1c1917;border-radius:0 0 20px 20px;padding:24px 48px;text-align:center;">
      <p style="margin:0 0 6px;color:#c9a84c;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
        Bulnes Eurogroup &nbsp;·&nbsp; 70 Aniversario
      </p>
      <p style="margin:0;color:#57534e;font-size:11px;">
        Por favor, no respondas a este correo.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim()

  await client.transactionalEmails.sendTransacEmail({
    to: [{ email: to, name: principal }],
    sender: { email: fromEmail, name: fromName },
    subject: `Confirmación de asistencia — ${EVENT_NAME}`,
    htmlContent: html,
  })
}
