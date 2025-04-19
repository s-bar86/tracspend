import NextAuth from 'next-auth';
import { authOptions } from '../../src/auth';

// This is the API route that NextAuth will use
export default NextAuth(authOptions); 