export function getWelcomeEmailHtml(userName?: string, appUrl?: string): string {
  const name = userName || 'Traveler';
  const url = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Tripply</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center; background: linear-gradient(135deg, #2A9D8F 0%, #7C3AED 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Tripply</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Your AI-Powered Travel Companion</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 48px;">
              <h2 style="margin: 0 0 16px; font-size: 26px; font-weight: 600; color: #1e293b; text-align: center;">
                Welcome aboard, ${name}!
              </h2>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 26px; color: #64748b; text-align: center;">
                We're thrilled to have you join the Tripply community. Your journey to seamless travel planning starts now!
              </p>

              <!-- Features with icons -->
              <div style="margin: 0 0 32px; padding: 24px; background: linear-gradient(135deg, rgba(42,157,143,0.08) 0%, rgba(124,58,237,0.08) 100%); border-radius: 12px;">
                <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1e293b;">What you can do with Tripply:</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #475569;">
                      <span style="color: #2A9D8F; margin-right: 8px;">&#10003;</span> Discover hotels, restaurants & hidden gems
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #475569;">
                      <span style="color: #2A9D8F; margin-right: 8px;">&#10003;</span> Build beautiful trip itineraries effortlessly
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #475569;">
                      <span style="color: #2A9D8F; margin-right: 8px;">&#10003;</span> Save and organize your favorite places
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #475569;">
                      <span style="color: #2A9D8F; margin-right: 8px;">&#10003;</span> Share adventures with friends & family
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${url}/trips" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2A9D8F 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px rgba(42, 157, 143, 0.4);">
                      Start Your Journey
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #94a3b8; text-align: center;">
                Questions? We'd love to hear from you!<br>
                <a href="mailto:info@tripply.ai" style="color: #2A9D8F; text-decoration: none;">info@tripply.ai</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                &copy; 2024 Tripply.ai. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                Making travel planning smarter, one trip at a time.
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

export function getWelcomeEmailText(userName?: string, appUrl?: string): string {
  const name = userName || 'Traveler';
  const url = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
Welcome aboard, ${name}!

We're thrilled to have you join the Tripply community. Your journey to seamless travel planning starts now!

What you can do with Tripply:
- Discover hotels, restaurants & hidden gems
- Build beautiful trip itineraries effortlessly
- Save and organize your favorite places
- Share adventures with friends & family

Start your journey: ${url}/trips

Questions? We'd love to hear from you!
Contact us at info@tripply.ai

© 2024 Tripply.ai. All rights reserved.
Making travel planning smarter, one trip at a time.
  `.trim();
}
