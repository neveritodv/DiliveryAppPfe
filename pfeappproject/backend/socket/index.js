module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Client joins a specific order room to track it
    socket.on('join-order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room order_${orderId}`);
    });

    // Delivery person joins the delivery room (for new order notifications)
    socket.on('join-delivery-room', () => {
      socket.join('delivery-room');
      console.log(`Delivery ${socket.id} joined delivery room`);
    });

    // Delivery sends location update for a specific order
    socket.on('delivery-location', (data) => {
      io.to(`order_${data.orderId}`).emit('location-update', { lat: data.lat, lng: data.lng });
    });

    // Delivery sends status update for a specific order (direct WebSocket)
    socket.on('status-update', (data) => {
      io.to(`order_${data.orderId}`).emit('order-status', { status: data.status });
    });

    
    // Chat events
    socket.on('join-chat', (chatId) => socket.join(`chat_${chatId}`));

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};