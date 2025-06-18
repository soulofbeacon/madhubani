import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import OrderTracking from '../components/OrderTracking';
import { OrderSkeleton } from '../components/Skeleton';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id));
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          
          // Fetch product details for each item
          const itemsWithDetails = await Promise.all(
            orderData.items.map(async (item) => {
              const productDoc = await getDoc(doc(db, 'products', item.id));
              if (productDoc.exists()) {
                return {
                  ...item,
                  imageUrl: productDoc.data().imageUrl
                };
              }
              return item;
            })
          );
          
          setOrder({ ...orderData, items: itemsWithDetails });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Error fetching order details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrderSkeleton />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <Link
          to="/orders"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Orders
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Order Status */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Status</h2>
          <OrderTracking
            status={order.status}
            orderDate={order.orderDate}
            shippingDate={order.shippingDate}
            deliveryDate={order.deliveryDate}
          />
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">{order.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {format(new Date(order.orderDate), 'PPP')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                ${order.status === 'shipped' ? 'bg-green-100 text-green-800' : ''}
                ${order.status === 'delivered' ? 'bg-gray-100 text-gray-800' : ''}
                ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                ₹{order.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
          <p className="text-gray-900">
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
            {order.shippingAddress.country}
          </p>
        </div>

        {/* Order Items */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleProductClick(item.id)}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md hover:opacity-75 transition-opacity"
                          />
                        )}
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <th scope="row" colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Subtotal
                  </th>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                    ₹{order.subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Tax
                  </th>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                    ₹{order.tax.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Shipping
                  </th>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                    ₹{order.shipping.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <th scope="row" colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                    Total
                  </th>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    ₹{order.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;