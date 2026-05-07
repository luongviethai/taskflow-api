import { Router } from 'express';
import {} from 'worker_threads'

const router = Router();

// Endpoint cố tình block event loop
router.get('/block', (req, res) => {
  console.log('[BLOCK] Start heavy computation...');
  const start = Date.now();
  
  let sum = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    sum += i;
  }
  
  const duration = Date.now() - start;
  console.log(`[BLOCK] Done in ${duration}ms`);
  res.json({ sum, duration });
});

export { router as experimentRouter };