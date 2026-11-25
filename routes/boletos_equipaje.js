const express = require('express');
const pool = require('../db');
const router = express.Router();

function idValido(id) {
    return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
}

function datosValidos({ numero_asiento, kilos_equipaje, pasajero_id, vuelo_id }) {
    return typeof numero_asiento === 'string' &&
        numero_asiento.trim().length > 0 &&
        numero_asiento.trim().length <= 6 &&
        Number.isFinite(kilos_equipaje) &&
        kilos_equipaje >= 0 &&
        kilos_equipaje <= 9999.99 &&
        Number.isInteger(pasajero_id) &&
        idValido(pasajero_id) &&
        Number.isInteger(vuelo_id) &&
        idValido(vuelo_id);
}

function responderError(res, error) {
    if (error.code === '23503') {
        return res.status(409).json({ error: 'El pasajero o el vuelo indicado no existe' });
    }

    if (error.code === '23505') {
        return res.status(409).json({ error: 'El asiento ya está ocupado en ese vuelo' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
}

router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM boletos_equipaje ORDER BY id');
        return res.json(resultado.rows);
    } catch (error) {
        return responderError(res, error);
    }
});

router.post('/', async (req, res) => {
    const datos = req.body ?? {};

    if (!datosValidos(datos)) {
        return res.status(400).json({ error: 'Revisa los datos del boleto' });
    }

    const { numero_asiento, kilos_equipaje, pasajero_id, vuelo_id } = datos;

    try {
        const resultado = await pool.query(
            `INSERT INTO boletos_equipaje
                (numero_asiento, kilos_equipaje, pasajero_id, vuelo_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [numero_asiento.trim().toUpperCase(), kilos_equipaje, pasajero_id, vuelo_id]
        );

        return res.status(201).json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error);
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body ?? {};

    if (!idValido(id) || !datosValidos(datos)) {
        return res.status(400).json({ error: 'Revisa el ID y los datos del boleto' });
    }

    const { numero_asiento, kilos_equipaje, pasajero_id, vuelo_id } = datos;

    try {
        const resultado = await pool.query(
            `UPDATE boletos_equipaje
             SET numero_asiento = $1, kilos_equipaje = $2,
                 pasajero_id = $3, vuelo_id = $4
             WHERE id = $5
             RETURNING *`,
            [numero_asiento.trim().toUpperCase(), kilos_equipaje, pasajero_id, vuelo_id, id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Boleto no encontrado' });
        }

        return res.json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error);
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).json({ error: 'El ID debe ser un entero positivo válido' });
    }

    try {
        const resultado = await pool.query(
            'DELETE FROM boletos_equipaje WHERE id = $1 RETURNING id',
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Boleto no encontrado' });
        }

        return res.json({ mensaje: 'Boleto eliminado', id: resultado.rows[0].id });
    } catch (error) {
        return responderError(res, error);
    }
});

module.exports = router;


/**
 * @swagger
 * /api/boletos-equipaje:
 *   get:
 *     tags: [Boletos y equipaje]
 *     summary: Lista los boletos y su equipaje
 *     responses:
 *       '200': { description: Lista de boletos }
 *   post:
 *     tags: [Boletos y equipaje]
 *     summary: Registra un boleto y su equipaje
 *     requestBody:
 *       $ref: '#/components/requestBodies/Boleto'
 *     responses:
 *       '201': { description: Boleto registrado }
 *       '400': { description: Datos inválidos }
 *       '409': { description: Asiento ocupado o pasajero o vuelo inexistente }
 * /api/boletos-equipaje/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   put:
 *     tags: [Boletos y equipaje]
 *     summary: Actualiza un boleto y su equipaje
 *     requestBody:
 *       $ref: '#/components/requestBodies/Boleto'
 *     responses:
 *       '200': { description: Boleto actualizado }
 *       '400': { description: ID o datos inválidos }
 *       '404': { description: Boleto no encontrado }
 *       '409': { description: Asiento ocupado o pasajero o vuelo inexistente }
 *   delete:
 *     tags: [Boletos y equipaje]
 *     summary: Elimina un boleto
 *     responses:
 *       '200': { description: Boleto eliminado }
 *       '400': { description: ID inválido }
 *       '404': { description: Boleto no encontrado }
 * components:
 *   requestBodies:
 *     Boleto:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero_asiento, kilos_equipaje, pasajero_id, vuelo_id]
 *             properties:
 *               numero_asiento: { type: string, maxLength: 6, example: '12C' }
 *               kilos_equipaje: { type: number, minimum: 0, maximum: 9999.99, example: 15.5 }
 *               pasajero_id: { type: integer, minimum: 1, example: 1 }
 *               vuelo_id: { type: integer, minimum: 1, example: 1 }
 */