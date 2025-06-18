import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { useReviews } from '../hooks/useReviews';
import { useAuth } from '../contexts/AuthContext';
import useCartStore from '../store/cartStore';
import StarRating from '../components/StarRating';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import { ProductDetailsSkeleton, ReviewSkeleton, Skeleton } from '../components/Skeleton';

function ProductDetails() {
  const { id } = useParams();
  const { product, loading: productLoading, error: productError } = useProduct(id);
  const { reviews, loading: reviewsLoading, error: reviewsError, averageRating, refreshReviews } = useReviews(id);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { currentUser } = useAuth();

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  if (productLoading || reviewsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailsSkeleton />
        <div className="mt-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <ReviewSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (productError || reviewsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">
          Error: {productError || reviewsError}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-w-1 aspect-h-1">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center mt-2">
              <StarRating rating={Math.round(averageRating)} disabled />
              <span className="ml-2 text-gray-600">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 mt-4">₹{product.price}</p>
            <p className="mt-4 text-gray-600">{product.description}</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-gray-700">Quantity:</label>
              <div className="flex items-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100"
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                  className="w-16 text-center border-y border-gray-300"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-300"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
            <Link
              to="/"
              className="block text-center text-gray-600 hover:text-gray-900"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
        {currentUser ? (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
            <ReviewForm productId={id} onReviewAdded={refreshReviews} />
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md mb-8">
            <p className="text-gray-600">
              Please{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700">
                log in
              </Link>{' '}
              to write a review.
            </p>
          </div>
        )}
        
        {reviews.length > 0 ? (
          <ReviewList reviews={reviews} />
        ) : (
          <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;