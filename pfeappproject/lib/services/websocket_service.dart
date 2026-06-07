import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../common/globs.dart';
import '../common/service_call.dart';
import 'notification_service.dart';

class WebSocketService {
  static IO.Socket? _socket;
  static Function(Map)? onLocationUpdate;
  static Function(String)? onStatusUpdate;
  static Function(Map)? onNewMessage;

  static void connect([String orderId = '']) {
    final token = ServiceCall.userPayload['auth_token'];
    if (_socket != null && _socket!.connected) return;
    _socket = IO.io(Globs.webSocketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'query': {'token': token},
    });
    _socket!.connect();

    _socket!.on('connect', (_) {
      print('✅ WebSocket connected');
      if (orderId.isNotEmpty) {
        _socket!.emit('join-order', orderId);
      }
    });

    _socket!.on('location-update', (data) {
      onLocationUpdate?.call(data);
    });

    _socket!.on('order-status', (data) {
      final status = data['status'];
      onStatusUpdate?.call(status);
      if (status != null) {
        NotificationService.addNotification(NotificationItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: 'Order Status Update',
          body: 'Your order #${orderId.substring(0, 6)} is now $status',
          timestamp: DateTime.now(),
          type: 'order',
          data: {'orderId': orderId, 'status': status},
        ));
      }
    });

    _socket!.on('new-message', (data) {
      print('🔔 New message received: $data');
      onNewMessage?.call(data);
    });

    _socket!.on('disconnect', (_) {
      print('❌ WebSocket disconnected');
    });
  }

  static void joinDeliveryRoom() {
    _socket?.emit('join-delivery-room');
  }

  static void joinChat(String chatId) {
    _socket?.emit('join-chat', chatId);
  }

  static void sendLocation(double lat, double lng) {
    _socket?.emit('delivery-location', {'lat': lat, 'lng': lng});
  }

  static void sendStatusUpdate(String orderId, String status) {
    _socket?.emit('status-update', {'orderId': orderId, 'status': status});
  }

  static void sendChatMessage(String chatId, String text) {
    _socket?.emit('chat-message', {'chatId': chatId, 'text': text});
  }

  static void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}