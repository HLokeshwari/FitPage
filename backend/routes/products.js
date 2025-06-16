const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        for (let product of products) {
            const [reviews] = await db.query(`
                SELECT r.*, u.username 
                FROM reviews r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.product_id = ?
            `, [product.id]);
            const [avgRating] = await db.query('SELECT AVG(rating) as avg_rating, COUNT(rating) as rating_count FROM reviews WHERE product_id = ?', [product.id]);
            product.reviews = reviews;
            product.avg_rating = parseFloat(avgRating[0].avg_rating) || 0;
            product.rating_count = avgRating[0].rating_count;
        }
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/review', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be signed in to submit a review' });
    }
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const user_id = req.session.user.id;

    if (!rating && !review_text) {
        return res.status(400).json({ error: 'Either rating or review text is required' });
    }
    try {
        const [existingReview] = await db.query('SELECT * FROM reviews WHERE product_id = ? AND user_id = ?', [id, user_id]);
        if (existingReview.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        await db.query('INSERT INTO reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)', 
            [id, user_id, rating || null, review_text || '']);
        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/review', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be signed in to edit a review' });
    }
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const user_id = req.session.user.id;

    if (!rating && !review_text) {
        return res.status(400).json({ error: 'Either rating or review text is required' });
    }
    try {
        const [existingReview] = await db.query('SELECT * FROM reviews WHERE product_id = ? AND user_id = ?', [id, user_id]);
        if (existingReview.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        await db.query('UPDATE reviews SET rating = ?, review_text = ?, created_at = NOW() WHERE product_id = ? AND user_id = ?', 
            [rating || null, review_text || '', id, user_id]);
        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id/review', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be signed in to delete a review' });
    }
    const { id } = req.params;
    const user_id = req.session.user.id;

    try {
        const [existingReview] = await db.query('SELECT * FROM reviews WHERE product_id = ? AND user_id = ?', [id, user_id]);
        if (existingReview.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        await db.query('DELETE FROM reviews WHERE product_id = ? AND user_id = ?', [id, user_id]);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;