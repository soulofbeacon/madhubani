import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { UserManagementSkeleton } from './Skeleton';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (err) {
      setError('Error fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('orderDate', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch wishlist
      const wishlistDoc = await getDocs(collection(db, `wishlists/${userId}/items`));
      const wishlist = wishlistDoc.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserDetails({
        orders,
        wishlist,
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.total, 0)
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    await fetchUserDetails(user.id);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <UserManagementSkeleton />
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Users</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Users List */}
        <div className="lg:col-span-5">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr 
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className={`cursor-pointer hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-7">
          {selectedUser && userDetails ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">User Details</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-semibold">{userDetails.totalOrders}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-semibold">₹{userDetails.totalSpent.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Orders */}
                <div>
                  <h4 className="text-lg font-medium mb-3">Order History</h4>
                  <div className="space-y-3">
                    {userDetails.orders.map(order => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">
                            {format(new Date(order.orderDate), 'MMM d, yyyy')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full
                            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'shipped' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'delivered' ? 'bg-gray-100 text-gray-800' : ''}
                            ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium">Order ID: {order.id}</p>
                        <p className="text-sm">Total: ₹{order.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wishlist */}
                <div>
                  <h4 className="text-lg font-medium mb-3">Wishlist</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {userDetails.wishlist.map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              Select a user to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;