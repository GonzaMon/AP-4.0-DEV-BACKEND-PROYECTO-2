const express = require('express');
const { connectToCollection, desconnect, generateCodigo } = require('../connection_db.js');

const server = express();

// Middlewares
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Se obtiene todos los muebles y tambien por categoría, precio mayor igual, precio menor igual con ordenes nombre y precio
server.get('/api/v1/muebles', async (req, res) => {
    const { categoria, precio_gte, precio_lte } = req.query;
    let muebles = [];

    try {
        const collection = await connectToCollection('muebles');

        if (categoria) muebles = await collection.find({ categoria }).sort({ nombre: 1 }).toArray();
        else if (precio_gte) muebles = await collection.find({ precio: { $gte: Number(precio_gte) } }).sort({ precio: 1 }).toArray();
        else if (precio_lte) muebles = await collection.find({ precio: { $lte: Number(precio_lte) } }).sort({ precio: -1 }).toArray();
        else muebles = await collection.find().toArray();

        res.status(200).send(JSON.stringify({ payload: muebles }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

// Se obtiene un mueble específico a traves del código pasado como parámetro
server.get('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });

        res.status(200).send(JSON.stringify({ payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

// Se crea un mueble
server.post('/api/v1/muebles', async (req, res) => {
    const { nombre, precio, categoria } = req.body;

    if (!nombre || !precio || !categoria) return res.status(400).send({ message: 'Faltan datos relevantes' });

    try {
        const collection = await connectToCollection('muebles');
        const mueble = { codigo: await generateCodigo(collection), nombre, precio: Number(precio), categoria };

        await collection.insertOne(mueble);
        res.status(201).send(JSON.stringify({ message: 'Registro creado', payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

// Se actualizan los datos de un mueble específico a traves del código pasado como parámetro
server.put('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria } = req.body;

    if (!nombre || !precio || !categoria) return res.status(400).send({ message: 'Faltan datos relevantes' });

    try {
        const collection = await connectToCollection('muebles');
        let mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });
        mueble = { nombre, precio: Number(precio), categoria };

        await collection.updateOne({ codigo: Number(codigo) }, { $set: mueble });
        res.status(200).send(JSON.stringify({ message: 'Registro actualizado', payload: { codigo, ...mueble } }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

// Se borra un mueble específico a traves de un código pasado como parámetro
server.delete('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await connectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send({ message: 'El código no corresponde a un mueble registrado' });

        await collection.deleteOne({ codigo: { $eq: Number(codigo) } });
        res.status(200).send(JSON.stringify({ message: 'Registro eliminado' }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: 'Se ha generado un error en el servidor' });
    } finally {
        await desconnect();
    }
});

// Control de rutas inexistentes
server.use('*', (req, res) => {
    res.status(404).send(`<h1>Error 404</h1><h3>La URL indicada no existe en este servidor</h3>`);
});

// Método oyente de solicitudes
server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Ejecutandose en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/v1/muebles`);
});