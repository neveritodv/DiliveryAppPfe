import 'package:flutter/material.dart';
import '../../common/color_extension.dart';

class DeliveryNotificationsView extends StatefulWidget {
  const DeliveryNotificationsView({super.key});

  @override
  State<DeliveryNotificationsView> createState() => _DeliveryNotificationsViewState();
}

class _DeliveryNotificationsViewState extends State<DeliveryNotificationsView> {
  List notifications = [
    {"title": "New order #1234 available", "time": "2 min ago", "read": false},
    {"title": "Order #1233 picked up", "time": "1 hour ago", "read": true},
    {"title": "Order #1232 delivered successfully", "time": "3 hours ago", "read": true},
    {"title": "Your availability is now ON", "time": "Yesterday", "read": true},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: ListView.separated(
        itemCount: notifications.length,
        separatorBuilder: (_, __) => Divider(color: TColor.secondaryText.withValues(alpha: 0.2)),
        itemBuilder: (context, index) {
          final notif = notifications[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: notif['read'] ? TColor.textfield : TColor.primary,
              child: Icon(Icons.notifications, color: notif['read'] ? TColor.secondaryText : Colors.white, size: 20),
            ),
            title: Text(notif['title'], style: TextStyle(fontWeight: notif['read'] ? FontWeight.normal : FontWeight.bold)),
            subtitle: Text(notif['time'], style: TextStyle(color: TColor.secondaryText, fontSize: 12)),
            trailing: notif['read'] ? null : Container(width: 8, height: 8, decoration: BoxDecoration(color: TColor.primary, shape: BoxShape.circle)),
          );
        },
      ),
    );
  }
}