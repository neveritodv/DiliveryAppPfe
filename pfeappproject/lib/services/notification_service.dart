import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final bool isRead;
  final String type; // 'order', 'chat', 'report'
  final Map<String, dynamic>? data;

  NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    this.isRead = false,
    required this.type,
    this.data,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'body': body,
    'timestamp': timestamp.toIso8601String(),
    'isRead': isRead,
    'type': type,
    'data': data,
  };

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
    id: json['id'],
    title: json['title'],
    body: json['body'],
    timestamp: DateTime.parse(json['timestamp']),
    isRead: json['isRead'],
    type: json['type'],
    data: json['data'],
  );
}

class NotificationService {
  static const String _storageKey = 'notifications';
  static List<NotificationItem> _notifications = [];
  static List<Function> _listeners = [];

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final String? stored = prefs.getString(_storageKey);
    if (stored != null) {
      final List<dynamic> list = json.decode(stored);
      _notifications = list.map((item) => NotificationItem.fromJson(item)).toList();
      // Sort by newest first
      _notifications.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    }
  }

  static void addNotification(NotificationItem notification) {
    _notifications.insert(0, notification);
    _save();
    _notifyListeners();
  }

  static List<NotificationItem> getNotifications() {
    return List.unmodifiable(_notifications);
  }

  static Future<void> markAsRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      _notifications[index] = NotificationItem(
        id: _notifications[index].id,
        title: _notifications[index].title,
        body: _notifications[index].body,
        timestamp: _notifications[index].timestamp,
        isRead: true,
        type: _notifications[index].type,
        data: _notifications[index].data,
      );
      _save();
      _notifyListeners();
    }
  }

  static Future<void> markAllAsRead() async {
    for (int i = 0; i < _notifications.length; i++) {
      _notifications[i] = NotificationItem(
        id: _notifications[i].id,
        title: _notifications[i].title,
        body: _notifications[i].body,
        timestamp: _notifications[i].timestamp,
        isRead: true,
        type: _notifications[i].type,
        data: _notifications[i].data,
      );
    }
    _save();
    _notifyListeners();
  }

  static void clearAll() {
    _notifications.clear();
    _save();
    _notifyListeners();
  }

  static void addListener(Function callback) {
    _listeners.add(callback);
  }

  static void removeListener(Function callback) {
    _listeners.remove(callback);
  }

  static void _notifyListeners() {
    for (var cb in _listeners) {
      cb();
    }
  }

  static Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    final String jsonStr = json.encode(_notifications.map((n) => n.toJson()).toList());
    await prefs.setString(_storageKey, jsonStr);
  }
}