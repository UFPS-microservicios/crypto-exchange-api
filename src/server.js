const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

/**
 *  Middlewares
 */
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}));

/**
 * Servicios o rutas
 */
const valorCrypto = require('./servicio/Cryptos')

app.use('/', valorCrypto)

module.exports = app