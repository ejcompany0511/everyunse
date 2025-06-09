import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Simple test server to simulate payment flow
const app = express();
app.use(cors());
app.use(express.json());

// Test payment creation
app.post('/test/create-payment', async (req, res) => {
  try {
    const testPayment = {
      storeId: process.env.VITE_PORTONE_STORE_ID || 'imp25772872',
      channelKey: process.env.VITE_PORTONE_CHANNEL_KEY || 'test_channel',
      paymentId: `test_${Date.now()}`,
      orderName: req.body.orderName || '테스트 결제',
      totalAmount: req.body.amount || 5000,
      currency: 'KRW',
      payMethod: 'CARD',
      customer: {
        fullName: req.body.customerName || '테스트사용자',
        email: req.body.customerEmail || 'test@everyunse.com',
        phoneNumber: req.body.customerPhone || '010-1234-5678'
      },
      redirectUrl: 'https://everyunse.replit.app/payment/complete',
      customData: {
        userId: req.body.userId || '1',
        serviceType: req.body.serviceType || 'coin_charge'
      }
    };

    console.log('Test payment created:', testPayment);
    
    res.json({
      success: true,
      paymentData: testPayment,
      orderId: testPayment.paymentId
    });
  } catch (error) {
    console.error('Test payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test payment verification
app.post('/test/verify-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    // Simulate successful payment verification
    const mockVerification = {
      status: 'PAID',
      amount: { total: 5000 },
      customData: {
        userId: '1',
        serviceType: 'coin_charge'
      },
      paidAt: new Date().toISOString()
    };

    console.log('Test verification for:', paymentId);
    
    res.json({
      success: true,
      verified: true,
      paymentData: mockVerification
    });
  } catch (error) {
    console.error('Test verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Test Server Running',
    service: 'Payment Integration Test',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.TEST_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧪 Payment Test Server running on port ${PORT}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   POST /test/create-payment`);
  console.log(`   POST /test/verify-payment`);
  console.log(`   GET / (health check)`);
});