require('dotenv').config();

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

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    let productDb;
    try {
      productDb = require('./prdouctDatabase.json');
    } catch (dbError) {
      try {
        console.log('Database not found in current directory, trying parent directory...');
        productDb = require('../../server/prdouctDatabase.json');
      } catch (parentDbError) {
        console.error('Failed to load product database', parentDbError);
        return res.status(500).json({ error: 'Product database not found' });
      }
    }
    
    const isProductQuestion = userMessage.includes('laptop') || 
                             userMessage.includes('product') ||
                             userMessage.includes('computer') ||
                             userMessage.includes('device') ||
                             userMessage.includes('processor') ||
                             userMessage.includes('gpu') ||
                             userMessage.includes('graphics') || 
                             userMessage.includes('specs') ||
                             userMessage.includes('price') ||
                             userMessage.includes('brand') ||
                             userMessage.includes('dell') ||
                             userMessage.includes('asus') ||
                             userMessage.includes('lenovo') ||
                             userMessage.includes('hp') ||
                             userMessage.includes('apple') ||
                             userMessage.includes('macbook') ||
                             userMessage.includes('acer') ||
                             userMessage.includes('msi') ||
                             userMessage.includes('suitable') ||
                             userMessage.includes('better value') ||
                             userMessage.includes('which laptop is more') ||
                             userMessage.includes('which is a better');
    
    let aiMessages = [...messages];
    
    if (messages[0].role === 'system') {
      if (isProductQuestion) {
        aiMessages[0] = {
          role: "system",
          content: "You're a laptop expert. Answer questions about specs, prices, and comparisons based on the following database. " +
                   "Only use information found in this database when answering product-specific questions. " +
                   "Here's the summary of available products: " + 
                   JSON.stringify(productDb.products.map(p => ({
                     id: p.id,
                     name: p.name,
                     brand: p.brand,
                     price: p.price,
                     processor: p.specs.processor.type,
                     memory: p.specs.memory.size + "GB",
                     storage: p.specs.storage.capacity + "GB " + p.specs.storage.type,
                     display: p.specs.display.size + "\" " + p.specs.display.resolution,
                     graphics: p.specs.graphics.type
                   })))
        };
      } else {
        aiMessages[0] = {
          role: "system",
          content: "You're a helpful assistant who can answer questions on a wide range of topics."
        };
      }
    } else {
      if (isProductQuestion) {
        aiMessages.unshift({
          role: "system",
          content: "You're a laptop expert. Answer questions about specs, prices, and comparisons based on the following database. " +
                   "Only use information found in this database when answering product-specific questions. " +
                   "Here's the summary of available products: " + 
                   JSON.stringify(productDb.products.map(p => ({
                     id: p.id,
                     name: p.name,
                     brand: p.brand,
                     price: p.price,
                     processor: p.specs.processor.type,
                     memory: p.specs.memory.size + "GB",
                     storage: p.specs.storage.capacity + "GB " + p.specs.storage.type,
                     display: p.specs.display.size + "\" " + p.specs.display.resolution,
                     graphics: p.specs.graphics.type
                   })))
        });
      } else {
        aiMessages.unshift({
          role: "system",
          content: "You're a helpful assistant who can answer questions on a wide range of topics."
        });
      }
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: aiMessages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': req.headers.referer || 'https://your-laptop-store.com',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from AI' });
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
