import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadioGroup } from '@headlessui/react';
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import useCartStore from '../store/cartStore';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const paymentMethods = [
  {
    id: 'razorpay',
    title: 'Razorpay',
    description: 'Pay securely with Razorpay',
    icon: '💳'
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: '💵'
  }
];

function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const { currentUser } = useAuth();
  const { items, subtotal, tax, shipping, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFormValid = () => {
    return (
      shippingAddress.street &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.zipCode &&
      shippingAddress.country &&
      agreedToTerms
    );
  };

  const createPendingOrder = async (razorpayOrderId = null) => {
    const orderData = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      })),
      shippingAddress,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod: selectedPaymentMethod.id,
      paymentStatus: 'pending',
      status: 'pending',
      orderDate: new Date().toISOString(),
      razorpayOrderId: razorpayOrderId,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  };

  const updateOrderStatus = async (orderId, status, paymentData = {}) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        paymentStatus: status === 'processing' ? 'completed' : status,
        updatedAt: new Date().toISOString(),
        ...paymentData
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleRazorpayPayment = async () => {
    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load');
      return;
    }

    setPaymentProcessing(true);

    try {
      // Prepare items data for backend validation with request timestamp for idempotency
      const requestTimestamp = Date.now();
      const itemsForBackend = items.map(item => ({
        id: item.id,
        quantity: item.quantity
        // Note: We don't send price anymore - backend will fetch it
      }));

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: total,
          items: itemsForBackend,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          requestTimestamp: requestTimestamp
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { id, amount, calculatedTotals, firestoreOrderId } = await response.json();

      // Verify that backend calculated totals match frontend (with tolerance)
      if (Math.abs(calculatedTotals.total - total) > 0.01) {
        throw new Error('Price mismatch detected. Please refresh and try again.');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "Madhubani Craft",
        description: "Payment for your order",
        order_id: id,
        handler: async function (response) {
          try {
            setPaymentProcessing(true);
            
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verificationResult = await verifyResponse.json();
            
            if (verificationResult.verified) {
              toast.success('Payment successful!');
              clearCart();
              navigate('/checkout/success');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Payment verification failed');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setPaymentProcessing(false);
            toast.error('Payment cancelled');
          }
        },
        prefill: {
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
        },
        theme: {
          color: "#2563EB",
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      // Handle payment failures
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setPaymentProcessing(false);
        toast.error(`Payment failed: ${response.error.description}`);
      });

      paymentObject.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      setPaymentProcessing(false);
      
      // Handle specific error types
      if (error.message.includes('Insufficient stock')) {
        toast.error('Some items in your cart are out of stock. Please update your cart.');
      } else if (error.message.includes('Price mismatch')) {
        toast.error('Product prices have been updated. Please refresh and try again.');
      } else {
        toast.error(error.message || 'Failed to initiate payment');
      }
    }
  };

  const handleCODOrder = async () => {
    try {
      setLoading(true);
      
      // For COD, we still need to validate with backend
      const requestTimestamp = Date.now();
      const itemsForBackend = items.map(item => ({
        id: item.id,
        quantity: item.quantity
      }));

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: total,
          items: itemsForBackend,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          requestTimestamp: requestTimestamp
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { calculatedTotals } = await response.json();

      // Verify totals match
      if (Math.abs(calculatedTotals.total - total) > 0.01) {
        throw new Error('Price mismatch detected. Please refresh and try again.');
      }

      // Create order in Firestore with COD status
      const orderId = await createPendingOrder();
      
      // For COD, we can immediately set status to confirmed
      await updateOrderStatus(orderId, 'confirmed', {
        paymentMethod: 'cod',
        confirmedAt: new Date().toISOString()
      });
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/checkout/success');
    } catch (error) {
      console.error('Failed to place COD order:', error);
      
      if (error.message.includes('Insufficient stock')) {
        toast.error('Some items in your cart are out of stock. Please update your cart.');
      } else if (error.message.includes('Price mismatch')) {
        toast.error('Product prices have been updated. Please refresh and try again.');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields and agree to the terms');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (selectedPaymentMethod.id === 'razorpay') {
        await handleRazorpayPayment();
      } else if (selectedPaymentMethod.id === 'cod') {
        await handleCODOrder();
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Payment Processing Overlay */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600">Please don't close this window...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column - Form */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please review your order and complete the checkout process
              </p>
            </div>

            {/* Shipping Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleAddressChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
              <RadioGroup value={selectedPaymentMethod} onChange={setSelectedPaymentMethod}>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <RadioGroup.Option
                      key={method.id}
                      value={method}
                      className={({ checked }) =>
                        clsx(
                          'relative block cursor-pointer rounded-lg border px-6 py-4 shadow-sm focus:outline-none',
                          checked
                            ? 'border-blue-500 ring-2 ring-blue-500'
                            : 'border-gray-300'
                        )
                      }
                    >
                      {({ checked }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="mr-3">{method.icon}</span>
                              <div>
                                <RadioGroup.Label as="p" className="font-medium text-gray-900">
                                  {method.title}
                                </RadioGroup.Label>
                                <RadioGroup.Description as="p" className="text-sm text-gray-500">
                                  {method.description}
                                </RadioGroup.Description>
                              </div>
                            </div>
                            <div
                              className={clsx(
                                'shrink-0 rounded-full border-2 p-1',
                                checked ? 'border-blue-500' : 'border-transparent'
                              )}
                            >
                              <div
                                className={clsx(
                                  'h-4 w-4 rounded-full',
                                  checked ? 'bg-blue-500' : 'bg-gray-300'
                                )}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-500">
                    terms and conditions
                  </a>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              <div className="flow-root">
                <ul className="-my-6 divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex py-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h4>{item.name}</h4>
                            <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <p className="text-gray-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Subtotal</p>
                  <p>₹{subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Tax</p>
                  <p>₹{tax.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Shipping</p>
                  <p>₹{shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Total</p>
                  <p>₹{total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <LockClosedIcon className="h-6 w-6 text-green-500 mr-2" />
                  <span className="text-sm">SSL Encrypted</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || paymentProcessing || !isFormValid()}
              className={clsx(
                'w-full py-4 px-6 rounded-md text-white font-medium flex items-center justify-center space-x-2',
                isFormValid() && !loading && !paymentProcessing
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              )}
            >
              <LockClosedIcon className="h-5 w-5" />
              <span>
                {loading || paymentProcessing 
                  ? 'Processing...' 
                  : `Place Order (${selectedPaymentMethod.title})`
                }
              </span>
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;