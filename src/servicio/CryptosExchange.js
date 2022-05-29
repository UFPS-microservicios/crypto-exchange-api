const express = require('express')
const endpoints = express.Router()
const axios = require('axios')
const config = require('../config/config')

const {PubSub} = require('@google-cloud/pubsub');

const pubSubClient = new PubSub();
GOOGLE_APPLICATION_CREDENTIALS = '.\cryptobot-345516-0047de703f40.json'

//1. Import coingecko-api
const CoinGecko = require('coingecko-api');
 
//2. Initiate the CoinGecko API Client
const CoinGeckoClient = new CoinGecko();
 geckoPing();
//3. Make calls
async function geckoPing()  {
  let data = await CoinGeckoClient.ping()
console.log(await CoinGeckoClient.ping())

};


endpoints.post('/exchange/priceDate', async(req, res) => {
  console.log(req.body,"este es el body")

    
  const buff = Buffer.from(req.body.message.data, 'base64');

  const id=buff.toString('utf-8')
  const chat= JSON.parse(id).chat_id
  let localization=JSON.parse(id).localization
  let date=JSON.parse(id).date
  let type=JSON.parse(id).type
  const urlAPI = 'https://api.coingecko.com/api/v3/coins/'+type+'bitcoin/history?date='+date+'&localization='+localization;
  const respuestaAPI = await axios.get(urlAPI)



})

endpoints.post('/exchange', async(req, res) => {
  const {tipo,tipo_moneda, cantidad_cryptos, nombre,array_monedas,} = req.body
  let datos = 'No se encontro el tipo de solicitud ' + tipo_solicitud
  if (tipo_solicitud == 'precios') {
    const cantidadCryptos = (!cantidad_cryptos || cantidad_cryptos == '' || cantidad_cryptos == undefined) ? 5 : cantidad_cryptos
    const tipoMoneda = (!tipo_moneda || tipo_moneda == '' || tipo_moneda == undefined) ? 'USD' : tipo_moneda
    datos = await consultarPreciosPorCantidad(cantidadCryptos, tipoMoneda)
  } else if (tipo_solicitud == 'precio') {
    const nombreCrypto = (!nombre || nombre == '' || nombre == undefined) ? 'Bitcoin' : capitalizarPrimeraLetra(nombre)
    const tipoMoneda = (!tipo_moneda || tipo_moneda == '' || tipo_moneda == undefined) ? 'USD' : tipo_moneda
    
    datos = await consultarPrecioPorNombre(nombreCrypto, tipoMoneda)
  }
  else if (tipo_solicitud == '') {
    const nombreCrypto = (!nombre || nombre == '' || nombre == undefined) ? 'Bitcoin' : capitalizarPrimeraLetra(nombre)
    const tipoMoneda = (!tipo_moneda || tipo_moneda == '' || tipo_moneda == undefined) ? 'USD' : tipo_moneda
    datos = await consultarPrecioDeArray(array_monedas, tipoMoneda)
    
  }
  res.json(datos)
  datos = JSON.stringify(datos)
  publishMessage(datos)
})

function capitalizarPrimeraLetra(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function consultarPreciosPorCantidad (cantidad_cryptos, tipo_moneda) {
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
    return precios
  } else {
    return 'No se encontraron los precios'
  }
}

async function consultarPrecioPorNombre (nombre, tipo_moneda) {
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
    return precioCrypto
  } else {
    return 'No se encontro el precio de la moneda con el nombre ' + nombre
  }
}

async function consultarPrecioDeArray (array_monedas, tipo_moneda) {
  let i=0
  let rta_array =[array_monedas.length];
for(let precio of array_monedas){
  rta_array[i]=consultarPrecioPorNombre(precio,tipo_moneda)
}
return rta_array
}
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

module.exports = endpoints