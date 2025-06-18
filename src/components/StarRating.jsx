import React from 'react';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

function StarRating({ rating, setRating, disabled = false }) {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && setRating(star)}
          className={`${disabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {star <= rating ? (
            <StarSolid className="h-6 w-6 text-yellow-400" />
          ) : (
            <StarOutline className="h-6 w-6 text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
}

export default StarRating;