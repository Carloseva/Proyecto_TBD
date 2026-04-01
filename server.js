// server.js

const express = require('express');
const cors = require('cors'); // Para permitir la comunicación
const multer = require('multer'); // Para manejar archivos
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

let vehiculosDB = [];

// Función de ayuda para saber si un timestamp (como nuestro ID) es de hoy
function esDeHoy(timestamp) {
  const hoy = new Date();
  const fechaTimestamp = new Date(timestamp);
  return fechaTimestamp.setHours(0, 0, 0, 0) === hoy.setHours(0, 0, 0, 0);
}

// --- Middlewares ---
// se comunica el forntend con el backend y server
app.use(cors()); 
// el server.js entiende datos json
app.use(express.json());
// el servidor entiende los datos del forms
app.use(express.urlencoded({ extended: true }));
// la carpeta uploads es accesible publicamente
app.use('/uploads', express.static('uploads'));


// --- Configuración de Multer para guardar archivos ---
const uploadDir = 'uploads/';
// Crea la carpeta 'uploads' si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Le dice a Multer que guarde los archivos en la carpeta 'uploads/'
  },
  filename: function (req, file, cb) {
    // Crea un nombre de archivo único para evitar sobreescribir imágenes
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


// --- Rutas de la API ---
app.get('/', (req, res) => {
  res.send('¡El servidor del corralón está funcionando y listo para recibir datos!');
});

// Esta es la nueva ruta que recibirá los datos del formulario
// 'upload.array('fotos', 10)' significa: "Espera un campo llamado 'fotos' que puede tener hasta 10 archivos"
app.post('/api/registrar-vehiculo', upload.array('fotos', 10), (req, res) => {
  console.log('--- Datos de texto recibidos ---');
  console.log(req.body); // Aquí estarán los datos de texto (placa, marca, etc.)

  console.log('--- Archivos recibidos ---');
  console.log(req.files); // Aquí estará la información de las fotos subidas

  const nuevoVehiculo = {
    id: Date.now(), // Un ID único basado en la fecha
    ...req.body,
    fotos: req.files.map(file => file.path) // Guardamos solo las rutas de las fotos
  };
  vehiculosDB.push(nuevoVehiculo);

  // Enviamos una respuesta de éxito al frontend
  res.status(200).json({ message: 'Vehículo registrado exitosamente en el servidor!' });
});

app.get('/api/vehiculos', (req, res) => {
  res.status(200).json(vehiculosDB);
});

app.get('/api/stats', (req, res) => {
  // Usamos .length para saber el total
  const totalVehiculos = vehiculosDB.length;

  // Usamos .filter() y nuestra función de ayuda para contar los de hoy
  const ingresosHoy = vehiculosDB.filter(v => esDeHoy(v.id)).length;

  // Aún no tenemos la lógica para "liberar" un auto,
  // así que por ahora enviaremos 0.
  const liberadosHoy = 0; 

  // Enviamos los 3 números al frontend
  res.status(200).json({
    totalVehiculos,
    ingresosHoy,
    liberadosHoy
  });
});

app.get('/api/vehiculos/:id', (req, res) => {
  const id = req.params.id;
  // Buscamos en nuestra "base de datos" el vehículo que coincida con el ID
  const vehiculo = vehiculosDB.find(v => v.id.toString() === id);

  if (vehiculo) {
    res.status(200).json(vehiculo);
  } else {
    res.status(404).json({ message: 'Vehículo no encontrado' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});