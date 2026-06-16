declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  interface SwaggerUiOptions {
    explorer?: boolean;
    customCss?: string;
    customSiteTitle?: string;
  }
  export function setup(spec: unknown, options?: SwaggerUiOptions): RequestHandler;
  export const serve: RequestHandler[];
}

declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi: string;
    info: Record<string, unknown>;
    servers?: Array<Record<string, string>>;
    components?: Record<string, unknown>;
  }
  interface Options {
    definition: SwaggerDefinition;
    apis: string[];
  }
  function swaggerJsdoc(options: Options): Record<string, unknown>;
  export default swaggerJsdoc;
}
