import { productQuerySchema } from '../../../shared/schemas';
import {
  getCategoriesTree,
  getFeaturedData,
  getProductBySlug,
  getSearchSuggestions,
  getShippingZones,
  queryProducts,
} from '../catalog-data';
import { getQueryParams, HttpError, sendOk, withApiHandler } from '../http';

export const catalogHandler = withApiHandler(async (req, res) => {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Only GET requests are supported for catalog routes.');
  }

  const pathname = (req.url || '/').split('?')[0] || '/';
  const params = getQueryParams(req);

  if (pathname === '/api/categories' || pathname === '/api/catalog/categories') {
    const categories = await getCategoriesTree();
    sendOk(res, categories);
    return;
  }

  if (pathname === '/api/shipping-zones' || pathname === '/api/catalog/shipping-zones') {
    const zones = await getShippingZones();
    sendOk(res, zones);
    return;
  }

  if (pathname === '/api/featured' || pathname === '/api/catalog/featured') {
    const featured = await getFeaturedData();
    sendOk(res, featured);
    return;
  }

  if (pathname === '/api/search/suggest' || pathname === '/api/catalog/search/suggest') {
    const q = params.get('q') ?? '';
    const suggestions = await getSearchSuggestions(q);
    sendOk(res, suggestions);
    return;
  }

  if (pathname === '/api/products' || pathname === '/api/catalog/products') {
    const queryObj: Record<string, string> = {};
    params.forEach((value, key) => {
      queryObj[key] = value;
    });
    const parsed = productQuerySchema.parse(queryObj);
    const result = await queryProducts(parsed);
    sendOk(res, result.items, 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
    return;
  }

  const slugMatch = pathname.match(/^\/api\/(?:catalog\/)?products\/([^/]+)$/);
  if (slugMatch && slugMatch[1]) {
    const slug = decodeURIComponent(slugMatch[1]);
    const data = await getProductBySlug(slug);
    if (!data) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
    }
    sendOk(res, data);
    return;
  }

  throw new HttpError(404, 'NOT_FOUND', 'Catalog endpoint not found.');
});
