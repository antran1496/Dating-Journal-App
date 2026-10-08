import 'server-only';
import { Resend } from 'resend';
import { renderMagicLinkHtml } from './templates/magic-link';

interface SendMagicLinkParams {
  to: string;
  token: string;
}

export async function sendMagicLinkEmail({ to, token }: SendMagicLinkParams): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const magicUrl = `${baseUrl.replace(/\/$/, '')}/auth/magic?token=${token}`;

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.info('\n============================================================');
    console.info('✉️ [DEV MODE] Resend API key is not configured. Magic Link:');
    console.info(magicUrl);
    console.info('============================================================\n');
    return { ok: true };
  }

  try {
    const resend = new Resend(resendApiKey);
    const fromAddress = process.env.EMAIL_FROM || 'Dating Journal <noreply@datingjournal.app>';

    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject: 'Link đăng nhập Dating Journal ✨',
      html: renderMagicLinkHtml({ url: magicUrl }),
    });

    if (error) {
      console.error('[sendMagicLinkEmail] Resend error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sendMagicLinkEmail] Unexpected error:', errorMsg);
    return { ok: false, error: errorMsg };
  }
}
