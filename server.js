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

// 2. CONFIGURACIÓN DE BASE DE DATOS
const dbConfig = {
    user: 'db_ac9b78_corralon26_admin',
    password: 'isroed123', // Tu contraseña de SmarterASP
    server: 'sql1004.site4now.net',
    database: 'db_ac9b78_corralon26',
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
        const result = await pool.request().query('SELECT * FROM VehiculosCorralon');
        const vehiculos = result.recordset.map(v => ({
            ...v,
            fotos: v.Fotos ? JSON.parse(v.Fotos) : []
        }));
        res.json(vehiculos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// OBTENER UN SOLO VEHÍCULO POR SU ID
app.get('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM vehiculos WHERE id = @id');

        if (result.recordset.length > 0) {
            const vehiculo = result.recordset[0];
            vehiculo.fotos = vehiculo.fotos ? JSON.parse(vehiculo.fotos) : [];
            res.json(vehiculo);
        } else {
            res.status(404).json({ message: 'Vehículo no encontrado' });
        }
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
                (SELECT COUNT(*) FROM VehiculosCorralon) as total,
                (SELECT COUNT(*) FROM VehiculosCorralon WHERE CAST(FechaIngreso AS DATE) = CAST(GETDATE() AS DATE)) as hoy,
                (SELECT COUNT(*) FROM VehiculosCorralon WHERE Estado = 'Liberado') as liberados
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REGISTRO DE VEHÍCULO
app.post('/api/registrar-vehiculo', upload.array('fotos', 20), async (req, res) => {
    try {
        const { placa, marca, modelo, anio, color, titulo, motivo, estatus } = req.body;
        const pool = await poolPromise;

        const check = await pool.request()
            .input('p', sql.VarChar, placa)
            .query("SELECT ID_Registro FROM VehiculosCorralon WHERE Placa = @p AND Estado != 'Liberado'");

        if (check.recordset.length > 0) {
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(409).json({ message: 'Error: El vehículo con esta placa ya tiene un registro activo.' });
        }

        const fotosPaths = req.files.map(file => file.path);

        // 👇 CORRECCIÓN 2: Evitamos que un año vacío rompa SQL Server
        const anioParseado = (anio === '' || anio === 'null') ? null : anio;

        await pool.request()
            .input('placa', sql.VarChar, placa)
            .input('marca', sql.VarChar, marca)
            .input('modelo', sql.VarChar, modelo)
            .input('anio', sql.Int, anioParseado) 
            .input('color', sql.VarChar, color)
            .input('titulo', sql.VarChar, titulo)
            .input('motivo', sql.VarChar, motivo)
            .input('fotos', sql.VarChar, JSON.stringify(fotosPaths))
            .input('estatus', sql.VarChar, estatus || 'En Corralon')
            .query(`INSERT INTO VehiculosCorralon (Placa, Marca, Modelo, Anio, Color, TipoDocumento, MotivoIngreso, Fotos, Estado, FechaIngreso) 
                    VALUES (@placa, @marca, @modelo, @anio, @color, @titulo, @motivo, @fotos, @estatus, GETDATE())`);

        res.status(201).json({ success: true, message: 'Vehículo registrado sin duplicados.' });
    } catch (err) {
        console.error("💥 ERROR CRÍTICO AL REGISTRAR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ACTUALIZAR ESTATUS (Liberación)
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

// ELIMINAR VEHÍCULO
app.delete('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const vehiculo = await pool.request().input('id', sql.Int, id)
            .query('SELECT Fotos FROM VehiculosCorralon WHERE ID_Registro = @id');

        if (vehiculo.recordset[0]?.Fotos) {
            const fotos = JSON.parse(vehiculo.recordset[0].Fotos);
            fotos.forEach(path => { if (fs.existsSync(path)) fs.unlinkSync(path); });
        }

        await pool.request().input('id', sql.Int, id).query('DELETE FROM VehiculosCorralon WHERE ID_Registro = @id');
        res.json({ success: true, message: 'Registro y archivos eliminados.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ACTUALIZAR ESTATUS
app.patch('/api/vehiculos/:id/estatus', async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('estatus', sql.VarChar, estatus)
            .query('UPDATE VehiculosCorralon SET Estado = @estatus WHERE ID_Registro = @id');

        res.json({ success: true, message: 'Estatus actualizado correctamente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// OBTENER UN SOLO VEHÍCULO POR SU ID
app.get('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM VehiculosCorralon WHERE ID_Registro = @id');

        if (result.recordset.length > 0) {
            const vehiculo = result.recordset[0];
            vehiculo.fotos = vehiculo.Fotos ? JSON.parse(vehiculo.Fotos) : [];
            res.json(vehiculo);
        } else {
            res.status(404).json({ message: 'Vehículo no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en puerto ${PORT}`);
});

app.put('/api/vehiculos/:id', upload.array('fotosNuevas', 20), async (req, res) => {
    try {
        const { id } = req.params;
        const { placa, marca, modelo, anio, color, titulo, motivo, fotosActualesJson } = req.body;
        const pool = await poolPromise;

        // Recuperamos las fotos que el usuario decidió conservar
        let fotosFinales = fotosActualesJson ? JSON.parse(fotosActualesJson) : [];
        
        // Sumamos las fotos nuevas que subió
        if (req.files && req.files.length > 0) {
            const nuevasRutas = req.files.map(file => file.path);
            fotosFinales = [...fotosFinales, ...nuevasRutas];
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('placa', sql.VarChar, placa)
            .input('marca', sql.VarChar, marca)
            .input('modelo', sql.VarChar, modelo)
            .input('anio', sql.Int, anio)
            .input('color', sql.VarChar, color)
            .input('titulo', sql.VarChar, titulo)
            .input('motivo', sql.Text, motivo)
            .input('fotos', sql.Text, JSON.stringify(fotosFinales))
            .query(`UPDATE VehiculosCorralon 
                    SET Placa = @placa, Marca = @marca, Modelo = @modelo, 
                        Anio = @anio, Color = @color, TipoDocumento = @titulo, 
                        MotivoIngreso = @motivo, Fotos = @fotos 
                    WHERE ID_Registro = @id`);

        res.json({ success: true, message: 'Vehículo actualizado correctamente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await poolPromise;

        // Consulta ajustada a tus columnas: Username y Password
        const result = await pool.request()
            .input('usuario', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query(`
                SELECT u.ID_Usuario, r.NombreRol AS Rol 
                FROM Usuarios u
                INNER JOIN Roles r ON u.ID_Rol = r.ID_Rol
                WHERE u.Username = @usuario AND u.Password = @password
            `);

        // Si el arreglo trae al menos 1 resultado, las credenciales son correctas
        if (result.recordset.length > 0) {
            const usuarioAutenticado = result.recordset[0];
            
            res.json({ 
                success: true, 
                role: usuarioAutenticado.Rol, // Le mandamos a Vue si es Admin, Empleado, etc.
                message: '¡Acceso concedido!' 
            });
        } else {
            // Si no encontró nada, rebotamos la petición con error 401 (No autorizado)
            res.status(401).json({ 
                success: false, 
                message: 'Usuario o contraseña incorrectos.' 
            });
        }
    } catch (err) {
        console.error('Error al intentar iniciar sesión:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});