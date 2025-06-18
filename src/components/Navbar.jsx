import React, { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { 
  ShoppingCartIcon, 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon, 
  HeartIcon, 
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import useCartStore from '../store/cartStore';
import clsx from 'clsx';

function Navbar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const { wishlistItems } = useWishlist();
  const { items: cartItems } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              Madhubani Craft
            </Link>
            <div className="hidden md:flex md:ml-8 space-x-8">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/shop" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Shop
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6 transition-transform duration-200 ease-in-out transform rotate-90" />
              ) : (
                <Bars3Icon className="block h-6 w-6 transition-transform duration-200 ease-in-out" />
              )}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {currentUser ? (
              <>
                {/* Cart Icon with Count */}
                <Link 
                  to="/cart" 
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist Icon with Count */}
                <Link 
                  to="/wishlist" 
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <HeartIcon className="h-6 w-6" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                {/* User Dropdown Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <UserIcon className="h-6 w-6" />
                    )}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {/* User Info Section */}
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {currentUser.displayName || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {currentUser.email}
                        </p>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={clsx(
                                'flex items-center px-4 py-2 text-sm transition-colors',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              )}
                            >
                              <UserIcon className="h-4 w-4 mr-3" />
                              My Profile
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/orders"
                              className={clsx(
                                'flex items-center px-4 py-2 text-sm transition-colors',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              )}
                            >
                              <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                              My Orders
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/wishlist"
                              className={clsx(
                                'flex items-center px-4 py-2 text-sm transition-colors',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              )}
                            >
                              <HeartIcon className="h-4 w-4 mr-3" />
                              My Wishlist
                              {wishlistItems.length > 0 && (
                                <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                  {wishlistItems.length}
                                </span>
                              )}
                            </Link>
                          )}
                        </Menu.Item>

                        {isAdmin && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={clsx(
                                  'flex items-center px-4 py-2 text-sm transition-colors',
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                )}
                              >
                                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                                Admin Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </div>

                      {/* Logout Section */}
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={clsx(
                                'flex items-center w-full px-4 py-2 text-sm text-left transition-colors',
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              )}
                            >
                              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          className={`fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <span className="text-lg font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Main Navigation */}
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                >
                  🏠 Home
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                >
                  🛍️ Shop
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                >
                  📞 Contact
                </Link>
              </div>
              
              {currentUser ? (
                <>
                  {/* User Info Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="px-3 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {currentUser?.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {currentUser.displayName || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* User Actions */}
                  <div className="space-y-1 pt-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    >
                      <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-3 text-gray-400" />
                      My Orders
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-5 w-5 mr-3 text-gray-400" />
                        Shopping Cart
                      </div>
                      {cartItemCount > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <HeartIcon className="h-5 w-5 mr-3 text-gray-400" />
                        My Wishlist
                      </div>
                      {wishlistItems.length > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                          {wishlistItems.length}
                        </span>
                      )}
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                  
                  {/* Logout Section */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Guest Actions */}
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200 text-center border border-gray-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 text-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;