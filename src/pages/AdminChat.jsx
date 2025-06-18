import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function AdminChat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageData);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      await addDoc(collection(db, 'chats'), {
        userId: userId,
        userEmail: messages[0]?.userEmail || 'Unknown User',
        message: replyMessage.trim(),
        timestamp: serverTimestamp(),
        type: 'admin',
        adminId: currentUser.uid,
        adminEmail: currentUser.email
      });
      setReplyMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-[600px] bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Chat with {messages[0]?.userEmail || 'Unknown User'}
          </h3>
        </div>

        {/* Messages */}
        <div className="h-[600px] overflow-y-auto px-6 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${
                msg.type === 'admin' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
                  msg.type === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{msg.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <form onSubmit={handleSubmit} className="px-6 py-4 border-t">
          <div className="flex space-x-4">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!replyMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminChat;