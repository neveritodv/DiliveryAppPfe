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
    } catch (e) {}
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
    const res = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data.payload);
  };

  const loadChatById = async (chatId) => {
    setLoading(true);
    const chatRes = await axios.get(`${API_URL}/chat/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const chat = chatRes.data.payload;
    setChatId(chat._id);
    const otherId = chat.participants.find(p => p !== adminUserId);
    setSelectedUser(otherId);
    const msgsRes = await axios.get(`${API_URL}/chat/messages/${chat._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(msgsRes.data.payload);
    socket.emit('join-chat', chat._id);
    setLoading(false);
    scrollToBottom();
  };

  const getOrCreateChat = async (userId) => {
    setLoading(true);
    const res = await axios.post(
      `${API_URL}/chat/get-or-create`,
      { otherUserId: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const chat = res.data.payload;
    setChatId(chat._id);
    setSelectedUser(userId);
    const msgsRes = await axios.get(`${API_URL}/chat/messages/${chat._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(msgsRes.data.payload);
    socket.emit('join-chat', chat._id);
    setLoading(false);
    scrollToBottom();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    await axios.post(
      `${API_URL}/chat/message`,
      { chatId, text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.name} (${user.role})` : userId;
  };

  return (
    <div style={styles.chatContainer}>
      {/* Users sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>👥 Users</div>
        {users.map(user => (
          <div
            key={user._id}
            onClick={() => getOrCreateChat(user._id)}
            style={{
              ...styles.userItem,
              backgroundColor: selectedUser === user._id ? '#7C3AED' : 'transparent',
              color: selectedUser === user._id ? 'white' : '#1F2937',
            }}
          >
            <div style={styles.userAvatar}>
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.userName}>{user.name}</div>
              <div style={{
                ...styles.userRole,
                color: selectedUser === user._id ? 'rgba(255,255,255,0.8)' : '#6B7280',
              }}>
                {user.role}
              </div>
            </div>
            {user.role === 'delivery' && <span style={styles.deliveryBadge}>🚗</span>}
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={styles.chatArea}>
        {!selectedUser ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <div style={styles.emptyText}>Select a user to start chatting</div>
            <div style={styles.emptySubtext}>Messages will appear here in real-time</div>
          </div>
        ) : loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div>Loading conversation...</div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderAvatar}>
                {getUserName(selectedUser)?.charAt(0) || '?'}
              </div>
              <div style={styles.chatHeaderInfo}>
                <div style={styles.chatHeaderName}>{getUserName(selectedUser)}</div>
                <div style={styles.chatHeaderStatus}>Online</div>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === adminUserId;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                      padding: '0 16px',
                    }}
                  >
                    {!isMe && (
                      <div style={styles.messageAvatar}>
                        {getUserName(msg.senderId)?.charAt(0) || '?'}
                      </div>
                    )}
                    <div
                      style={{
                        ...styles.messageBubble,
                        backgroundColor: isMe ? '#7C3AED' : '#F3F4F6',
                        color: isMe ? 'white' : '#1F2937',
                        marginLeft: isMe ? 0 : 8,
                        marginRight: isMe ? 8 : 0,
                        borderTopRightRadius: isMe ? 4 : 18,
                        borderTopLeftRadius: isMe ? 18 : 4,
                      }}
                    >
                      <div style={styles.messageText}>{msg.text}</div>
                      <div style={{
                        ...styles.messageTime,
                        color: isMe ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isMe && (
                      <div style={styles.messageAvatar}>
                        A
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div style={styles.inputContainer}>
              <input
                style={styles.messageInput}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                style={styles.sendButton}
                disabled={!newMessage.trim()}
              >
                <span style={styles.sendIcon}>➤</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    display: 'flex',
    height: '80vh',
    background: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  sidebar: {
    width: 280,
    borderRight: '1px solid #E5E7EB',
    background: '#F9FAFB',
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    fontWeight: '700',
    fontSize: '16px',
    color: '#1F2937',
    background: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  userItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1px solid #F3F4F6',
    transition: 'all 0.2s',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    color: '#6B7280',
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  userRole: {
    fontSize: '12px',
    marginTop: '2px',
  },
  deliveryBadge: {
    fontSize: '16px',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    color: '#6B7280',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #E5E7EB',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  chatHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'white',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: '#7C3AED',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1F2937',
  },
  chatHeaderStatus: {
    fontSize: '12px',
    color: '#10B981',
    marginTop: '2px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    background: '#F9FAFB',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    background: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '12px',
    color: '#6B7280',
    flexShrink: 0,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '60%',
    padding: '10px 14px',
    borderRadius: 18,
    position: 'relative',
    wordBreak: 'break-word',
  },
  messageText: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  messageTime: {
    fontSize: '10px',
    marginTop: '4px',
    textAlign: 'right',
  },
  inputContainer: {
    padding: '12px 16px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: 10,
    background: 'white',
  },
  messageInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 24,
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
    transition: 'all 0.2s',
  },
  sendIcon: {
    fontSize: '16px',
    color: 'white',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AdminChat;