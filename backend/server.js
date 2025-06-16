const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

// ✅ Allow frontend on localhost:8000
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true
}));

// ✅ Parse JSON request bodies
app.use(express.json());

// ✅ Setup MySQL-backed session store
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: 'Hloki14@',
    database: 'ratings_review'
});

// ✅ Setup session middleware before routes
app.use(session({
    secret: 'mySuperSecretKey123',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ✅ Debug session log (optional)
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Session ID:', req.sessionID);
    console.log('Session data before route:', req.session);
    next();
});

// ✅ Register routes AFTER session is ready
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
