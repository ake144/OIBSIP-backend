const bcrypt = require('bcryptjs');


const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
    phoneNumber: '123-456-7890',
    address: '123 Main St, City',
    role: 'admin',
    orders: [],
    isVerified: true,
    verificationCode: '123456',
    resetPasswordToken: null,
    resetPasswordExpire: null,
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: bcrypt.hashSync('123456', 10),
    phoneNumber: '123-456-7890',
    address: '123 Main St, City',
    role: 'user',
    orders: [],
    isVerified: true,
    verificationCode: '098765',
    resetPasswordToken: null,
    resetPasswordExpire: null,
  },
];

module.exports = { users };