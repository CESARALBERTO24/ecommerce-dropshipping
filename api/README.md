# Ecommerce Dropshipping API - Cloudflare Workers

Backend API para el ecommerce de dropshipping, hosteado en Cloudflare Workers con base de datos D1.

## Características

- **CRUD de Productos**: GET, POST, PUT, DELETE
- **Gestión de Proveedores**: Listar proveedores activos
- **Sincronización de Productos**: Integración con AliExpress, CJ Dropshipping, Global Dropshipping
- **Creación de Pedidos**: Enviar pedidos a proveedores
- **Webhooks**: Recibir actualizaciones de estado de pedidos
- **Health Check**: Endpoint de verificación

## Requisitos

1. Cuenta en [Cloudflare](https://cloudflare.com)
2. Node.js 18+ instalado

## Instalación

```bash
cd ecommerce-dropshipping-api
npm install
```

## Configuración

### 1. Crear Base de Datos D1

```bash
wrangler d1 create ecommerce-dropshipping
```

Copia el `database_id` en `wrangler.toml`.

### 2. Ejecutar Schema

```bash
wrangler d1 execute ecommerce-dropshipping --file=schema.sql
```

### 3. Configurar Variables de Entorno

Edita `wrangler.toml` y añade:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_KEY`: Service role key de Supabase
- `ALIEXPRESS_API_KEY`: Tu API key de AliExpress (opcional)
- `ALIEXPRESS_API_SECRET`: Tu API secret de AliExpress (opcional)
- `CJ_DROPSHIPPING_API_KEY`: Tu API key de CJ (opcional)
- `GLOBAL_DROPSHIPPING_API_KEY`: Tu API key de Global (opcional)

## Desarrollo Local

```bash
npm run dev
```

La API estará disponible en `http://localhost:8787`

## Despliegue

```bash
npm run deploy
```

## Endpoints API

### Productos

```
GET /api/products?category=electronics&search=keyword&limit=50&offset=0
GET /api/products/:id
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

### Proveedores

```
GET /api/suppliers
GET /api/suppliers/:id
```

### Dropshipping

```
POST /api/dropship/sync
Body: { "supplier_id": "uuid-del-proveedor" }

POST /api/dropship/create-order
Body: { "order_id": "uuid-del-pedido" }

POST /api/dropship/webhook
Body: { "supplier_order_id": "id", "status": "shipped", "tracking_number": "..." }
```

### Health Check

```
GET /api/health
```

## Respuestas

Todas las respuestas incluyen headers CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Notas

- La base de datos usa SQLite (D1)
- Los IDs son UUIDs generados automáticamente
- Los timestamps se almacenan en formato ISO
- Si no configuras las API keys de los proveedores, la API devolverá datos de ejemplo