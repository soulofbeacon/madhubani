import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

function OrderTracking({ status, orderDate, shippingDate, deliveryDate }) {
  const steps = [
    { id: 1, name: 'Order Placed', date: orderDate, status: 'complete' },
    { id: 2, name: 'Processing', status: status === 'processing' ? 'current' : (status === 'shipped' || status === 'delivered' ? 'complete' : 'upcoming') },
    { id: 3, name: 'Shipped', date: shippingDate, status: status === 'shipped' ? 'current' : (status === 'delivered' ? 'complete' : 'upcoming') },
    { id: 4, name: 'Delivered', date: deliveryDate, status: status === 'delivered' ? 'complete' : 'upcoming' }
  ];

  return (
    <div className="py-6">
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full bg-gray-200 -translate-y-1/2" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-blue-600 -translate-y-1/2 transition-all duration-500"
          style={{
            width: `${
              status === 'pending' ? '0%' :
              status === 'processing' ? '33%' :
              status === 'shipped' ? '66%' :
              status === 'delivered' ? '100%' : '0%'
            }`
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${step.status === 'complete' ? 'bg-blue-600' :
                  step.status === 'current' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                <CheckCircleIcon className={`w-6 h-6
                  ${step.status === 'complete' ? 'text-white' :
                    step.status === 'current' ? 'text-blue-600' : 'text-gray-400'}`}
                />
              </div>
              <div className="mt-2 text-sm font-medium text-gray-900">{step.name}</div>
              {step.date && (
                <div className="mt-1 text-xs text-gray-500">
                  {format(new Date(step.date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;