# Ecommerce Dropshipping - Frontend

Frontend de ecommerce con estructura similar a Shopify, integrado con Supabase y listo para desplegar en Cloudflare Pages.

## Características

- **Storefront**: Página de inicio, catálogo de productos, búsqueda, filtros por categoría
- **Carrito de compras**: Carrito persistente con localStorage
- **Checkout**: Formulario de checkout con integración a pedidos
- **Autenticación**: Email/Password, Google, Apple
- **Gestión de pedidos**: historial de pedidos, seguimiento
- **API para Dropshipping**: Sincronización de productos, creación de pedidos, webhooks

## Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Cuenta en [Cloudflare](https://cloudflare.com)
3. Proyecto de Supabase configurado (el ID de tu proyecto: `lbarjczdxinjiqifargo`)

## Configuración de Supabase

### 1. Ejecutar el Schema SQL

Copia el contenido de `supabase/schema.sql` y ejecútalo en el editor SQL de Supabase:
1. Ve a tu proyecto en Supabase
2. Abrir **SQL Editor**
3. Ejecutar el script

### 2. Configurar Autenticación

1. Ve a **Authentication > Providers**
2. Habilita **Email/Password**
3. Habilita **Google** (configura tus credenciales en Google Cloud Console)
4. Habilita **Apple** (configura en Apple Developer Portal)

### 3. Obtener Credenciales

1. Ve a **Settings > API**
2. Copia `Project URL` y `anon public key`

## Configuración del Proyecto

### 1. Variables de Entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lbarjczdxinjiqifargo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Desarrollo Local

```bash
npm run dev
```

## Despliegue en Cloudflare Pages

### Opción 1: Wrangler CLI

```bash
# Instalar wrangler
npm install -g wrangler

# Login en Cloudflare
wrangler login

# Desplegar
npm run deploy
```

### Opción 2: Dashboard de Cloudflare

1. Ve a **Pages** en el dashboard de Cloudflare
2. Crea un nuevo proyecto
3. Conecta tu repositorio de Git
4. Configura:
   - Build command: `npm run build`
   - Build output directory: `.output`
5. Añade las variables de entorno en Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Despliega

## API Routes para Dropshipping

### Sincronizar Productos
```bash
POST /api/dropship/sync
Body: { "supplier_id": "uuid-del-proveedor" }
```

### Crear Pedido en Proveedor
```bash
POST /api/dropship/create-order
Body: { "order_id": "uuid-del-pedido" }
```

### Webhook de Actualización
```bash
POST /api/dropship/webhook
```

## Estructura del Proyecto

```
ecommerce-dropshipping/
├── components/          # Componentes React
│   └── Layout.tsx       # Layout principal
├── context/            # Contextos de React
│   └── CartContext.tsx  # Carrito de compras
├── lib/                # Utilidades
│   ├── supabase.ts     # Cliente de Supabase
│   └── auth.ts         # Funciones de autenticación
├── pages/              # Páginas de Next.js
│   ├── api/            # API Routes
│   │   └── dropship/   # APIs de dropshipping
│   ├── products/       # Catálogo de productos
│   ├── orders/         # Gestión de pedidos
│   └── auth/           # Autenticación
├── public/             # Archivos estáticos
├── styles/             # Estilos CSS
├── supabase/           # Scripts de base de datos
└── wrangler.toml       # Configuración de Cloudflare
```

## Proveedores de Dropshipping Soportados

- **AliExpress**: Configura API Key y Secret
- **CJ Dropshipping**: Configura API Key
- **Global Dropshipping**: Configura API Key

Para configurar las credenciales de cada proveedor, actualiza los registros en la tabla `suppliers` de Supabase.

## Notas

- El proyecto usa Next.js en modo static export (`output: 'export'`) para compatibilidad con Cloudflare Pages
- Las API routes funcionan con Cloudflare Workers
- Autenticación OAuth requiere configurar redirect URLs en Supabase

## Soporte

Si tienes preguntas, revisa la documentación de:
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Supabase](https://supabase.com/docs)
- [Next.js](https://nextjs.org/docs)