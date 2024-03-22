const mongoose = require('mongoose');

const InventoryItem = new mongoose.Schema(
  {
    id:{
      type: mongoose.Schema.Types.ObjectId,auto: true },
    item: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    threshold: { type: Number, default: 10 },
  }
);


const inventory = mongoose.model('inventory', InventoryItem);

module.exports = inventory;