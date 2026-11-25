const express = require('express');
const pool = require('../db');
const router = express.Router();

function textoValido(valor, maximo) {
    return typeof valor === 'string' &&
        valor.trim().length > 0 &&
        valor.trim().length <= maximo;
}

function datosValidos({ nombre, numero_pasaporte, nacionalidad }) {
    return textoValido(nombre, 120) &&
        textoValido(numero_pasaporte, 20) &&
        textoValido(nacionalidad, 60);
}

function idValido(id) {
    return /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647;
}

function responderError(res, error) {
    if (error.code === '23505') {
        return res.status(409).json({ error: 'El pasaporte ya está registrado' });
    }

    if (error.code === '23503') {
        return res.status(409).json({ error: 'El pasajero tiene boletos registrados' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
}

router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM pasajeros ORDER BY id');
        return res.json(resultado.rows);
    } catch (error) {
        return responderError(res, error);
    }
});

router.post('/', async (req, res) => {
    const datos = req.body ?? {};

    if (!datosValidos(datos)) {
        return res.status(400).json({ error: 'Revisa los datos del pasajero' });
    }

    const { nombre, numero_pasaporte, nacionalidad } = datos;

    try {
        const resultado = await pool.query(
            `INSERT INTO pasajeros (nombre, numero_pasaporte, nacionalidad)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [nombre.trim(), numero_pasaporte.trim(), nacionalidad.trim()]
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
        return res.status(400).json({ error: 'Revisa el ID y los datos del pasajero' });
    }

    const { nombre, numero_pasaporte, nacionalidad } = datos;

    try {
        const resultado = await pool.query(
            `UPDATE pasajeros
             SET nombre = $1, numero_pasaporte = $2, nacionalidad = $3
             WHERE id = $4
             RETURNING *`,
            [nombre.trim(), numero_pasaporte.trim(), nacionalidad.trim(), id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Pasajero no encontrado' });
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
            'DELETE FROM pasajeros WHERE id = $1 RETURNING id',
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Pasajero no encontrado' });
        }

        return res.json({ mensaje: 'Pasajero eliminado', id: resultado.rows[0].id });
    } catch (error) {
        return responderError(res, error);
    }
});

module.exports = router;

/**
 * @swagger
 * /api/pasajeros:
 *   get:
 *     tags: [Pasajeros]
 *     summary: Lista los pasajeros registrados
 *     responses:
 *       '200': { description: Lista de pasajeros }
 *   post:
 *     tags: [Pasajeros]
 *     summary: Registra un pasajero
 *     requestBody:
 *       $ref: '#/components/requestBodies/Pasajero'
 *     responses:
 *       '201': { description: Pasajero registrado }
 *       '400': { description: Datos inválidos }
 *       '409': { description: Pasaporte duplicado }
 * /api/pasajeros/{id}:
 *   parameters:
 *     - $ref: '#/components/parameters/Id'
 *   put:
 *     tags: [Pasajeros]
 *     summary: Actualiza un pasajero
 *     requestBody:
 *       $ref: '#/components/requestBodies/Pasajero'
 *     responses:
 *       '200': { description: Pasajero actualizado }
 *       '400': { description: ID o datos inválidos }
 *       '404': { description: Pasajero no encontrado }
 *       '409': { description: Pasaporte duplicado }
 *   delete:
 *     tags: [Pasajeros]
 *     summary: Elimina un pasajero
 *     responses:
 *       '200': { description: Pasajero eliminado }
 *       '400': { description: ID inválido }
 *       '404': { description: Pasajero no encontrado }
 *       '409': { description: El pasajero tiene boletos registrados }
 * components:
 *   requestBodies:
 *     Pasajero:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, numero_pasaporte, nacionalidad]
 *             properties:
 *               nombre: { type: string, maxLength: 120, example: Mariana Soto }
 *               numero_pasaporte: { type: string, maxLength: 20, example: DEMO-SWAG-01 }
 *               nacionalidad: { type: string, maxLength: 60, example: Mexicana }
 */