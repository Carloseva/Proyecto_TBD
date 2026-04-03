const express = require('express');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE CARPETA ESTÁTICA
// Esto permite que el navegador vea las fotos en http://localhost:3000/uploads/...
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// 2. CONFIGURACIÓN DE SQL SERVER
const dbConfig = {
    user: 'sa', // Tu usuario de SQL
    password: 'tu_password', // Tu contraseña
    server: 'localhost',
    database: 'CorralinkDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server (CorralinkDB)');
        return pool;
    })
    .catch(err => console.log('❌ Error de conexión a la base de datos: ', err));

// 3. CONFIGURACIÓN DE MULTER (GESTIÓN DE IMÁGENES)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        // Nombre único profesional: timestamp-random-nombre.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage });

// --- RUTAS DE LA API ---

// A) Obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM vehiculos');
        
        // Parsear el JSON de fotos de cada vehículo antes de enviarlo al frontend
        const vehiculos = result.recordset.map(v => ({
            ...v,
            fotos: v.fotos ? JSON.parse(v.fotos) : []
        }));
        res.json(vehiculos);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// B) Obtener estadísticas para el Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM vehiculos) as total,
                (SELECT COUNT(*) FROM vehiculos WHERE CAST(fecha_ingreso AS DATE) = CAST(GETDATE() AS DATE)) as hoy,
                (SELECT COUNT(*) FROM vehiculos WHERE estatus = 'Liberado') as liberados
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// C) Registrar nuevo vehículo (Soporta hasta 20 fotos)
app.post('/api/registrar-vehiculo', upload.array('fotos', 20), async (req, res) => {
    try {
        const { placa, marca, modelo, anio, color, titulo, motivo, estatus } = req.body;
        const fotosPaths = req.files.map(file => file.path); // Guardamos la ruta del archivo

        const pool = await poolPromise;
        await pool.request()
            .input('placa', sql.VarChar, placa)
            .input('marca', sql.VarChar, marca)
            .input('modelo', sql.VarChar, modelo)
            .input('anio', sql.Int, anio)
            .input('color', sql.VarChar, color)
            .input('titulo', sql.VarChar, titulo)
            .input('motivo', sql.Text, motivo)
            .input('fotos', sql.Text, JSON.stringify(fotosPaths))
            .input('estatus', sql.VarChar, estatus || 'Ingresado')
            .query(`INSERT INTO vehiculos (placa, marca, modelo, anio, color, titulo, motivo, fotos, estatus, fecha_ingreso) 
                    VALUES (@placa, @marca, @modelo, @anio, @color, @titulo, @motivo, @fotos, @estatus, GETDATE())`);

        res.json({ success: true, message: 'Vehículo registrado correctamente' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// D) Eliminar vehículo (Registro + Fotos físicas)
app.delete('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // 1. Buscamos las fotos para borrarlas del disco duro
        const vehiculo = await pool.request().input('id', sql.Int, id)
            .query('SELECT fotos FROM vehiculos WHERE id = @id');

        if (vehiculo.recordset[0] && vehiculo.recordset[0].fotos) {
            const fotos = JSON.parse(vehiculo.recordset[0].fotos);
            fotos.forEach(fotoPath => {
                if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
            });
        }

        // 2. Borramos de la base de datos
        await pool.request().input('id', sql.Int, id).query('DELETE FROM vehiculos WHERE id = @id');
        
        res.json({ success: true, message: 'Vehículo y archivos eliminados' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Corralink corriendo en http://localhost:${PORT}`);
});