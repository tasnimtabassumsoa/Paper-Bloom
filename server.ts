import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { cartHandler } from './api/_lib/handlers/cart';
import { catalogHandler } from './api/_lib/handlers/catalog';
import { contactHandler, newsletterHandler } from './api/_lib/handlers/forms';
import { healthHandler } from './api/_lib/handlers/health';
import { meHandler } from './api/_lib/handlers/me';
import { ordersHandler } from './api/_lib/handlers/orders';
import { wishlistHandler } from './api/_lib/handlers/wishlist';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Mount consolidated API handlers with original URLs intact
  app.all('/api/health', (req, res) => {
    void healthHandler(req, res);
  });

  app.all('/api/contact', (req, res) => {
    void contactHandler(req, res);
  });

  app.all('/api/newsletter', (req, res) => {
    void newsletterHandler(req, res);
  });

  app.all(
    [
      '/api/products',
      '/api/products/*',
      '/api/categories',
      '/api/search/suggest',
      '/api/shipping-zones',
      '/api/featured',
    ],
    (req, res) => {
      void catalogHandler(req, res);
    },
  );

  app.all(['/api/cart', '/api/cart/*'], (req, res) => {
    void cartHandler(req, res);
  });

  app.all(['/api/wishlist', '/api/wishlist/*'], (req, res) => {
    void wishlistHandler(req, res);
  });

  app.all(['/api/me', '/api/me/*'], (req, res) => {
    void meHandler(req, res);
  });

  app.all(['/api/checkout/quote', '/api/orders', '/api/orders/*'], (req, res) => {
    void ordersHandler(req, res);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { maxAge: '7d' }));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Paper Bloom dev server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Paper Bloom server:', err);
  process.exit(1);
});
