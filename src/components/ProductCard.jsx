import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon as HeartOutline, ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useWishlist } from '../contexts/WishlistContext';
import useCartStore from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ProductCard({ product }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const addItem = useCartStore((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const navigate = useNavigate();

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setIsAddingToCart(true);
    
    // Add item to cart
    addItem(product, 1);
    
    // Show success animation
    setTimeout(() => {
      setIsAddingToCart(false);
      setJustAdded(true);
      toast.success(`${product.name} added to cart!`, {
        duration: 2000,
        icon: '🛒',
      });
      
      // Reset the success state
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    }, 500);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    addItem(product, 1);
    navigate('/checkout');
  };

  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
          
          {/* Product badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isNew && (
              <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                New
              </span>
            )}
            {product.oldPrice && (
              <span className="bg-red-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            {inWishlist ? (
              <HeartSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartOutline className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="p-4">
          {/* Category */}
          <div className="text-xs text-gray-500 mb-1">{product.category}</div>
          
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-gray-900">
              ₹{product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || justAdded}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1 ${
                justAdded
                  ? 'bg-green-500 text-white'
                  : isAddingToCart
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {isAddingToCart ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : justAdded ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-4 w-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
            <button
              onClick={handleBuyNow}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Buy Now
            </button>
          </div>

          {/* Stock status */}
          {product.stock <= 5 && product.stock > 0 && (
            <div className="mt-3">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(product.stock / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Only {product.stock} left in stock
              </p>
            </div>
          )}
          {product.stock === 0 && (
            <p className="mt-3 text-xs text-red-600 font-medium">
              Out of stock
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;