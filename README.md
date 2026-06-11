# ServiGest

Sistema administrativo SaaS para talleres mecánicos, industriales y empresas de servicios.

---

## PASO A PASO PARA CORRERLO DESDE CERO

### REQUISITOS
- Node.js 18 o superior → https://nodejs.org (descarga LTS)
- Visual Studio Code → https://code.visualstudio.com
- Extensión Live Server en VS Code (busca "Live Server" de Ritwick Dey e instálala)
- Cuenta gratuita en Railway → https://railway.app
- Git (opcional pero recomendado) → https://git-scm.com

---

### PASO 1 — Descomprimir el proyecto

Descomprime el ZIP en una carpeta, por ejemplo:
```
C:\Proyectos\servigest\
```

Abre esa carpeta en VS Code:
- Archivo → Abrir carpeta → selecciona "servigest"

---

### PASO 2 — Crear la base de datos en Railway

1. Ve a https://railway.app y crea una cuenta gratuita
2. Clic en "New Project" → "Add a service" → "Database" → "PostgreSQL"
3. Espera que se cree (10-20 segundos)
4. Haz clic en el servicio PostgreSQL que se creó
5. Ve a la pestaña "Connect"
6. Copia el valor de "DATABASE_URL" — se ve así:
   `postgresql://postgres:TuPassword@monorail.proxy.rlwy.net:12345/railway`

---

### PASO 3 — Configurar el backend

Abre la terminal de VS Code (Ctrl + ` o Terminal → Nueva terminal)

```bash
# Entrar a la carpeta del backend
cd backend

# Instalar dependencias (solo la primera vez)
npm install

# Crear tu archivo de configuración
copy .env.example .env
```

Ahora abre el archivo `backend/.env` y edítalo:

```env
# Pega aquí tu DATABASE_URL de Railway
DATABASE_URL=postgresql://postgres:TuPassword@host:puerto/railway

# Cambia esto por cualquier texto largo y aleatorio (mínimo 32 caracteres)
JWT_SECRET=pon_aqui_algo_muy_largo_y_secreto_que_nadie_sepa_2024

# Deja esto igual por ahora
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://127.0.0.1:5500
```

---

### PASO 4 — Crear las tablas en la base de datos

Con la terminal aún en la carpeta backend:

```bash
npm run db:migrate
```

Si todo sale bien verás algo como:
```
CREATE TABLE
CREATE TABLE
CREATE INDEX
...
```

Si hay error, verifica que tu DATABASE_URL esté bien copiada en el .env.

---

### PASO 5 — Arrancar el servidor backend

```bash
npm run dev
```

Debes ver:
```
✅ PostgreSQL conectado
🚀 ServiGest API corriendo en puerto 3000
```

Deja esta terminal abierta. El backend está corriendo.

---

### PASO 6 — Abrir el frontend

1. En VS Code, abre el explorador de archivos (lado izquierdo)
2. Navega a `frontend/pages/auth/`
3. Haz clic derecho en `login.html`
4. Selecciona "Open with Live Server"
5. Se abrirá tu navegador en algo como `http://127.0.0.1:5500/...`

---

### PASO 7 — Crear tu primera cuenta

1. En la pantalla de login, haz clic en "Regístrate"
2. Llena:
   - **Tu nombre**: Juan Martínez
   - **Nombre de tu empresa**: Taller López
   - **Correo**: tu@correo.com
   - **Contraseña**: mínimo 8 caracteres
3. Clic en "Crear cuenta"
4. Ya estás dentro del dashboard

---

### PASO 8 — Configurar datos de empresa (para facturación)

1. Ve a **Ajustes** (sidebar izquierdo, ícono de engranaje)
2. Llena: RFC, Régimen fiscal, Dirección fiscal
3. Si quieres facturar CFDI, ve a la pestaña **Facturación SAT**:
   - Crea una cuenta en https://facturapi.io (tienen plan gratuito de prueba)
   - Copia tu API Key y pégala ahí
4. Guarda cambios

---

### PARA EL DÍA A DÍA

Cada vez que quieras usar ServiGest:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Frontend:** clic derecho en `login.html` → "Open with Live Server"

---

## ESTRUCTURA DEL PROYECTO

```
servigest/
├── backend/                    ← API Node.js + Express
│   ├── src/
│   │   ├── controllers/        ← Lógica de negocio (16 archivos)
│   │   ├── routes/             ← Endpoints de la API (16 archivos)
│   │   ├── middleware/         ← Auth JWT, roles, auditoría
│   │   └── db/
│   │       ├── connection.js   ← Conexión PostgreSQL
│   │       └── schema.sql      ← Tablas de la base de datos
│   ├── .env.example            ← Plantilla de configuración
│   └── package.json
│
└── frontend/                   ← HTML + CSS + JS vanilla
    ├── pages/
    │   ├── auth/login.html         ← Registro e inicio de sesión
    │   ├── dashboard/              ← Resumen del día
    │   ├── ordenes/                ← Órdenes de trabajo (taller)
    │   ├── alertas/                ← Alertas internas
    │   ├── pedidos/                ← Pedidos con items
    │   ├── clientes/               ← Directorio de clientes
    │   ├── productos/              ← Inventario
    │   ├── facturas/               ← CFDI SAT
    │   ├── cotizaciones/           ← Presupuestos
    │   ├── cxc/                    ← Cuentas por cobrar
    │   ├── compras/                ← Órdenes a proveedores
    │   ├── finanzas/               ← Reportes de ingresos
    │   ├── contador/               ← Vista especial para contadores
    │   ├── ajustes/                ← Empresa, usuarios, Facturapi
    │   └── audit/                  ← Logs de auditoría
    ├── js/
    │   ├── api.js                  ← Cliente HTTP centralizado
    │   ├── auth.js                 ← Sesión y permisos
    │   └── sidebar.js              ← Navegación y alertas badge
    └── css/
        ├── base.css                ← Variables, layout, componentes base
        └── components.css          ← Componentes reutilizables
```

---

## API — ENDPOINTS PRINCIPALES

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro de empresa |
| POST | /api/auth/login | Login |
| GET | /api/ordenes | Órdenes de trabajo |
| POST | /api/ordenes | Crear OT |
| PATCH | /api/ordenes/:id/estado | Cambiar estado OT |
| POST | /api/ordenes/:id/solicitar-pieza | Técnico solicita material |
| POST | /api/ordenes/:id/pieza-disponible | Admin confirma material |
| GET | /api/alertas | Alertas internas |
| GET | /api/alertas/conteo | Badge del navbar |
| GET | /api/pedidos | Pedidos con items |
| POST | /api/pedidos | Crear pedido |
| GET | /api/productos | Inventario |
| GET | /api/productos/stock-bajo | Alertas de stock |
| GET | /api/facturas | Facturas CFDI |
| POST | /api/facturas/:id/timbrar | Timbrar ante SAT |
| GET | /api/cxc | Cuentas por cobrar |
| POST | /api/cxc/:id/pago | Registrar pago |
| GET | /api/reportes/dashboard | Métricas para dashboard |
| GET | /api/audit | Logs de auditoría |
| GET | /api/usuarios | Gestión de usuarios |

---

## ROLES Y PERMISOS

| Rol | Acceso |
|-----|--------|
| **Admin** | Todo dentro de su empresa |
| **Operador** | Crear OTs, pedidos, cotizaciones. Sin ver costos, sin eliminar, sin finanzas |
| **Contador** | Solo lectura fiscal: facturas, CxC, reportes, exportar XML |

---

## SUBIR A PRODUCCIÓN (Railway + Vercel)

### Backend en Railway:
1. Sube tu carpeta `backend/` a GitHub
2. En Railway: New Project → Deploy from GitHub repo
3. Selecciona tu repo y la carpeta `backend/`
4. En Variables de entorno agrega: DATABASE_URL, JWT_SECRET, NODE_ENV=production, FRONTEND_URL=https://tudominio.vercel.app
5. Railway genera una URL pública como: `https://servigest-backend.up.railway.app`

### Frontend en Vercel:
1. En `frontend/js/api.js` línea 1, cambia:
   ```javascript
   const API_URL = 'https://servigest-backend.up.railway.app/api';
   ```
2. Sube tu carpeta `frontend/` a GitHub
3. En vercel.com: New Project → importa tu repo
4. Vercel genera tu URL pública

---

## PROBLEMAS COMUNES

**"Cannot connect to PostgreSQL"**
→ Verifica que DATABASE_URL en .env está bien copiada. Sin espacios extra.

**"Token inválido"**
→ JWT_SECRET cambió. Borra localStorage del navegador (F12 → Application → Clear Storage).

**Los estilos no cargan**
→ Asegúrate de abrir con Live Server, no como archivo directo (file://).

**Error CORS**
→ Verifica que FRONTEND_URL en .env coincide exactamente con la URL que muestra Live Server.

**npm run db:migrate da error**
→ Instala psql: https://www.postgresql.org/download/
  O corre el schema manualmente desde el panel de Railway → PostgreSQL → Query.
