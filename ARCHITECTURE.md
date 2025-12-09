## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Game Player    │     │   Game Host     │
│  (Next.js)      │────▶│  (Fastify API)  │
│  Frontend + Bot │     │  Backend API    │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  PostgreSQL     │     │  PostgreSQL     │
│  (Player DB)    │     │  (Game DB)      │
└─────────────────┘     └─────────────────┘
```

## Services

### Game Player Service

- **Frontend**: Next.js 16 with React 19
- **Bot System**: Multiple guessing algorithms (Binary Search, Linear, Random)
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui components

### Game Host Service

- **API**: Fastify framework with TypeScript
- **Business Logic**: Game management, guess validation, state tracking
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Azure AD JWT validation

## Azure Deployment

**Infrastructure**: Both services containerized and running on Azure App Service

- **Authentication**: Microsoft as auth provider via Azure AD
- **Databases**: Each service has dedicated PostgreSQL instance
- **Container Registry**: Azure Container Registry for Docker images
- **CI/CD**: GitHub Actions push images to ACR, triggering webhooks for continuous deployment
- **Environments**: DEV and PROD environments in separate resource groups with identical configurations

## Development

- **Local Development**: Docker Compose for local db instances
- **Type Safety**: Full TypeScript implementation
- **API Documentation**: OpenAPI/Swagger specs
