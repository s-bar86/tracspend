import { mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function copyApiRoutes() {
  try {
    // Create api directory in dist
    await mkdir(join(rootDir, 'dist', 'api'), { recursive: true });

    // Copy expenses route
    const apiRoutes = [
      'expenses.js'
    ];

    for (const route of apiRoutes) {
      const sourcePath = join(rootDir, 'api', route);
      const targetPath = join(rootDir, 'dist', 'api', route);
      
      try {
        await cp(sourcePath, targetPath);
        console.log(`✅ Copied ${route}`);
      } catch (error) {
        console.warn(`⚠️ Skipping ${route}: ${error.message}`);
      }
    }

    console.log('✅ API routes copied successfully');
  } catch (error) {
    console.error('❌ Error copying API routes:', error);
    process.exit(1);
  }
}

copyApiRoutes(); 