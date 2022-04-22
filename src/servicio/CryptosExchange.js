const express = require('express')
const endpoints = express.Router()
const axios = require('axios')
const config = require('../config/config')

endpoints.get('/precios/:cantidad_cryptos', async(req, res)=> {
  let { cantidad_cryptos } = req.params
  let responsePrecios = await axios.get(config.api_exchange)
  if (responsePrecios && responsePrecios.data.length > 0) {
    let precios = []
    for (let precio of responsePrecios.data) {
      let precioCrypto =  {
        nombre: '',
        valor: 0
      }
      if (precios.length < cantidad_cryptos) {
        precioCrypto.nombre = precio.name
        precioCrypto.valor = precio.current_price
        precios.push(precioCrypto)
      }
    }
    res.json(precios)
  } else {
    res.json({
      'Mensaje':'No se encontraron datos.'
    })
  }
})

endpoints.get('/precio/:nombre', async(req, res)=> {
    let { nombre } = req.params
    let precioCrypto =  {
      nombre: '',
      valor: 0
    }
    try {
      let responsePrecios = await axios.get(config.api_exchange)
      if (responsePrecios && responsePrecios.data.length > 0) {
        for (let precio of responsePrecios.data) {
          if (precio.name === nombre) {
            precioCrypto.nombre = precio.name
            precioCrypto.valor = precio.current_price
            break   
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
    if (precioCrypto.nombre !== '') {
      res.json(precioCrypto)
    } else {
      res.json({
        'Mensaje': 'No se ha encontrado la crypto moneda con el nombre ' + nombre
      })
    }
})

let precioDolarColombia = async () => {
  const {dia, mes, anio} = req.params
  const fecha = anio + '-' + mes + '-' + dia
  const urlAPI = `${config.api_dolar_colombia}?vigenciadesde=${fecha}T00:00:00.000`;

  const respuestaAPI = await axios.get(urlAPI)
  console.log(respuestaAPI.data)
  if (respuestaAPI.data && respuestaAPI.data.length > 0) {
      const dato = respuestaAPI.data[0]
      return dato.valor
  }
  return 0
}



module.exports = endpoints