// server.js

const express = require('express');
const cors = require('cors'); // Para permitir la comunicación
const multer = require('multer'); // Para manejar archivos
const path = require('path');
const fs = require('fs');
const sql = require('mssql');

const app = express();
const port = 3000;

const dbConfig = {
    user: 'db_ac7687_corralondb_admin',
    password: 'passw0rd#',
    server: 'sql5111.site4now.net',
    database: 'db_ac7687_corralondb',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Intentamos conectar a la BD al iniciar el servidor
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server en SmarterASP');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error al conectar a SQL Server:', err);
        // Si quieres que el servidor no arranque si falla la BD, descomenta la siguiente línea:
        // process.exit(1); 
    });


let vehiculosDB = [];

function esDeHoy(timestamp) {
  const hoy = new Date();
  const fechaTimestamp = new Date(timestamp);
  return fechaTimestamp.setHours(0, 0, 0, 0) === hoy.setHours(0, 0, 0, 0);
}

// --- Middlewares ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuración de Multer para guardar archivos ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Asegúrate de que la carpeta exista
  },
  filename: function (req, file, cb) {
    // Esto crea un nombre como: 1712123456789-auto.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

// --- Rutas de la API ---
app.get('/', (req, res) => {
  res.send('¡El servidor del corralón está funcionando y listo para recibir datos!');
});

app.post('/api/registrar-vehiculo', upload.array('fotos'), async (req, res) => {
    try {
        const { placa, marca, modelo, anio, color, titulo, motivo } = req.body;
        const fotosPaths = req.files.map(f => f.path); // Guardamos la ruta tal cual
        
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
            .input('estatus', sql.VarChar, 'Sin especificar')
            .query(`INSERT INTO vehiculos (placa, marca, modelo, anio, color, titulo, motivo, fotos, estatus, fecha_ingreso) 
                    VALUES (@placa, @marca, @modelo, @anio, @color, @titulo, @motivo, @fotos, @estatus, GETDATE())`);

        res.json({ success: true, message: "Vehículo registrado (Beta)" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/vehiculos', async (req, res) => {
    try {
        const pool = await poolPromise;
        // Traemos todos los que no estén liberados
        const result = await pool.request().query("SELECT * FROM vehiculos WHERE liberado_el IS NULL ORDER BY fecha_ingreso DESC");

        const vehiculos = result.recordset.map(v => ({
            ...v,
            fotos: JSON.parse(v.fotos || '[]') // Convertimos el texto en Array
        }));

        res.status(200).json(vehiculos);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Error al obtener vehiculos' });
    }
});

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

app.get('/api/vehiculos/:id', async (req, res) => {
    try {
        const id = req.params.id; // Obtenemos el ID de la URL
        const pool = await poolPromise;
        
        // Buscamos solo el vehículo que coincida con ese ID
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM vehiculos WHERE id = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }

        // Preparamos el objeto para enviarlo al Frontend
        const vehiculo = {
            ...result.recordset[0],
            // IMPORTANTE: Convertimos el texto de las fotos en un Array real
            fotos: JSON.parse(result.recordset[0].fotos || '[]')
        };
        
        res.status(200).json(vehiculo);
    } catch (error) {
        console.error("Error al obtener detalle:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '123') {
        res.json({ success: true, message: "Bienvenido" });
    } else {
        res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
});