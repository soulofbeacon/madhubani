import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';

function CheckoutSuccess() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Your Order!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your payment was successful and your order is being processed.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default CheckoutSuccess;