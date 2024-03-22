const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const mongoose= require('mongoose')
const MONGO_URI= process.env.MONGO

mongoose.connect()


module.exports= mongoDb;