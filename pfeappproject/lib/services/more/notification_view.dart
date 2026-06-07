import 'package:flutter/material.dart';
import 'package:food_delivery/common/color_extension.dart';
import '../../services/notification_service.dart';
import 'my_order_view.dart';

class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView> {
  List<NotificationItem> notifications = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    NotificationService.addListener(_refresh);
  }

  @override
  void dispose() {
    NotificationService.removeListener(_refresh);
    super.dispose();
  }

  void _refresh() {
    setState(() {
      notifications = NotificationService.getNotifications();
    });
  }

  Future<void> _loadNotifications() async {
    await NotificationService.init();
    setState(() {
      notifications = NotificationService.getNotifications();
      isLoading = false;
    });
  }

  Future<void> _clearAll() async {
    NotificationService.clearAll();
    setState(() {});
  }

  Future<void> _markAllRead() async {
    NotificationService.markAllAsRead();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.checklist),
            onPressed: _markAllRead,
            tooltip: 'Mark all as read',
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            onPressed: _clearAll,
            tooltip: 'Clear all',
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : notifications.isEmpty
              ? const Center(child: Text("No notifications yet"))
              : ListView.separated(
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) => Divider(color: TColor.secondaryText.withValues(alpha: 0.2)),
                  itemBuilder: (context, index) {
                    final notif = notifications[index];
                    return Container(
                      color: notif.isRead ? Colors.white : TColor.textfield,
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: notif.isRead ? Colors.transparent : TColor.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  notif.title,
                                  style: TextStyle(
                                    color: TColor.primaryText,
                                    fontSize: 14,
                                    fontWeight: notif.isRead ? FontWeight.normal : FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  notif.body,
                                  style: TextStyle(color: TColor.secondaryText, fontSize: 13),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _formatTime(notif.timestamp),
                                  style: TextStyle(color: TColor.placeholder, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hour ago';
    if (diff.inDays < 7) return '${diff.inDays} day ago';
    return '${time.day}/${time.month}/${time.year}';
  }
}