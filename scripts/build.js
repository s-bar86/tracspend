import { mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function copyApiRoutes() {
  try {
    // Create api directory in dist
    await mkdir(join(rootDir, 'dist', 'api', 'auth'), { recursive: true });

    // Copy auth routes
    await cp(
      join(rootDir, 'api', 'auth', '[...nextauth].js'),
      join(rootDir, 'dist', 'api', 'auth', '[...nextauth].js')
    );

    console.log('✅ API routes copied successfully');
  } catch (error) {
    console.error('❌ Error copying API routes:', error);
    process.exit(1);
  }
}

copyApiRoutes(); 