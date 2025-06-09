import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://everyunse.replit.app',
    'http://localhost:5000',
    /\.replit\.app$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'EVERYUNSE Payment Server',
    timestamp: new Date().toISOString()
  });
});

// PortOne 결제 요청 생성
app.post('/api/create-payment', async (req, res) => {
  try {
    const { 
      amount, 
      orderName, 
      customerName, 
      customerEmail, 
      customerPhone,
      userId,
      serviceType 
    } = req.body;

    // 고유 주문 ID 생성
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const paymentData = {
      storeId: process.env.VITE_PORTONE_STORE_ID,
      channelKey: process.env.VITE_PORTONE_CHANNEL_KEY,
      paymentId: orderId,
      orderName,
      totalAmount: amount,
      currency: 'KRW',
      payMethod: 'CARD',
      customer: {
        fullName: customerName,
        email: customerEmail,
        phoneNumber: customerPhone
      },
      redirectUrl: `${process.env.REPLIT_APP_URL}/payment/complete`,
      notificationUrls: [
        `${process.env.RENDER_API_URL}/api/payment/webhook`
      ],
      customData: {
        userId: userId.toString(),
        serviceType
      }
    };

    res.json({
      success: true,
      paymentData,
      orderId
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: '결제 요청 생성 중 오류가 발생했습니다.'
    });
  }
});

// PortOne 결제 검증
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;

    const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = await response.json();

    if (paymentData.status === 'PAID') {
      // 결제 성공 시 Replit 서버에 알림
      const notifyReplit = await fetch(`${process.env.REPLIT_API_URL}/api/payment/success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          paymentId,
          amount: paymentData.amount.total,
          userId: paymentData.customData?.userId,
          serviceType: paymentData.customData?.serviceType,
          paidAt: paymentData.paidAt
        })
      });

      res.json({
        success: true,
        verified: true,
        paymentData
      });
    } else {
      res.json({
        success: true,
        verified: false,
        status: paymentData.status
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: '결제 검증 중 오류가 발생했습니다.'
    });
  }
});

// PortOne Webhook 수신
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook received:', { type, paymentId: data?.paymentId });

    if (type === 'Transaction.Paid') {
      // 결제 완료 시 Replit 서버에 알림
      await fetch(`${process.env.REPLIT_API_URL}/api/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
        },
        body: JSON.stringify({
          paymentId: data.paymentId,
          amount: data.amount.total,
          userId: data.customData?.userId,
          serviceType: data.customData?.serviceType,
          paidAt: data.paidAt
        })
      });
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`💳 Payment Server running on port ${PORT}`);
  console.log(`🔗 Store ID: ${process.env.VITE_PORTONE_STORE_ID}`);
  console.log(`🔗 Replit App: ${process.env.REPLIT_APP_URL}`);
});