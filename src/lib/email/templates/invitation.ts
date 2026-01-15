export interface InvitationEmailParams {
  inviterName?: string;
  inviterEmail: string;
  tripTitle: string;
  role: 'viewer' | 'commenter' | 'editor';
  inviteUrl: string;
}

const roleLabels = {
  viewer: 'view',
  commenter: 'view and comment on',
  editor: 'view and edit',
};

export function getInvitationEmailHtml(params: InvitationEmailParams): string {
  const { inviterName, inviterEmail, tripTitle, role, inviteUrl } = params;
  const inviter = inviterName || inviterEmail;
  const roleText = roleLabels[role];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to a Trip</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 48px 48px 32px; text-align: center; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Voyagr</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Trip Invitation</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 48px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b; text-align: center;">
                You're Invited!
              </h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 26px; color: #64748b; text-align: center;">
                <strong style="color: #1e293b;">${inviter}</strong> has invited you to ${roleText} their trip:
              </p>

              <!-- Trip Card -->
              <div style="margin: 0 0 32px; padding: 24px; background: linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(236,72,153,0.08) 100%); border-radius: 12px; text-align: center;">
                <p style="margin: 0; font-size: 20px; font-weight: 600; color: #7C3AED;">
                  ${tripTitle}
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">
                  Access level: <strong style="color: #1e293b; text-transform: capitalize;">${role}</strong>
                </p>
              </div>

              <!-- What you can do -->
              <div style="margin: 0 0 32px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1e293b;">As a ${role}, you can:</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      <span style="color: #7C3AED; margin-right: 8px;">&#10003;</span> View the complete trip itinerary
                    </td>
                  </tr>
                  ${role !== 'viewer' ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      <span style="color: #7C3AED; margin-right: 8px;">&#10003;</span> Add comments and suggestions
                    </td>
                  </tr>
                  ` : ''}
                  ${role === 'editor' ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      <span style="color: #7C3AED; margin-right: 8px;">&#10003;</span> Edit places and activities
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                      View Trip
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8; text-align: center;">
                Or copy this link:<br>
                <a href="${inviteUrl}" style="color: #7C3AED; text-decoration: none; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                This invitation was sent by ${inviterEmail}
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                &copy; 2024 Voyagr. All rights reserved.
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

export function getInvitationEmailText(params: InvitationEmailParams): string {
  const { inviterName, inviterEmail, tripTitle, role, inviteUrl } = params;
  const inviter = inviterName || inviterEmail;
  const roleText = roleLabels[role];

  return `
You're Invited to a Trip!

${inviter} has invited you to ${roleText} their trip: "${tripTitle}"

Access level: ${role.charAt(0).toUpperCase() + role.slice(1)}

As a ${role}, you can:
- View the complete trip itinerary
${role !== 'viewer' ? '- Add comments and suggestions\n' : ''}${role === 'editor' ? '- Edit places and activities\n' : ''}

View the trip here: ${inviteUrl}

---
This invitation was sent by ${inviterEmail}
© 2024 Voyagr. All rights reserved.
  `.trim();
}
