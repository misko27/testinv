const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

const app = express();
const port = 3000;

app.use(cors());

// 1. Get Quote
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const quote = await yahooFinance.quote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Quote error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Search
app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const result = await yahooFinance.search(query);
    res.json(result);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Historical Data (Daily)
app.get('/api/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    // Get last 30 days
    const queryOptions = { period1: '1mo', interval: '1d' };
    const result = await yahooFinance.historical(symbol, queryOptions);
    res.json(result);
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Yahoo Finance proxy server running at http://localhost:${port}`);
});
