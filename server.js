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


// Simulador de BD temporal (Lo iremos reemplazando por SQL en los siguientes commits)
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
app.use('/uploads', express.static('uploads'));

// --- Configuración de Multer para guardar archivos ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- Rutas de la API ---
app.get('/', (req, res) => {
  res.send('¡El servidor del corralón está funcionando y listo para recibir datos!');
});

app.post('/api/registrar-vehiculo', upload.array('fotos', 10), (req, res) => {
  console.log('--- Datos de texto recibidos ---');
  console.log(req.body); 

  console.log('--- Archivos recibidos ---');
  console.log(req.files); 

  const nuevoVehiculo = {
    id: Date.now(), 
    ...req.body,
    fotos: req.files ? req.files.map(file => file.path) : [] 
  };
  vehiculosDB.push(nuevoVehiculo);

  res.status(200).json({ message: 'Vehículo registrado exitosamente en el servidor (Memoria local)!' });
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
        
        // Consultas para las tarjetas del Dashboard
        const total = await pool.request().query("SELECT COUNT(*) as total FROM vehiculos WHERE liberado_el IS NULL");
        const liberados = await pool.request().query("SELECT COUNT(*) as total FROM vehiculos WHERE CAST(liberado_el AS DATE) = CAST(GETDATE() AS DATE)");
        const hoy = await pool.request().query("SELECT COUNT(*) as total FROM vehiculos WHERE CAST(fecha_ingreso AS DATE) = CAST(GETDATE() AS DATE) AND liberado_el IS NULL");

        res.status(200).json({
            totalVehiculos: total.recordset[0].total,
            ingresosHoy: hoy.recordset[0].total,
            liberadosHoy: liberados.recordset[0].total
        });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: 'Error en las estadísticas' });
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