// Los nombres vienen del usuario: se escapan para que no inyecten HTML en el correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 0;">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background:#0f172a;padding:32px;text-align:center;">
                  <h1 style="color:#22c55e;margin:0;font-size:24px;">🏟️ ${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">${content}</td>
              </tr>
              <tr>
                <td style="background:#f4f4f4;padding:16px;text-align:center;">
                  <p style="font-size:12px;color:#aaaaaa;margin:0;">
                    &copy; ${new Date().getFullYear()} Estadio Deportivo
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function welcomeEmailTemplate(name: string): string {
  return layout(
    'Bienvenido al Estadio',
    `
      <p style="font-size:16px;color:#333333;">Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size:16px;color:#555555;line-height:1.6;">
        Tu cuenta del Estadio Deportivo ya está lista. Desde ahora puedes gestionar las
        concesiones (comida, bebida y merchandising) del recinto.
      </p>
      <p style="font-size:14px;color:#888888;margin-top:32px;">
        Si no creaste esta cuenta, puedes ignorar este correo.
      </p>
    `,
  );
}

export function resetPasswordEmailTemplate(name: string, resetUrl: string): string {
  const safeUrl = escapeHtml(resetUrl);
  return layout(
    'Recuperar contraseña',
    `
      <p style="font-size:16px;color:#333333;">Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size:16px;color:#555555;line-height:1.6;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta del estadio.
        El enlace expira en <strong>1 hora</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${safeUrl}"
           style="background:#22c55e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:16px;display:inline-block;">
          Restablecer contraseña
        </a>
      </div>
      <p style="font-size:14px;color:#888888;">
        Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.
      </p>
      <p style="font-size:12px;color:#aaaaaa;word-break:break-all;">O copia este enlace: ${safeUrl}</p>
    `,
  );
}

export function concessionCreatedEmailTemplate(
  name: string,
  concessionName: string,
  category: string,
): string {
  return layout(
    'Concesión agregada',
    `
      <p style="font-size:16px;color:#333333;">Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size:16px;color:#555555;line-height:1.6;">
        El producto <strong>&quot;${escapeHtml(concessionName)}&quot;</strong> (${escapeHtml(category)})
        fue agregado al catálogo de concesiones del estadio.
      </p>
    `,
  );
}
