import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';
import toast from 'react-hot-toast';

function ReviewForm({ productId, onReviewAdded }) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        productId,
        userId: currentUser.uid,
        userName: currentUser.email.split('@')[0],
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      toast.success('Review submitted successfully');
      setRating(0);
      setComment('');
      onReviewAdded();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <StarRating rating={rating} setRating={setRating} />
      </div>
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Review
        </label>
        <textarea
          id="comment"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

export default ReviewForm;