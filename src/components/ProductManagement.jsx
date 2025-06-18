import React, { useState, useEffect, useCallback } from 'react';
import { collection, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useProducts } from '../hooks/useProducts';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function ProductManagement() {
  const { products, loading, error } = useProducts();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingStock, setEditingStock] = useState({});
  const [stockValues, setStockValues] = useState({});
  const [updatingFlags, setUpdatingFlags] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: null
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Initialize stock values when products load
  useEffect(() => {
    if (products.length > 0) {
      const initialStockValues = {};
      products.forEach(product => {
        initialStockValues[product.id] = product.stock || 0;
      });
      setStockValues(initialStockValues);
    }
  }, [products]);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Debounced stock update function
  const debouncedStockUpdate = useCallback(
    debounce(async (productId, newStock) => {
      try {
        await updateDoc(doc(db, 'products', productId), {
          stock: parseInt(newStock) || 0
        });
        toast.success('Stock updated successfully');
      } catch (error) {
        console.error('Error updating stock:', error);
        toast.error('Failed to update stock');
      }
    }, 500),
    []
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const handleStockEdit = (productId) => {
    setEditingStock(prev => ({ ...prev, [productId]: true }));
  };

  const handleStockChange = (productId, value) => {
    setStockValues(prev => ({ ...prev, [productId]: value }));
    debouncedStockUpdate(productId, value);
  };

  const handleStockSave = (productId) => {
    setEditingStock(prev => ({ ...prev, [productId]: false }));
  };

  const handleStockCancel = (productId, originalStock) => {
    setStockValues(prev => ({ ...prev, [productId]: originalStock }));
    setEditingStock(prev => ({ ...prev, [productId]: false }));
  };

  const handleFlagToggle = async (productId, flagType, currentValue) => {
    setUpdatingFlags(prev => ({ ...prev, [`${productId}-${flagType}`]: true }));
    
    try {
      await updateDoc(doc(db, 'products', productId), {
        [flagType]: !currentValue
      });
      toast.success(`Product ${flagType} updated successfully`);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error(`Error updating ${flagType}:`, error);
      toast.error(`Failed to update ${flagType}`);
    } finally {
      setUpdatingFlags(prev => ({ ...prev, [`${productId}-${flagType}`]: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      image: null
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = editingProduct?.imageUrl;
      
      if (formData.image) {
        imageUrl = await uploadToCloudinary(formData.image);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        imageUrl
      };

      await updateDoc(doc(db, 'products', editingProduct.id), productData);
      toast.success('Product updated successfully');
      resetForm();
      window.location.reload();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId || '',
      image: null
    });
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Product deleted successfully');
        window.location.reload();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-8">
      <div className="text-red-600 bg-red-100 p-4 rounded-lg">
        Error: {error}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => navigate('/admin/add-product')}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Product
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {editingProduct && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">No Category (Optional)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <input
                type="file"
                name="image"
                onChange={handleInputChange}
                className="mt-1 block w-full"
                accept="image/*"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Update Product
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="h-16 w-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity duration-200"
                      onClick={() => handleProductClick(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(cat => cat.id === product.categoryId)?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ₹{product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStock[product.id] ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={stockValues[product.id] || 0}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleStockSave(product.id);
                            }
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleStockSave(product.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStockCancel(product.id, product.stock)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        onClick={() => handleStockEdit(product.id)}
                      >
                        <span className="text-sm font-medium">{product.stock || 0}</span>
                        <PencilIcon className="h-3 w-3 inline ml-1 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={product.isNew || false}
                          onChange={() => handleFlagToggle(product.id, 'isNew', product.isNew)}
                          disabled={updatingFlags[`${product.id}-isNew`]}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">New</span>
                        {updatingFlags[`${product.id}-isNew`] && (
                          <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        )}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={product.isFeatured || false}
                          onChange={() => handleFlagToggle(product.id, 'isFeatured', product.isFeatured)}
                          disabled={updatingFlags[`${product.id}-isFeatured`]}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                        {updatingFlags[`${product.id}-isFeatured`] && (
                          <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        )}
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex items-center text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex items-center text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm || selectedCategory 
                ? 'No products found matching your search criteria.' 
                : 'No products found.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductManagement;