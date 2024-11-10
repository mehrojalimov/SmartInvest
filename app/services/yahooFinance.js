const axios = require('axios');
require('dotenv').config();

const options = {
  method: 'GET',
  url: 'https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/AAPL',
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});
