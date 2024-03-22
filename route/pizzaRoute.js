const express = require('express');

require ('dotenv').config ()
const cors = require('cors');

const Product = require('./../models/pizza.models');
const router = express.Router();

router.get('/api/pizzas', async (req, res) => {
    try {
        const pizzas = await Product.find({});
        res.status(200).json(pizzas);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;