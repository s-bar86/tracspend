import NextAuth from 'next-auth';
import GoogleProvider from '@auth/core/providers/google';
import Github from '@auth/core/providers/github';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile.id;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true
};

export default NextAuth(authOptions);
