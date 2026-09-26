import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './openapiSpec';

export const swaggerRouter = Router();

// Raw JSON spec endpoint for tooling (Postman, Insomnia, code-generators)
swaggerRouter.get('/json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapiSpec);
});

swaggerRouter.get('/spec.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapiSpec);
});

// Swagger UI custom branding options
const swaggerOptions: swaggerUi.SwaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #14532D; border-bottom: 2px solid #16A34A; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #14532D; font-family: system-ui, sans-serif; }
    .swagger-ui .scheme-container { background: #F0FDF4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .swagger-ui .btn.authorize { color: #16A34A; border-color: #16A34A; }
    .swagger-ui .btn.authorize svg { fill: #16A34A; }
  `,
  customSiteTitle: 'KisanSetu API Documentation — Swagger UI',
};

// Mount Swagger UI
swaggerRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, swaggerOptions)
);

export default swaggerRouter;
