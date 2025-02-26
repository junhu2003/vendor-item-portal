'use server'
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcryptjs from 'bcryptjs';
import sql from 'mssql';
import { dbconfig } from '@/app/lib/dbconfig';

await sql.connect(dbconfig);
 
async function getUser(email: string): Promise<User | undefined> {
  try {
        const result = await sql.query`SELECT * FROM users WHERE email=${email}`;
        return result.recordset[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    async authorize(credentials) {
      const parsedCredentials = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials);

        if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUser(email);
            if (!user) return null;

            const passwordsMatch = await bcryptjs.compare(password, user.password);
 
            if (passwordsMatch) return user;
          }
   
          console.log('Invalid credentials');
          return null;
    },
  }),],
});