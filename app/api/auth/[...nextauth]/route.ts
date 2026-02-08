import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { supabaseAdmin } from '@/lib/supabase';

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === 'github') {
        // Upsert user in Supabase
        const { error } = await supabaseAdmin
          .from('users')
          .upsert({
            github_id: profile.id.toString(),
            username: profile.login,
            email: user.email,
            name: profile.name || profile.login,
            avatar_url: user.image,
            bio: profile.bio,
            github_username: profile.login,
            twitter_username: profile.twitter_username,
            website_url: profile.blog,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'github_id'
          });

        if (error) {
          console.error('Error upserting user:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      // Add user ID to session
      if (session?.user) {
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
