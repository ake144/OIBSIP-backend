const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter the name'],
    },
    price: {
        type: Number,
        required: [true, 'Please enter the price'],
    },
    bases: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Base',
        },
      ],
      sauces: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sauce',
        },
      ],
      cheeses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Cheese',
        },
      ],
      veggies: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Veggie',
        },
      ],
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        required: true,
      },
      imageUrl: {
        type: String,
      },
});

const Product = mongoose.model('pizzas', pizzaSchema);

module.exports = Product;
