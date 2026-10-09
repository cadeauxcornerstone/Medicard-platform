
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER || 'Medcard<noreply@medcard.rw>';

function getSender() {
  const match = BREVO_SENDER.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  const email = match ? match[2].trim() : BREVO_SENDER.trim();
  const name = match?.[1]?.trim() || 'MedCard';

  if (!email.includes('@')) {
    throw new Error('BREVO_SENDER must be a valid email address or "Name <email>"');
  }

  return { name, email };
}

async function sendBrevoEmail(to, subject, htmlContent) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  let response;
  try {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: getSender(),
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });
  } catch (error) {
    console.error('Brevo email API request failed:', error);
    throw new Error('Could not connect to the email service');
  }

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error('Brevo rejected the email request:', response.status, errorDetails);
    throw new Error('The email service rejected the message');
  }

  const result = await response.json();
  if (!result.messageId) {
    console.error('Brevo accepted email without returning a message ID:', result);
    throw new Error('The email service did not confirm message acceptance');
  }

  return result.messageId;
}

export async function sendVerificationEmail(email, code) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#0d9488 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0">
          <h1>MedCard</h1><p>Your Personal Health Vault</p>
        </div>
        <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
          <h2>Verify Your Email Address</h2>
          <p>Use this verification code to continue creating your Patient Vault account:</p>
          <div style="background:#1e3a8a;color:white;font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;text-align:center;border-radius:8px;margin:20px 0">${code}</div>
          <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
        <p style="text-align:center;margin-top:30px;font-size:12px;color:#666">This is an automated email. Please do not reply.</p>
      </body>
    </html>
  `;

  const messageId = await sendBrevoEmail(email, 'MedCard - Verify Your Email', htmlContent);
  console.log(`Verification email accepted by Brevo: ${messageId}`);
  return { success: true, messageId };
}

export async function sendWelcomeEmail(email, firstName, plan) {
  const safeFirstName = String(firstName).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
  const premiumBenefits = plan === 'PREMIUM'
    ? '<li>Unlimited document uploads</li><li>Multi-sector linkage</li><li>Priority data backup</li>'
    : '';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#0d9488 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0">
          <h1>MedCard</h1><p>Your Personal Health Vault</p>
        </div>
        <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px">
          <h2>Welcome, ${safeFirstName}!</h2>
          <p>Your MedCard account has been successfully created.</p>
          <p><strong>Your plan:</strong> ${plan}</p>
          <ul>
            <li>Secure storage of your medical records</li>
            <li>Instant NFC data retrieval</li>
            <li>Access to clinical history</li>
            ${premiumBenefits}
          </ul>
        </div>
        <p style="text-align:center;margin-top:30px;font-size:12px;color:#666">This is an automated email. Please do not reply.</p>
      </body>
    </html>
  `;

  try {
    const messageId = await sendBrevoEmail(email, 'Welcome to MedCard!', htmlContent);
    console.log(`Welcome email accepted by Brevo: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false };
  }
}
