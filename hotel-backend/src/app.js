require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/cuartos',       require('./routes/cuartos'));
app.use('/api/clientes',      require('./routes/clientes'));
app.use('/api/grupos',        require('./routes/grupos'));
app.use('/api/facturas',      require('./routes/facturas'));
app.use('/api/reservaciones', require('./routes/reservaciones'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Hotel API → http://localhost:${PORT}`));
