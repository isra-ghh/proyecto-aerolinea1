# Proyecto Aerolínea

API REST del tema 18 para gestionar aviones, vuelos, pasajeros y boletos con equipaje. Utiliza Node.js, Express, PostgreSQL y Swagger.

## Preparación

1. Crea una base de datos llamada `aerolinea_db` en PostgreSQL si aún no existe. En una base nueva, abre su Query Tool en pgAdmin y ejecuta `base_de_datos.sql` una vez. El script crea cuatro tablas y carga diez registros ficticios en cada una.
2. Abre PowerShell en la carpeta del proyecto e instala las dependencias con `npm ci`.
3. Ejecuta estos comandos. Escribe la contraseña de tu propio usuario de PostgreSQL cuando la terminal la solicite.

```powershell
$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Contraseña de PostgreSQL' -AsSecureString)).Password
npm start
```

La conexión usa `localhost:5432` y el usuario `postgres`. Si tu configuración es distinta, ajusta `db.js`.

## Rutas

La API arranca en `http://localhost:3000`. Abre `http://localhost:3000/api-docs/` para consultar y probar las operaciones.

| Tabla | Ruta |
|---|---|
| Aviones | `/api/aviones` |
| Vuelos | `/api/vuelos` |
| Pasajeros | `/api/pasajeros` |
| Boletos y equipaje | `/api/boletos-equipaje` |

Usa `GET` y `POST` en la ruta base, y `PUT` y `DELETE` agregando `/id`.
