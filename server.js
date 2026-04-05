const express = require('express');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 1. GESTIÓN DE ARCHIVOS ESTÁTICOS
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// 2. CONFIGURACIÓN DE BASE DE DATOS (SQL SERVER)
const dbConfig = {
    user: 'sa', 
    password: 'tu_password', 
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
        console.log('✅ Conexión exitosa a SQL Server');
        return pool;
    })
    .catch(err => console.log('❌ Error de conexión SQL: ', err));

// 3. CONFIGURACIÓN DE SUBIDA DE IMÁGENES (MULTER)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s/g, '_'));
    }
});
const upload = multer({ storage: storage });

// --- ENDPOINTS DE LA API ---

// OBTENER TODOS LOS VEHÍCULOS
app.get('/api/vehiculos', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM vehiculos');
        const vehiculos = result.recordset.map(v => ({
            ...v,
            fotos: v.fotos ? JSON.parse(v.fotos) : []
        }));
        res.json(vehiculos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ESTADÍSTICAS PARA EL DASHBOARD
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
        res.status(500).json({ error: err.message });
    }
});

// REGISTRO CON VALIDACIÓN DE DUPLICADOS (Lógica pesada)
app.post('/api/registrar-vehiculo', upload.array('fotos', 20), async (req, res) => {
    try {
        const { placa, marca, modelo, anio, color, titulo, motivo, estatus } = req.body;
        const pool = await poolPromise;

        // Validar si la placa ya existe y no ha sido liberada
        const check = await pool.request()
            .input('p', sql.VarChar, placa)
            .query('SELECT id FROM vehiculos WHERE placa = @p AND estatus != "Liberado"');

        if (check.recordset.length > 0) {
            // Si hay fotos subidas por Multer, las borramos para no dejar basura si falla el registro
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(409).json({ message: 'Error: El vehículo con esta placa ya tiene un registro activo.' });
        }

        const fotosPaths = req.files.map(file => file.path);

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

        res.status(201).json({ success: true, message: 'Vehículo registrado sin duplicados.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ELIMINAR VEHÍCULO Y SUS FOTOS FÍSICAS
app.delete('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const vehiculo = await pool.request().input('id', sql.Int, id)
            .query('SELECT fotos FROM vehiculos WHERE id = @id');

        if (vehiculo.recordset[0]?.fotos) {
            const fotos = JSON.parse(vehiculo.recordset[0].fotos);
            fotos.forEach(path => { if (fs.existsSync(path)) fs.unlinkSync(path); });
        }

        await pool.request().input('id', sql.Int, id).query('DELETE FROM vehiculos WHERE id = @id');
        res.json({ success: true, message: 'Registro y archivos eliminados.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en puerto ${PORT}`);
});

app.patch('/api/vehiculos/:id/estatus', async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('estatus', sql.VarChar, estatus)
            .query('UPDATE vehiculos SET estatus = @estatus WHERE id = @id');

        res.json({ success: true, message: 'Estatus actualizado correctamente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});