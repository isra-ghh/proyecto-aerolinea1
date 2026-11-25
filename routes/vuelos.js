const express = require('express');
const pool = require('../db');
const router = express.Router();

function idValido(id) {
    return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
}

function datosValidos({ origen, destino, fecha_hora, avion_id }) {
    return typeof origen === 'string' &&
        origen.trim().length > 0 &&
        origen.trim().length <= 80 &&
        typeof destino === 'string' &&
        destino.trim().length > 0 &&
        destino.trim().length <= 80 &&
        typeof fecha_hora === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(fecha_hora) &&
        Number.isInteger(avion_id) &&
        idValido(avion_id);
}

function responderError(res, error, mensajeRelacion) {
    if (error.code === '23503') {
        return res.status(409).json({ error: mensajeRelacion });
    }

    if (error.code === '22007' || error.code === '22008') {
        return res.status(400).json({ error: 'La fecha u hora del vuelo es inválida' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
}

router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM vuelos ORDER BY id');
        return res.json(resultado.rows);
    } catch (error) {
        return responderError(res, error);
    }
});

router.post('/', async (req, res) => {
    const datos = req.body ?? {};

    if (!datosValidos(datos)) {
        return res.status(400).json({ error: 'Revisa los datos del vuelo' });
    }

    const { origen, destino, fecha_hora, avion_id } = datos;

    try {
        const resultado = await pool.query(
            `INSERT INTO vuelos (origen, destino, fecha_hora, avion_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [origen.trim(), destino.trim(), fecha_hora, avion_id]
        );

        return res.status(201).json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error, 'El avión indicado no existe');
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body ?? {};

    if (!idValido(id) || !datosValidos(datos)) {
        return res.status(400).json({ error: 'Revisa el ID y los datos del vuelo' });
    }

    const { origen, destino, fecha_hora, avion_id } = datos;

    try {
        const resultado = await pool.query(
            `UPDATE vuelos
             SET origen = $1, destino = $2, fecha_hora = $3, avion_id = $4
             WHERE id = $5
             RETURNING *`,
            [origen.trim(), destino.trim(), fecha_hora, avion_id, id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }

        return res.json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error, 'El avión indicado no existe');
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).json({ error: 'El ID debe ser un entero positivo válido' });
    }

    try {
        const resultado = await pool.query(
            'DELETE FROM vuelos WHERE id = $1 RETURNING id',
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }

        return res.json({ mensaje: 'Vuelo eliminado', id: resultado.rows[0].id });
    } catch (error) {
        return responderError(res, error, 'El vuelo tiene boletos registrados');
    }
});

module.exports = router;

/**
 * @swagger
 * /api/vuelos:
 *   get:
 *     tags: [Vuelos]
 *     summary: Lista los vuelos registrados
 *     responses:
 *       '200': { description: Lista de vuelos }
 *   post:
 *     tags: [Vuelos]
 *     summary: Registra un vuelo
 *     requestBody:
 *       $ref: '#/components/requestBodies/Vuelo'
 *     responses:
 *       '201': { description: Vuelo registrado }
 *       '400': { description: Datos o fecha inválidos }
 *       '409': { description: El avión indicado no existe }
 * /api/vuelos/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   put:
 *     tags: [Vuelos]
 *     summary: Actualiza un vuelo
 *     requestBody:
 *       $ref: '#/components/requestBodies/Vuelo'
 *     responses:
 *       '200': { description: Vuelo actualizado }
 *       '400': { description: ID, datos o fecha inválidos }
 *       '404': { description: Vuelo no encontrado }
 *       '409': { description: El avión indicado no existe }
 *   delete:
 *     tags: [Vuelos]
 *     summary: Elimina un vuelo
 *     responses:
 *       '200': { description: Vuelo eliminado }
 *       '400': { description: ID inválido }
 *       '404': { description: Vuelo no encontrado }
 *       '409': { description: El vuelo tiene boletos registrados }
 * components:
 *   requestBodies:
 *     Vuelo:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origen, destino, fecha_hora, avion_id]
 *             properties:
 *               origen: { type: string, maxLength: 80, example: Querétaro }
 *               destino: { type: string, maxLength: 80, example: Cancún }
 *               fecha_hora:
 *                 type: string
 *                 description: Fecha y hora en formato AAAA-MM-DDTHH:mm:ss
 *                 example: '2027-02-12T09:30:00'
 *               avion_id: { type: integer, minimum: 1, example: 1 }
 */