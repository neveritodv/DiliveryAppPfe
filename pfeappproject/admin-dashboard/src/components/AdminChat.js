import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';
let socket;

function AdminChat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('adminToken');
  let adminUserId = localStorage.getItem('adminUserId');
  
  // Fallback: decode from token if missing
  if (!adminUserId && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminUserId = payload.id;
      localStorage.setItem('adminUserId', adminUserId);
    } catch(e) {}
  }

  const [searchParams] = useSearchParams();
  const initialChatId = searchParams.get('chatId');

  useEffect(() => {
    fetchUsers();
    socket = io('http://localhost:3001', { auth: { token } });
    socket.on('new-message', (msg) => {
      if (msg.chatId === chatId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });
    return () => socket.disconnect();
  }, [chatId]);

  useEffect(() => {
    if (initialChatId) {
      loadChatById(initialChatId);
    }
  }, [initialChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(res.data.payload);
  };

  const loadChatById = async (chatId) => {
    setLoading(true);
    const chatRes = await axios.get(`${API_URL}/chat/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
    const chat = chatRes.data.payload;
    setChatId(chat._id);
    const otherId = chat.participants.find(p => p !== adminUserId);
    setSelectedUser(otherId);
    const msgsRes = await axios.get(`${API_URL}/chat/messages/${chat._id}`, { headers: { Authorization: `Bearer ${token}` } });
    setMessages(msgsRes.data.payload);
    socket.emit('join-chat', chat._id);
    setLoading(false);
    scrollToBottom();
  };

  const getOrCreateChat = async (userId) => {
    setLoading(true);
    const res = await axios.post(`${API_URL}/chat/get-or-create`, { otherUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });
    const chat = res.data.payload;
    setChatId(chat._id);
    setSelectedUser(userId);
    const msgsRes = await axios.get(`${API_URL}/chat/messages/${chat._id}`, { headers: { Authorization: `Bearer ${token}` } });
    setMessages(msgsRes.data.payload);
    socket.emit('join-chat', chat._id);
    setLoading(false);
    scrollToBottom();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    await axios.post(`${API_URL}/chat/message`, { chatId, text }, { headers: { Authorization: `Bearer ${token}` } });
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.name} (${user.role})` : userId;
  };

  return (
    <div style={{ display: 'flex', height: '80vh', background: 'white', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ width: 260, borderRight: '1px solid #e0e0e0', background: '#fafafa', overflowY: 'auto' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>Users</div>
        {users.map(user => (
          <div
            key={user._id}
            onClick={() => getOrCreateChat(user._id)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              backgroundColor: selectedUser === user._id ? '#FC6011' : 'transparent',
              color: selectedUser === user._id ? 'white' : '#333',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ fontWeight: 500 }}>{user.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{user.role}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedUser ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            Select a user to start chatting
          </div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
        ) : (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
              Chat with {getUserName(selectedUser)}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === adminUserId;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 18,
                      backgroundColor: isMe ? '#FC6011' : '#f0f0f0',
                      color: isMe ? 'white' : '#333',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, padding: 10, borderRadius: 24, border: '1px solid #ddd', outline: 'none' }}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage} style={{ background: '#FC6011', color: 'white', border: 'none', padding: '0 20px', borderRadius: 24, cursor: 'pointer' }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminChat;