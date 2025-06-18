import React from 'react';
import { format } from 'date-fns';
import StarRating from './StarRating';

function ReviewList({ reviews }) {
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <StarRating rating={review.rating} disabled />
              <p className="text-sm text-gray-600 mt-1">{review.userName}</p>
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(review.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}

export default ReviewList;