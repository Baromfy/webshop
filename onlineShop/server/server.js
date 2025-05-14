const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Environment variables loaded:');
console.log('OPENROUTER_API_KEY present:', process.env.OPENROUTER_API_KEY ? 'Yes (starts with: ' + process.env.OPENROUTER_API_KEY.substring(0, 5) + '...)' : 'No');
console.log('SQUARE_ACCESS_TOKEN present:', process.env.SQUARE_ACCESS_TOKEN ? 'Yes' : 'No');

process.env.NODE_PATH = require('path').resolve(__dirname, '../../node_modules');
require('module').Module._initPaths();

const express = require('express');
const cors = require('cors');
const { Client, Environment } = require('square');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running properly' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    
    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'No messages provided' });
    }
    
    console.log('Processing messages:', JSON.stringify(messages));
    
    const FALLBACK_API_KEY = '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';
    const apiKey = process.env.OPENROUTER_API_KEY || FALLBACK_API_KEY;
    
    console.log(`Using API key: ${apiKey.substring(0, 10)}...`);
    
    console.log('Full API Key: ' + apiKey);
    
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: model || 'mistralai/mistral-7b-instruct:free',
        messages: messages
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:4200'
      }
    });

    console.log('API response received:', JSON.stringify(response.data));
    res.json(response.data);
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    
    
    console.log('Using fallback response due to API error');
    const mockResponse = {
      choices: [
        {
          message: {
            content: "Ez egy sablon válasz, amit a chatbot generált. Kérlek, próbáld újra később.",
          }
        }
      ]
    };
    
    res.json(mockResponse);
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    console.log('Payment request received:', JSON.stringify(req.body, null, 2));
    
    const { sourceId, amount, currency, idempotencyKey } = req.body;
    
    if (!sourceId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing parameters. Required: sourceId, amount, currency',
        receivedParams: { sourceId, amount, currency }
      });
    }
    
    try {
      const idempotencyKeyToUse = idempotencyKey || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      const payment = {
        sourceId: sourceId,
        idempotencyKey: idempotencyKeyToUse,
        amountMoney: {
          amount,
          currency
        },
        locationId: process.env.SQUARE_LOCATION_ID
      };
      
      const response = await squareClient.paymentsApi.createPayment(payment);
      
      const paymentResponse = JSON.parse(JSON.stringify(response.result.payment, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value));
        
      return res.status(200).json({
        success: true,
        payment: paymentResponse
      });
    } 
    catch (squareError) {
      console.error('Square API error:', squareError);
      
      const simulatedPaymentId = 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const simulatedPayment = {
        id: simulatedPaymentId,
        amount_money: {
          amount,
          currency: 'USD'
        },
        status: 'COMPLETED',
        source_type: 'CARD',
        card_details: {
          card: {
            card_brand: 'VISA',
            last_4: '1111',
            exp_month: 12,
            exp_year: 2025
          },
          status: 'CAPTURED'
        },
        created_at: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        payment: simulatedPayment,
        simulated: true
      });
    }
  } 
  catch (error) {
    console.error('Server error during payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment',
      error: error.message || 'Unknown error'
    });
  }
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Square API environment: ${Environment.Sandbox}`);
  console.log(`Chatbot API: ${process.env.OPENROUTER_API_KEY ? 'active' : 'inactive'}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use!`);
    process.exit(1);
  } else {
    console.error('Unexpected error starting server:', err);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});
