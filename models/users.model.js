const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    address:{
        type:String,

    },
    role: {
      type: String,
      default:'user'
                 
    },
    cartItem: [
      {
        id: String,
        name: String,
        price: Number,
        qty: Number,
        size: String,
        img: String,
        timeAdded: { type: Date, default: Date.now },
      }
    ],
    PlacedOrders: [
      [{
        id: String,
        name: String,
        price: Number,
        qty: Number,
        size: String,
        img: String, 
        Status: { type: String, default: 'ordered' },
      }
    ]
    ],
    otp: {
      type: Number,
      unique: true,
    },  
    isVerified: {
        type: Boolean,
        default: false, // Email verification status (default is false)
      },
  
      verificationCode: {
        type: String,
        unique: true,
      },
  
      // Password Reset
      resetPasswordToken: {
        type: String,
      },
      resetPasswordExpire: {
        type: Date,
      },
    },
    {
      // Timestamps
      timestamps: true, // Adds createdAt and updatedAt timestamps
    },
);

const UsersModel = mongoose.model('Users', userSchema);

module.exports = UsersModel;
