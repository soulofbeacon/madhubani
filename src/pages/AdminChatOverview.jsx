import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function AdminChatOverview() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const q = query(
        collection(db, 'chats'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      // Group messages by userId
      const conversationsMap = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!conversationsMap[data.userId]) {
          conversationsMap[data.userId] = {
            userId: data.userId,
            userEmail: data.userEmail,
            lastMessage: data.message,
            lastMessageTime: data.timestamp,
            unreadCount: data.type === 'user' ? 1 : 0
          };
        }
      });

      setConversations(Object.values(conversationsMap));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (userId) => {
    navigate(`/admin/chat/${userId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat Overview</h2>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <div
              key={conversation.userId}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              onClick={() => handleConversationClick(conversation.userId)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {conversation.userEmail}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {conversation.lastMessage}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {conversation.lastMessageTime && 
                      format(conversation.lastMessageTime.toDate(), 'MMM d, yyyy HH:mm')}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {conversation.unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No conversations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminChatOverview;