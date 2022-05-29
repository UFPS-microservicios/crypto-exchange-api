const express = require('express')
const endpoints = express.Router()
const axios = require('axios')
const config = require('../config/config')

const {PubSub} = require('@google-cloud/pubsub');

const pubSubClient = new PubSub();
GOOGLE_APPLICATION_CREDENTIALS = '.\cryptobot-345516-0047de703f40.json'

endpoints.post('/exchange', async (req, res) =>{
    const buff = Buffer.from(req.body.message.data, 'base64');
    const id=buff.toString('utf-8')

  //const { chat_id, cryptos, rango } = JSON.parse(id)
 const chat_id =JSON.parse(id).chat_id
  const cryptos =JSON.parse(id).cryptos
  const rango =JSON.parse(id).rango
  let respuesta = {
    chat_id: '',
    cryptos: []
  }
  respuesta.chat_id = chat_id
  console.log("id"+chat_id)
  respuesta.cryptos = await consultarPrecioMoneda(cryptos, rango)
  console.log("cryptos"+cryptos)
  console.log("rango"+rango)
  res.json(respuesta)
  respuesta = JSON.stringify(respuesta)
  publishMessage(respuesta)
})

async function consultarPrecioMoneda (cryptos, rango) {
  let arregloCryptos = []
  const formatterUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  })
  try {
    if (cryptos && cryptos.length > 0) {
      for (let crypto of cryptos) {
        const response = await axios.get(config.api_exchange_history  + crypto + '/market_chart?vs_currency=USD&days='+ rango +'&interval=daily')
        const datos = response.data.prices
        let cryptoMoneda = {
          nombre: crypto,
          history: []
        }
        const valores = datos
        const history = []
        for  (let valor of valores) {
          console.log(valor, 'valor')
          const valorGuardar = parseFloat(valor[1].toFixed(3))
          history.push(valorGuardar)
        }
        cryptoMoneda.history = history
        arregloCryptos.push(cryptoMoneda)
      }
    }
  } catch (error) {
    console.log(error)
  }
  return arregloCryptos
}

async function publishMessage(messaging) {
    console.log("message"+messaging)
  const dataBuffer = Buffer.from(messaging);
 // console.log(dataBuffer)
  const buff = Buffer.from(messaging, 'base64');

  const id=buff.toString('utf-8')


  try {
    const messageId = await pubSubClient
      .topic("projects/cryptobot-345516/topics/exchange-topic")
      .publishMessage({data:dataBuffer});
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = endpoints