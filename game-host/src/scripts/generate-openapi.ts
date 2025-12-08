import Fastify from 'fastify';
import AutoLoad from '@fastify/autoload';
import swagger, { SwaggerOptions } from '@fastify/swagger';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const fastify = Fastify({ logger: false });

  const openApiOptions: SwaggerOptions = {
    mode: 'dynamic',
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Guess The Number API',
        description: 'API for hosting and playing the Guess The Number game',
        version: '1.0.0',
      },
      servers: [{ url: process.env.HOST_URL || 'https://host.guess-the-number.com' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  };

  await fastify.register(swagger, openApiOptions);

  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, '..', 'routes'),
    forceESM: true,
  });

  await fastify.ready();

  const spec = (fastify as any).swagger();

  const outDir = path.join(__dirname, '..', '..', 'openapi');
  await fs.mkdir(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'game_host_openapi.json');
  const yamlPath = path.join(outDir, 'game_host_openapi.yaml');

  await fs.rm(jsonPath, { force: true });
  await fs.rm(yamlPath, { force: true });

  const json = JSON.stringify(spec, null, 2);
  const yamlStr = yaml.stringify(spec);

  await fs.writeFile(jsonPath, json, 'utf-8');
  await fs.writeFile(yamlPath, yamlStr, 'utf-8');

  await fastify.close();

  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec generated:\n- ${jsonPath}\n- ${yamlPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
