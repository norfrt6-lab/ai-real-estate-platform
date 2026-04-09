import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Prisma singleton (reuse across hot-reloads in dev)
// ---------------------------------------------------------------------------
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---------------------------------------------------------------------------
// Module augmentation — add `id` and `role` to the built-in Session/JWT types
// ---------------------------------------------------------------------------
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// ---------------------------------------------------------------------------
// NextAuth options
// ---------------------------------------------------------------------------
export const authOptions: NextAuthOptions = {
  // @ts-expect-error — @auth/prisma-adapter typings slightly differ from next-auth v4 adapter type
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('No account found with that email address.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Incorrect password. Please try again.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role ?? 'TENANT',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist the user id and role in the JWT on first sign-in
      if (user) {
        token.id = user.id;
        token.role = (user.role as string) ?? 'TENANT';
      }

      // Allow client-side updates via useSession().update()
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.role = session.role ?? token.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email) {
        // TODO: send welcome email via SendGrid
        console.info(`[auth] New user registered: ${user.email}`);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,
};

// ---------------------------------------------------------------------------
// NextAuth handler (used in the App Router catch-all route)
// ---------------------------------------------------------------------------
const handler = NextAuth(authOptions);

/**
 * `handlers` — drop these into `src/app/api/auth/[...nextauth]/route.ts`:
 *   export const { GET, POST } = handlers;
 */
export const handlers = { GET: handler, POST: handler };

/**
 * `auth` — a thin server-side helper.
 * In server components / route handlers call:
 *   const session = await auth();
 *
 * Under NextAuth v4 this delegates to `getServerSession(authOptions)`.
 */
export async function auth() {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}
