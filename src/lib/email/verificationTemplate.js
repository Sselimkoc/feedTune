const logoSrc = "https://glnuiaeqecdotykrergc.supabase.co/storage/v1/object/public/assets/email/logo.png";

const strings = {
  tr: {
    tagline: "İçerik takibini kolaylaştır",
    greeting: (name) => `Merhaba ${name},`,
    signupHeading: (name) => `Hesabını doğrula, ${name}`,
    resendHeading: `Yeni doğrulama emaili`,
    signupBody: `FeedTune'a hoş geldin! RSS feedlerini ve YouTube kanallarını tek bir yerden takip etmeye başlamak için aşağıdaki butona tıkla.`,
    resendBody: `Doğrulama emailini yeniden istedin. Aşağıdaki butona tıklayarak hesabını aktive edebilirsin.`,
    cta: `E-posta adresini doğrula →`,
    copyLink: `Butona tıklamak yerine aşağıdaki linki tarayıcına kopyalayabilirsin:`,
    footer: `Bu emaili sen talep etmediysen görmezden gelebilirsin. Link 24 saat geçerlidir.`,
    subject: {
      signup: "FeedTune hesabını doğrula",
      resend: "FeedTune — Doğrulama emailini yeniden gönder",
    },
  },
  en: {
    tagline: "Simplify your content tracking",
    greeting: (name) => `Hi ${name},`,
    signupHeading: (name) => `Verify your account, ${name}`,
    resendHeading: `New verification email`,
    signupBody: `Welcome to FeedTune! Click the button below to start tracking your RSS feeds and YouTube channels in one place.`,
    resendBody: `You requested a new verification email. Click the button below to activate your account.`,
    cta: `Verify your email address →`,
    copyLink: `Or copy the link below into your browser:`,
    footer: `If you didn't request this email, you can safely ignore it. The link expires in 24 hours.`,
    subject: {
      signup: "Verify your FeedTune account",
      resend: "FeedTune — Resend verification email",
    },
  },
};

export function getEmailSubject(type, lang = "tr") {
  const s = strings[lang] || strings.tr;
  return s.subject[type];
}

export function buildVerificationEmail(name, confirmationUrl, { isResend = false, lang = "tr" } = {}) {
  const s = strings[lang] || strings.tr;

  const heading = isResend ? s.resendHeading : s.signupHeading(name);
  const body = isResend ? s.resendBody : s.signupBody;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px 40px;text-align:center;">
              <img src="${logoSrc}" alt="FeedTune" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:10px;" />
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">FeedTune</h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">${s.tagline}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">${s.greeting(name)}</p>
              <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;font-weight:600;">${heading}</h2>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">${body}</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);border-radius:8px;">
                    <a href="${confirmationUrl}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      ${s.cta}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
                ${s.copyLink}<br/>
                <a href="${confirmationUrl}" style="color:#60a5fa;word-break:break-all;">${confirmationUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">${s.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
