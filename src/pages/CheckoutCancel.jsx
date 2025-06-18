import React from 'react';
import { Link } from 'react-router-dom';

function CheckoutCancel() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your payment was cancelled. Your cart items are still saved if you'd like to try again.
        </p>
        <div className="space-x-4">
          <Link
            to="/cart"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Return to Cart
          </Link>
          <Link
            to="/"
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCancel;