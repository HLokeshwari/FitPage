const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('[SIGNUP] Incoming:', { username, email });

    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email or username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('[SIGNUP] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        req.session.user = { id: user.id, username: user.username, email: user.email };
        res.json({ message: 'Signed in successfully', user: req.session.user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', (req, res) => {
    try {
        console.log('[AUTH /me] Session:', req.session);
        if (req.session && req.session.user) {
            res.json({ user: req.session.user });
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    } catch (error) {
        console.error('[AUTH /me] Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/signout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Signed out successfully' });
});

module.exports = router;