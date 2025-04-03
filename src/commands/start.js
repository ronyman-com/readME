import { buildWebsite } from '../../src/build.js';
import express from 'express';

export async function start() {
  try {
    // 1. Force fresh build
    await buildWebsite();
    
    // 2. Start NO-CACHE server
    const app = express();
    app.use((req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    });
    app.use(express.static('dist'));
    app.listen(3000, () => {
      console.log('🚀 Server running FRESH at http://localhost:3000');
    });
  } catch (error) {
    console.error('🔥 CRITICAL FAILURE:', error);
    process.exit(1);
  }
}