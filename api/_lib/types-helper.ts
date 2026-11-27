import type { z } from 'zod';
import type { productQuerySchema } from '../../shared/schemas';

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
