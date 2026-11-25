const express = require('express');
const pool = require('../db');
const router = express.Router();

function datosValidos(modelo, matricula, capacidad) {
    return typeof modelo === 'string' &&
        modelo.trim().length > 0 &&
        modelo.trim().length <= 80 &&
        typeof matricula === 'string' &&
        matricula.trim().length > 0 &&
        matricula.trim().length <= 15 &&
        Number.isInteger(capacidad) &&
        capacidad > 0 &&
        capacidad <= 2147483647;
}

function idValido(id) {
    return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
}

function responderError(res, error) {
    if (error.code === '23505') {
        return res.status(409).json({ error: 'La matrícula ya está registrada' });
    }

    if (error.code === '23503') {
        return res.status(409).json({ error: 'El avión está asignado a un vuelo' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
}

// GET. Lista los aviones registrados.
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM aviones ORDER BY id');
        return res.json(resultado.rows);
    } catch (error) {
        return responderError(res, error);
    }
});

// POST. Registra un avión.
router.post('/', async (req, res) => {
    const { modelo, matricula, capacidad_total } = req.body ?? {};

    if (!datosValidos(modelo, matricula, capacidad_total)) {
        return res.status(400).json({ error: 'Revisa el modelo, la matrícula y la capacidad' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO aviones (modelo, matricula, capacidad_total)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [modelo.trim(), matricula.trim(), capacidad_total]
        );

        return res.status(201).json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error);
    }
});

// PUT. Actualiza un avión por su ID.
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { modelo, matricula, capacidad_total } = req.body ?? {};

    if (!idValido(id) || !datosValidos(modelo, matricula, capacidad_total)) {
        return res.status(400).json({ error: 'Revisa el ID y los datos del avión' });
    }

    try {
        const resultado = await pool.query(
            `UPDATE aviones
             SET modelo = $1, matricula = $2, capacidad_total = $3
             WHERE id = $4
             RETURNING *`,
            [modelo.trim(), matricula.trim(), capacidad_total, id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Avión no encontrado' });
        }

        return res.json(resultado.rows[0]);
    } catch (error) {
        return responderError(res, error);
    }
});

// DELETE. Elimina un avión por su ID.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!idValido(id)) {
        return res.status(400).json({ error: 'El ID debe ser un entero positivo válido' });
    }

    try {
        const resultado = await pool.query(
            'DELETE FROM aviones WHERE id = $1 RETURNING id',
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Avión no encontrado' });
        }

        return res.json({ mensaje: 'Avión eliminado', id: resultado.rows[0].id });
    } catch (error) {
        return responderError(res, error);
    }
});

module.exports = router;

/**
 * @swagger
 * /api/aviones:
 *   get:
 *     tags: [Aviones]
 *     summary: Lista los aviones registrados
 *     responses:
 *       '200': { description: Lista de aviones }
 *   post:
 *     tags: [Aviones]
 *     summary: Registra un avión
 *     requestBody:
 *       $ref: '#/components/requestBodies/Avion'
 *     responses:
 *       '201': { description: Avión registrado }
 *       '400': { description: Datos inválidos }
 *       '409': { description: Matrícula duplicada }
 * /api/aviones/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   put:
 *     tags: [Aviones]
 *     summary: Actualiza un avión
 *     requestBody:
 *       $ref: '#/components/requestBodies/Avion'
 *     responses:
 *       '200': { description: Avión actualizado }
 *       '400': { description: ID o datos inválidos }
 *       '404': { description: Avión no encontrado }
 *       '409': { description: Matrícula duplicada }
 *   delete:
 *     tags: [Aviones]
 *     summary: Elimina un avión
 *     responses:
 *       '200': { description: Avión eliminado }
 *       '400': { description: ID inválido }
 *       '404': { description: Avión no encontrado }
 *       '409': { description: El avión está asignado a un vuelo }
 * components:
 *   requestBodies:
 *     Avion:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [modelo, matricula, capacidad_total]
 *             properties:
 *               modelo: { type: string, maxLength: 80, example: Airbus A320neo }
 *               matricula: { type: string, maxLength: 15, example: XA-SWAG }
 *               capacidad_total: { type: integer, minimum: 1, example: 180 }
 */