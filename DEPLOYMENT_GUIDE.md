# Deployment Guide: Madhubani Craft E-commerce

## Backend Deployment on Vercel

### Step 1: Prepare Your Backend for Vercel

1. **Ensure your `server/vercel.json` is correctly configured** (already done):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to your server directory**:
   ```bash
   cd server
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Choose "Link to existing project?" → No
   - Enter project name: `madhubani-craft-backend`
   - Choose directory: `./` (current directory)
   - Want to override settings? → No

5. **Set Environment Variables on Vercel**:
   Go to your Vercel dashboard → Your project → Settings → Environment Variables

   Add these variables:
   ```
   RAZORPAY_KEY_ID=rzp_live_1KXlVAwRsgJny5
   RAZORPAY_KEY_SECRET=rzp_live_1KXAxdcnU8FAZuqtE8CeNqUktLS
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   FIREBASE_PROJECT_ID=madhubani-craft
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key_here\n-----END PRIVATE KEY-----"
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   REQUEST_ID_SECRET=your_32_character_secret_for_idempotency
   NODE_ENV=production
   ```

6. **Redeploy after setting environment variables**:
   ```bash
   vercel --prod
   ```

### Step 3: Get Your Backend URL
After deployment, Vercel will provide you with a URL like:
`https://madhubani-craft-backend.vercel.app`

## Razorpay Configuration

### Step 1: Razorpay Dashboard Setup

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/

2. **Get API Keys**:
   - Go to Settings → API Keys
   - Generate/Copy your Key ID and Key Secret
   - Use these in your environment variables

3. **Configure Webhooks**:
   - Go to Settings → Webhooks
   - Click "Add New Webhook"
   - Webhook URL: `https://your-vercel-backend-url.vercel.app/razorpay-webhook`
   - Active Events: Select these events:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
   - Secret: Generate a strong secret (save this for RAZORPAY_WEBHOOK_SECRET)
   - Click "Create Webhook"

4. **Test Mode vs Live Mode**:
   - For testing: Use test API keys (they start with `rzp_test_`)
   - For production: Use live API keys (they start with `rzp_live_`)
   - Make sure to activate your account for live mode

### Step 2: Firebase Admin Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `madhubani-craft`
3. **Go to Project Settings** → Service Accounts
4. **Generate new private key**:
   - Click "Generate new private key"
   - Download the JSON file
   - Extract these values for your environment variables:
     - `project_id` → FIREBASE_PROJECT_ID
     - `private_key` → FIREBASE_PRIVATE_KEY
     - `client_email` → FIREBASE_CLIENT_EMAIL

## Frontend Deployment on Hostinger

### Step 1: Update Frontend Configuration

1. **Update your frontend `.env` file**:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyC7h6FIKw0V1hkrBRsxQ-T8U6Ytivn8RNI
   VITE_FIREBASE_AUTH_DOMAIN=madhubani-craft.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=madhubani-craft
   VITE_FIREBASE_STORAGE_BUCKET=madhubani-craft.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=412551218970
   VITE_FIREBASE_APP_ID=1:412551218970:web:063204bd842aa153460ea3
   VITE_CLOUDINARY_CLOUD_NAME=dnhxowoii
   VITE_CLOUDINARY_UPLOAD_PRESET=madhubani-craft
   VITE_RAZORPAY_KEY_ID=rzp_live_1KXlVAwRsgJny5
   VITE_BACKEND_URL=https://your-vercel-backend-url.vercel.app
   ```

2. **Build your frontend**:
   ```bash
   npm run build
   ```

### Step 2: Deploy to Hostinger

1. **Login to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to public_html directory**
4. **Upload your `dist` folder contents**:
   - Upload all files from your `dist` folder to `public_html`
   - Make sure `index.html` is in the root of `public_html`

5. **Configure URL Rewriting** (for React Router):
   Create a `.htaccess` file in `public_html`:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

## Testing Your Deployment

### Step 1: Test Backend
1. Visit: `https://your-vercel-backend-url.vercel.app/health`
2. You should see a JSON response with status "healthy"

### Step 2: Test Frontend
1. Visit: `https://school.worklist.space`
2. Test the complete flow:
   - Browse products
   - Add to cart
   - Proceed to checkout
   - Complete payment (use test cards in test mode)

### Step 3: Test Webhooks
1. Make a test payment
2. Check Vercel logs to see if webhooks are received
3. Verify order status updates in your Firebase console

## Important Security Notes

1. **Never commit sensitive environment variables** to your repository
2. **Use strong, unique secrets** for webhook verification
3. **Enable HTTPS** for all communications
4. **Regularly rotate your API keys** and secrets
5. **Monitor your Vercel and Razorpay logs** for any suspicious activity

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your backend URL is correctly set in frontend
2. **Webhook Failures**: Check webhook URL and secret in Razorpay dashboard
3. **Payment Failures**: Verify Razorpay keys and webhook configuration
4. **Firebase Errors**: Ensure Firebase service account has proper permissions

### Logs to Check:
- Vercel Function Logs: Vercel Dashboard → Your Project → Functions tab
- Razorpay Webhook Logs: Razorpay Dashboard → Webhooks → View Logs
- Browser Console: For frontend errors
- Firebase Console: For database operation errors

## Production Checklist

- [ ] Backend deployed to Vercel with all environment variables
- [ ] Frontend deployed to Hostinger with correct backend URL
- [ ] Razorpay webhooks configured and tested
- [ ] Firebase security rules properly configured
- [ ] SSL certificates active on both domains
- [ ] Test complete payment flow end-to-end
- [ ] Monitor logs for any errors
- [ ] Set up monitoring/alerting for production issues