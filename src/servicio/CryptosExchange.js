const express = require('express')
const endpoints = express.Router()
const axios = require('axios')
const config = require('../config/config')

// Imports the Google Cloud client library
const {PubSub} = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();
GOOGLE_APPLICATION_CREDENTIALS = '.\cryptobot-345516-0047de703f40.json'

endpoints.post('/precios/:cantidad_cryptos/:tipo_moneda', async(req, res)=> {
  let { tipo_moneda } = req.params
  let { cantidad_cryptos } = req.params
  let precioDolarColombia = 0
  const formatterUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  })
  const formatterPeso = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  })
  let responsePrecios = await axios.get(config.api_exchange)
  if (responsePrecios && responsePrecios.data.length > 0) {
    let precios = []
    if (tipo_moneda === 'COP') {
      let precioDolarConsultadoAPI = await consultarPrecioDolarColombia()
      precioDolarColombia = (precioDolarConsultadoAPI > 0) ? precioDolarConsultadoAPI : 3800
    }
    for (let precio of responsePrecios.data) {
      let precioCrypto =  {
        nombre: '',
        valor: 0
      }
      if (precios.length < cantidad_cryptos) {
        let valor = (tipo_moneda === 'USD') ? precio.current_price : (precio.current_price * precioDolarColombia)
        precioCrypto.nombre = precio.name
        precioCrypto.valor = (tipo_moneda === 'USD') ? formatterUSD.format(valor) : formatterPeso.format(valor)
        precios.push(precioCrypto)
      }
    }
    res.json(precios)
    precios = JSON.stringify(precios)
    publishMessage(precios)
  } else {
    res.json({
      'Mensaje':'No se encontraron datos.'
    })   
  }
})

endpoints.post('/precio/:nombre/:tipo_moneda', async(req, res)=> {
    let { nombre, tipo_moneda } = req.params
    let precioCrypto =  {
      nombre: '',
      valor: 0
    }
    let precioDolarColombia = 0
    const formatterUSD = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    })
    const formatterPeso = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    })
    try {
      if (tipo_moneda === 'COP') {
        let precioDolarConsultadoAPI = await consultarPrecioDolarColombia()
        precioDolarColombia = (precioDolarConsultadoAPI > 0) ? precioDolarConsultadoAPI : 3800
      }
      let responsePrecios = await axios.get(config.api_exchange)
      if (responsePrecios && responsePrecios.data.length > 0) {
        for (let precio of responsePrecios.data) {
          if (precio.name === nombre) {
            let valor = (tipo_moneda === 'USD') ? precio.current_price : (precio.current_price * precioDolarColombia)
            precioCrypto.nombre = precio.name
            precioCrypto.valor = (tipo_moneda === 'USD') ? formatterUSD.format(valor) : formatterPeso.format(valor)
            break   
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
    if (precioCrypto.nombre !== '') {
      res.json(precioCrypto)
      precioCrypto = JSON.stringify(precioCrypto)
      publishMessage(precioCrypto)
    } else {
      res.json({
        'Mensaje': 'No se ha encontrado la crypto moneda con el nombre ' + nombre
      })
    }
})

let consultarPrecioDolarColombia = async () => {
  let date = new Date()
  let dia = date.getDate()
  let mes = date.getMonth() + 1
  let anio = date.getFullYear()
  const fecha = anio + '-' + mes + '-' + dia
  const urlAPI = `${config.api_dolar_colombia}?vigenciadesde=${fecha}T00:00:00.000`;
  const respuestaAPI = await axios.get(urlAPI)
  if (respuestaAPI.data && respuestaAPI.data.length > 0) {
      const dato = respuestaAPI.data[0]
      return dato.valor
  }
  return 0
}

async function publishMessage(messaging) {
  const dataBuffer = Buffer.from(messaging);
  try {
    const messageId = await pubSubClient
      .topic("projects/cryptobot-345516/topics/value-topic")
      .publishMessage({data:dataBuffer});
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}

/**
 * Conectar a google cloud login
 * gcloud auth application-default login
 */

module.exports = endpoints