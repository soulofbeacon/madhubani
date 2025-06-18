import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchWishlist = async () => {
    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.uid);
      const wishlistDoc = await getDoc(wishlistRef);

      if (wishlistDoc.exists()) {
        const productIds = wishlistDoc.data().products || [];
        const products = await Promise.all(
          productIds.map(async (productId) => {
            const productDoc = await getDoc(doc(db, 'products', productId));
            return productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } : null;
          })
        );
        setWishlistItems(products.filter(Boolean));
      } else {
        await setDoc(wishlistRef, { products: [] });
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    if (!currentUser) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.uid);
      await updateDoc(wishlistRef, {
        products: arrayUnion(product.id)
      });
      setWishlistItems([...wishlistItems, product]);
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.uid);
      await updateDoc(wishlistRef, {
        products: arrayRemove(productId)
      });
      setWishlistItems(wishlistItems.filter(item => item.id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}