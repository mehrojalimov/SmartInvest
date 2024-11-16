const axios = require('axios');

const config = require('../../env.json');

axios.get('https://yahoo-finance166.p.rapidapi.com/api/news/list-by-symbol', {
  params: { s: 'AAPL,GOOGL,TSLA', region: 'US', snippetCount: 500 },
  headers: {
    'X-RapidAPI-Key': config.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'yahoo-finance166.p.rapidapi.com'
  }
})
.then(response => {
  console.log(response.data);
  //console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error(error);
});
