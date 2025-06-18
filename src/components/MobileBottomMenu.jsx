import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  HeartIcon as HeartIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';

function MobileBottomMenu() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { wishlistItems } = useWishlist();

  if (!currentUser) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        <Link to="/" className="flex flex-col items-center justify-center">
          {isActive('/') ? (
            <HomeIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <HomeIcon className="h-6 w-6 text-gray-500" />
          )}
          <span className={`text-xs mt-1 ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}>
            Home
          </span>
        </Link>

        <Link to="/orders" className="flex flex-col items-center justify-center">
          {isActive('/orders') ? (
            <ClipboardDocumentListIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <ClipboardDocumentListIcon className="h-6 w-6 text-gray-500" />
          )}
          <span className={`text-xs mt-1 ${isActive('/orders') ? 'text-blue-600' : 'text-gray-500'}`}>
            Orders
          </span>
        </Link>

        <Link to="/cart" className="flex flex-col items-center justify-center">
          {isActive('/cart') ? (
            <ShoppingCartIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <ShoppingCartIcon className="h-6 w-6 text-gray-500" />
          )}
          <span className={`text-xs mt-1 ${isActive('/cart') ? 'text-blue-600' : 'text-gray-500'}`}>
            Cart
          </span>
        </Link>

        <Link to="/wishlist" className="flex flex-col items-center justify-center relative">
          {isActive('/wishlist') ? (
            <HeartIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <HeartIcon className="h-6 w-6 text-gray-500" />
          )}
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {wishlistItems.length}
            </span>
          )}
          <span className={`text-xs mt-1 ${isActive('/wishlist') ? 'text-blue-600' : 'text-gray-500'}`}>
            Wishlist
          </span>
        </Link>

        <Link to="/profile" className="flex flex-col items-center justify-center">
          {isActive('/profile') ? (
            <UserIconSolid className="h-6 w-6 text-blue-600" />
          ) : (
            <UserIcon className="h-6 w-6 text-gray-500" />
          )}
          <span className={`text-xs mt-1 ${isActive('/profile') ? 'text-blue-600' : 'text-gray-500'}`}>
            Profile
          </span>
        </Link>
      </div>
    </div>
  );
}

export default MobileBottomMenu;