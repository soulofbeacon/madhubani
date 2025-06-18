import express from 'express';
import Razorpay from 'razorpay';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import admin from 'firebase-admin';
import winston from 'winston';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

// Configure Winston Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'madhubani-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();

// Middleware for webhook endpoint (raw body needed for signature verification)
app.use('/razorpay-webhook', express.raw({ type: 'application/json' }));

// Regular JSON middleware for other endpoints
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Tax and shipping configuration
const TAX_RATE = 0.1; // 10%
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 10;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Madhubani Craft Backend Server',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Helper function to generate request ID hash for idempotency
const generateRequestHash = (userId, items, timestamp) => {
  const data = `${userId}-${JSON.stringify(items)}-${timestamp}`;
  return crypto.createHmac('sha256', process.env.REQUEST_ID_SECRET || 'default-secret')
    .update(data)
    .digest('hex');
};

// Helper function to check and store idempotency key in Firestore
const checkIdempotency = async (requestHash) => {
  try {
    const idempotencyRef = db.collection('idempotency_keys').doc(requestHash);
    const idempotencyDoc = await idempotencyRef.get();
    
    if (idempotencyDoc.exists()) {
      // Request already processed, return existing result
      const existingData = idempotencyDoc.data();
      logger.info('Returning existing order for duplicate request', { 
        requestHash, 
        orderId: existingData.razorpayOrderId 
      });
      return existingData.response;
    }
    
    return null; // No existing request found
  } catch (error) {
    logger.error('Error checking idempotency:', error);
    throw error;
  }
};

// Helper function to store idempotency result
const storeIdempotencyResult = async (requestHash, response) => {
  try {
    const idempotencyRef = db.collection('idempotency_keys').doc(requestHash);
    await idempotencyRef.set({
      requestHash,
      response,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Set TTL for cleanup (optional - you can set up Firestore TTL rules)
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    logger.info('Stored idempotency result', { requestHash });
  } catch (error) {
    logger.error('Error storing idempotency result:', error);
    // Don't throw here as the main operation succeeded
  }
};

// Helper function to fetch product prices from Firestore
const fetchProductPrices = async (productIds) => {
  try {
    const productPrices = {};
    const productPromises = productIds.map(async (productId) => {
      const productDoc = await db.collection('products').doc(productId).get();
      if (productDoc.exists) {
        const productData = productDoc.data();
        productPrices[productId] = {
          price: productData.price,
          stock: productData.stock || 0,
          name: productData.name
        };
      }
      return productDoc.exists;
    });

    const results = await Promise.all(productPromises);
    const missingProducts = productIds.filter((_, index) => !results[index]);
    
    if (missingProducts.length > 0) {
      throw new Error(`Products not found: ${missingProducts.join(', ')}`);
    }

    return productPrices;
  } catch (error) {
    logger.error('Error fetching product prices:', error);
    throw error;
  }
};

// Helper function to validate stock availability
const validateStock = (items, productPrices) => {
  const stockIssues = [];
  
  for (const item of items) {
    const productInfo = productPrices[item.id];
    if (productInfo.stock < item.quantity) {
      stockIssues.push({
        productId: item.id,
        productName: productInfo.name,
        requested: item.quantity,
        available: productInfo.stock
      });
    }
  }
  
  return stockIssues;
};

// Helper function to calculate order totals
const calculateOrderTotals = (items, productPrices) => {
  let subtotal = 0;
  
  for (const item of items) {
    const productInfo = productPrices[item.id];
    if (!productInfo) {
      throw new Error(`Product with ID ${item.id} not found`);
    }
    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for product ${item.id}`);
    }
    subtotal += productInfo.price * item.quantity;
  }
  
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;
  
  return { subtotal, tax, shipping, total };
};

// Helper function to reserve stock
const reserveStock = async (items, orderId) => {
  const batch = db.batch();
  
  try {
    for (const item of items) {
      const productRef = db.collection('products').doc(item.id);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock - item.quantity;
        
        if (newStock < 0) {
          throw new Error(`Insufficient stock for product ${item.id}`);
        }
        
        batch.update(productRef, { 
          stock: newStock,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    logger.info(`Stock reserved for order ${orderId}`, { items });
  } catch (error) {
    logger.error(`Failed to reserve stock for order ${orderId}:`, error);
    throw error;
  }
};

// Helper function to release stock
const releaseStock = async (items, orderId) => {
  const batch = db.batch();
  
  try {
    for (const item of items) {
      const productRef = db.collection('products').doc(item.id);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock + item.quantity;
        
        batch.update(productRef, { 
          stock: newStock,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    logger.info(`Stock released for order ${orderId}`, { items });
  } catch (error) {
    logger.error(`Failed to release stock for order ${orderId}:`, error);
    throw error;
  }
};

app.post('/create-order', async (req, res) => {
  try {
    const { amount, items, userId, userEmail, requestTimestamp } = req.body;
    
    // Validate required fields
    if (!amount || !items || !Array.isArray(items) || items.length === 0 || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, items, userId' 
      });
    }

    // Generate request hash for idempotency
    const requestHash = generateRequestHash(userId, items, requestTimestamp || Date.now());
    
    // Check if this request has already been processed (persistent idempotency)
    const existingResult = await checkIdempotency(requestHash);
    if (existingResult) {
      return res.json(existingResult);
    }

    // Extract product IDs and validate items structure
    const productIds = items.map(item => {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid item structure: each item must have id and positive quantity');
      }
      return item.id;
    });

    // Fetch actual product prices from Firestore
    const productPrices = await fetchProductPrices(productIds);
    
    // Validate stock availability
    const stockIssues = validateStock(items, productPrices);
    if (stockIssues.length > 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        stockIssues
      });
    }

    // Calculate totals using server-side prices
    const calculatedTotals = calculateOrderTotals(items, productPrices);

    // Verify amount matches calculated total (with small tolerance for floating point)
    const tolerance = 0.01;
    if (Math.abs(amount - calculatedTotals.total) > tolerance) {
      logger.error('Amount mismatch detected:', {
        userId,
        received: amount,
        calculated: calculatedTotals.total,
        difference: Math.abs(amount - calculatedTotals.total)
      });
      return res.status(400).json({ 
        error: 'Amount validation failed. Please refresh and try again.',
        calculatedTotal: calculatedTotals.total
      });
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(calculatedTotals.total * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      notes: {
        userId: userId,
        userEmail: userEmail || 'guest@example.com',
        itemCount: items.length,
        calculatedTotal: calculatedTotals.total.toString(),
        requestHash: requestHash
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    
    // Reserve stock for this order
    await reserveStock(items, razorpayOrder.id);
    
    // Create order record in Firestore with pending status
    const orderData = {
      razorpayOrderId: razorpayOrder.id,
      userId: userId,
      userEmail: userEmail || 'guest@example.com',
      items: items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: productPrices[item.id].price,
        name: productPrices[item.id].name
      })),
      subtotal: calculatedTotals.subtotal,
      tax: calculatedTotals.tax,
      shipping: calculatedTotals.shipping,
      total: calculatedTotals.total,
      status: 'pending',
      paymentStatus: 'pending',
      stockReserved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      requestHash: requestHash
    };

    const orderRef = await db.collection('orders').add(orderData);
    
    const responseData = {
      ...razorpayOrder,
      calculatedTotals,
      firestoreOrderId: orderRef.id
    };

    // Store the response for idempotency (persistent storage)
    await storeIdempotencyResult(requestHash, responseData);
    
    logger.info('Order created successfully:', {
      razorpayOrderId: razorpayOrder.id,
      firestoreOrderId: orderRef.id,
      userId,
      amount: razorpayOrder.amount,
      calculatedTotal: calculatedTotals.total,
      itemCount: items.length
    });

    res.json(responseData);
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing required payment verification fields' 
      });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isVerified = generated_signature === razorpay_signature;
    
    logger.info('Payment verification attempt:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      verified: isVerified
    });

    if (isVerified) {
      // Update order status in Firestore
      await updateOrderPaymentStatus(razorpay_order_id, 'completed', {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ 
        verified: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    } else {
      logger.error('Payment verification failed:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        expectedSignature: generated_signature,
        receivedSignature: razorpay_signature
      });

      // Update order status to failed
      await updateOrderPaymentStatus(razorpay_order_id, 'failed', {
        failureReason: 'Signature verification failed',
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(400).json({ 
        verified: false,
        error: 'Payment verification failed'
      });
    }
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to update order payment status
const updateOrderPaymentStatus = async (razorpayOrderId, status, additionalData = {}) => {
  try {
    const ordersQuery = await db.collection('orders')
      .where('razorpayOrderId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (!ordersQuery.empty) {
      const orderDoc = ordersQuery.docs[0];
      const orderData = orderDoc.data();
      
      await orderDoc.ref.update({
        paymentStatus: status,
        status: status === 'completed' ? 'processing' : status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...additionalData
      });

      // If payment failed and stock was reserved, release it
      if (status === 'failed' && orderData.stockReserved) {
        await releaseStock(orderData.items, razorpayOrderId);
        await orderDoc.ref.update({ stockReserved: false });
      }

      logger.info(`Order payment status updated to ${status}`, { 
        razorpayOrderId, 
        firestoreOrderId: orderDoc.id 
      });
    } else {
      logger.warn('Order not found for payment status update', { razorpayOrderId });
    }
  } catch (error) {
    logger.error('Error updating order payment status:', error);
    throw error;
  }
};

// Razorpay Webhook endpoint
app.post('/razorpay-webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.error('Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not properly configured' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      logger.error('Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Parse webhook payload
    const payload = JSON.parse(req.body.toString());
    const event = payload.event;
    const paymentEntity = payload.payload.payment?.entity;
    const orderEntity = payload.payload.order?.entity;

    logger.info('Webhook received:', {
      event,
      orderId: orderEntity?.id || paymentEntity?.order_id,
      paymentId: paymentEntity?.id,
      status: paymentEntity?.status
    });

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(paymentEntity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(paymentEntity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(orderEntity);
        break;
      
      default:
        logger.info('Unhandled webhook event:', event);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook event handlers
async function handlePaymentCaptured(paymentEntity) {
  try {
    logger.info('Processing payment captured:', {
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id,
      amount: paymentEntity.amount
    });

    // Find the order in Firestore
    const ordersQuery = await db.collection('orders')
      .where('razorpayOrderId', '==', paymentEntity.order_id)
      .limit(1)
      .get();

    if (!ordersQuery.empty) {
      const orderDoc = ordersQuery.docs[0];
      const orderData = orderDoc.data();

      // Update order status to completed/processing
      await orderDoc.ref.update({
        status: 'processing',
        paymentStatus: 'completed',
        razorpayPaymentId: paymentEntity.id,
        capturedAt: admin.firestore.FieldValue.serverTimestamp(),
        capturedAmount: paymentEntity.amount / 100, // Convert from paise to rupees
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Stock is already reserved, so no need to update stock again
      // But we can add order tracking information
      await orderDoc.ref.update({
        orderDate: admin.firestore.FieldValue.serverTimestamp(),
        trackingInfo: {
          orderPlaced: admin.firestore.FieldValue.serverTimestamp(),
          status: 'Order confirmed and being processed'
        }
      });

      logger.info('Payment captured successfully processed', {
        firestoreOrderId: orderDoc.id,
        razorpayOrderId: paymentEntity.order_id,
        paymentId: paymentEntity.id
      });

      // Here you could also:
      // - Send confirmation email to customer
      // - Notify warehouse/fulfillment system
      // - Update analytics/reporting systems
      
    } else {
      logger.warn('Order not found for payment captured event', {
        razorpayOrderId: paymentEntity.order_id
      });
    }
  } catch (error) {
    logger.error('Error handling payment captured:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentEntity) {
  try {
    logger.info('Processing payment failed:', {
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id,
      errorCode: paymentEntity.error_code,
      errorDescription: paymentEntity.error_description
    });

    // Find the order in Firestore
    const ordersQuery = await db.collection('orders')
      .where('razorpayOrderId', '==', paymentEntity.order_id)
      .limit(1)
      .get();

    if (!ordersQuery.empty) {
      const orderDoc = ordersQuery.docs[0];
      const orderData = orderDoc.data();

      // Update order status to failed
      await orderDoc.ref.update({
        status: 'failed',
        paymentStatus: 'failed',
        razorpayPaymentId: paymentEntity.id,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        errorCode: paymentEntity.error_code,
        errorDescription: paymentEntity.error_description,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Release reserved stock
      if (orderData.stockReserved) {
        await releaseStock(orderData.items, paymentEntity.order_id);
        await orderDoc.ref.update({ stockReserved: false });
      }

      logger.info('Payment failed successfully processed', {
        firestoreOrderId: orderDoc.id,
        razorpayOrderId: paymentEntity.order_id,
        paymentId: paymentEntity.id
      });

      // Here you could also:
      // - Send failure notification to customer
      // - Log for fraud detection if needed
      // - Update analytics/reporting systems
      
    } else {
      logger.warn('Order not found for payment failed event', {
        razorpayOrderId: paymentEntity.order_id
      });
    }
  } catch (error) {
    logger.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleOrderPaid(orderEntity) {
  try {
    logger.info('Processing order paid:', {
      orderId: orderEntity.id,
      amount: orderEntity.amount,
      status: orderEntity.status
    });

    // This is a backup handler in case payment.captured is not received
    // Find the order in Firestore
    const ordersQuery = await db.collection('orders')
      .where('razorpayOrderId', '==', orderEntity.id)
      .limit(1)
      .get();

    if (!ordersQuery.empty) {
      const orderDoc = ordersQuery.docs[0];
      const currentData = orderDoc.data();

      // Only update if payment status is still pending
      if (currentData.paymentStatus === 'pending') {
        await orderDoc.ref.update({
          status: 'processing',
          paymentStatus: 'completed',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info('Order paid successfully processed', {
          firestoreOrderId: orderDoc.id,
          razorpayOrderId: orderEntity.id
        });
      } else {
        logger.info('Order payment status already updated', {
          firestoreOrderId: orderDoc.id,
          currentStatus: currentData.paymentStatus
        });
      }
    } else {
      logger.warn('Order not found for order paid event', {
        razorpayOrderId: orderEntity.id
      });
    }
  } catch (error) {
    logger.error('Error handling order paid:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      razorpay: !!process.env.RAZORPAY_KEY_ID,
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      webhook: !!process.env.RAZORPAY_WEBHOOK_SECRET
    }
  });
});

// Cleanup function for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    razorpayConfigured: !!process.env.RAZORPAY_KEY_ID,
    firebaseConfigured: !!process.env.FIREBASE_PROJECT_ID,
    webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET
  });
});