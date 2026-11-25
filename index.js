const express = require('express');
const cors = require('cors');
const pool = require('./db');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const aviones = require('./routes/aviones');
const vuelos = require('./routes/vuelos');
const pasajeros = require('./routes/pasajeros');
const boletosEquipaje = require('./routes/boletos_equipaje');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de gestión de vuelos, pasajeros y equipaje',
            version: '1.0.0',
            description: 'API del tema 18 para gestionar aviones, vuelos, pasajeros y boletos con equipaje documentado.'
        },
        servers: [
            { url: `http://localhost:${PORT}` }
        ],
        components: {
            parameters: {
                Id: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Identificador del registro que se va a modificar o eliminar.',
                    schema: { type: 'integer', minimum: 1 }
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/aviones', aviones);
app.use('/api/vuelos', vuelos);
app.use('/api/pasajeros', pasajeros);
app.use('/api/boletos-equipaje', boletosEquipaje);

async function iniciarServidor() {
    try {
        const resultado = await pool.query('SELECT current_database() AS base');
        console.log(`Conexión exitosa a ${resultado.rows[0].base}`);

        app.listen(PORT, () => {
            console.log(`Servidor iniciado en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al conectar con PostgreSQL:', error.message);
        process.exitCode = 1;
    }
}

iniciarServidor();