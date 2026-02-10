import NextAuth, { Account, Profile, Session, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeRedirectUrl } from '@/lib/redirect-validator';

interface GitHubProfile extends Profile {
  id: number;
  login: string;
  bio?: string;
  twitter_username?: string;
  blog?: string;
}

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      return sanitizeRedirectUrl(url, baseUrl);
    },
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) {
      if (account?.provider === 'github' && profile) {
        const ghProfile = profile as GitHubProfile;
        const { error } = await supabaseAdmin
          .from('users')
          .upsert({
            github_id: ghProfile.id.toString(),
            username: ghProfile.login,
            email: user.email,
            name: ghProfile.name || ghProfile.login,
            avatar_url: user.image,
            bio: ghProfile.bio,
            github_username: ghProfile.login,
            twitter_username: ghProfile.twitter_username,
            website_url: ghProfile.blog,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'github_id'
          });

        if (error) {
          console.error('Supabase upsert error:', error);
          console.error('Full error details:', JSON.stringify(error, null, 2));
          console.error('Attempted user data:', JSON.stringify({
            github_id: ghProfile.id.toString(),
            username: ghProfile.login,
            email: user.email,
          }, null, 2));
          // TEMPORARY: Allow sign-in anyway while database is being fixed
          // This unblocks OAuth - user can proceed to dashboard
          return true;
        }
      }
      return true;
    },
    async session({ session }: { session: Session }) {
      if (session?.user?.email) {
        const { data } = await supabaseAdmin
          .from('users')
          .select('id, username, tier')
          .eq('email', session.user.email)
          .single();

        if (data) {
          session.user.id = data.id;
          session.user.username = data.username;
          session.user.tier = data.tier;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
