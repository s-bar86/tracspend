import NextAuth from 'next-auth';
import { authConfig } from '../../src/auth';

// This is the API route that NextAuth will use
const handler = NextAuth(authConfig);

export default handler; 