import { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: any;
      token: { sub?: string; email?: string | null };
    }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (typeof token.email === 'string' && token.email)
          session.user.email = token.email;
      }
      return session;
    },
  },
};
