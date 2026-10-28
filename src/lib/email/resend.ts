import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not configured. Email sending will not work.');
    return null;
  }
  client = new Resend(key);
  return client;
}

type SendArgs = Parameters<Resend['emails']['send']>;

// Lazy so `next build` doesn't crash when the key is absent at build time.
export const resend = {
  emails: {
    async send(...args: SendArgs) {
      const c = getClient();
      if (!c) {
        return {
          data: null,
          error: { name: 'missing_api_key', message: 'Email is not configured' },
        };
      }
      return c.emails.send(...args);
    },
  },
};
