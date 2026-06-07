import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import 'delivery_notifications_view.dart';
import 'delivery_inbox_view.dart';
import 'delivery_history_view.dart';
import 'order_tracking_view.dart';
import 'order_detail_view.dart'; // ✅ Added for status updates

class DeliverySettingsView extends StatefulWidget {
  const DeliverySettingsView({super.key});

  @override
  State<DeliverySettingsView> createState() => _DeliverySettingsViewState();
}

class _DeliverySettingsViewState extends State<DeliverySettingsView> {
  List activeOrders = [];
  bool isLoadingOrders = true;

  @override
  void initState() {
    super.initState();
    _loadActiveOrders();
  }

  Future<void> _loadActiveOrders() async {
    setState(() => isLoadingOrders = true);
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/delivery/active-orders');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
      });
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') {
          setState(() => activeOrders = data['payload'] ?? []);
        }
      }
    } catch (e) {
      // ignore
    }
    setState(() => isLoadingOrders = false);
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'accepted': return Colors.blue;
      case 'picked_up': return Colors.teal;
      case 'on_the_way': return Colors.indigo;
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending': return Icons.hourglass_empty;
      case 'accepted': return Icons.check_circle_outline;
      case 'picked_up': return Icons.shopping_bag;
      case 'on_the_way': return Icons.delivery_dining;
      case 'delivered': return Icons.check_circle;
      case 'cancelled': return Icons.cancel;
      default: return Icons.circle;
    }
  }

  String _getNextAction(String status) {
    switch (status) {
      case 'accepted': return 'Tap to update → Picked Up';
      case 'picked_up': return 'Tap to update → On the Way';
      case 'on_the_way': return 'Tap to mark → Delivered';
      case 'delivered': return '✅ Completed';
      case 'cancelled': return '❌ Cancelled';
      default: return 'View details';
    }
  }

  List<Map<String, dynamic>> get menuItems => [
    {
      "icon": Icons.notifications,
      "title": "Notifications",
      "route": "notifications",
      "color": Colors.orange,
    },
    {
      "icon": Icons.inbox,
      "title": "Inbox",
      "route": "inbox",
      "color": Colors.purple,
    },
    {
      "icon": Icons.history,
      "title": "Delivery History",
      "route": "history",
      "color": Colors.green,
    },
    {
      "icon": Icons.info_outline,
      "title": "About",
      "route": "about",
      "color": Colors.teal,
    },
    {
      "icon": Icons.logout,
      "title": "Logout",
      "route": "logout",
      "color": Colors.red,
    },
  ];

  void _navigateTo(String route) {
    switch (route) {
      case "notifications":
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DeliveryNotificationsView()));
        break;
      case "inbox":
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DeliveryInboxView()));
        break;
      case "history":
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DeliveryHistoryView()));
        break;
      case "about":
        showAboutDialog(
          context: context,
          applicationName: "Food Delivery",
          applicationVersion: "1.0.0",
          applicationIcon: Image.asset("assets/img/app_logo.png", height: 50),
        );
        break;
      case "logout":
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text("Logout"),
            content: const Text("Are you sure you want to logout?"),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  ServiceCall.logout();
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text("Logout", style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: RefreshIndicator(
        onRefresh: _loadActiveOrders,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 46),
              
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Settings",
                      style: TextStyle(
                        color: TColor.primaryText,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 15),
              
              // Active Orders Section
              if (activeOrders.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Icon(Icons.delivery_dining, color: TColor.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        "My Active Orders",
                        style: TextStyle(
                          color: TColor.primaryText,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: TColor.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          "${activeOrders.length} active",
                          style: TextStyle(color: TColor.primary, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                
                // Active Orders List
                ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  itemCount: activeOrders.length,
                  itemBuilder: (ctx, i) {
                    final order = activeOrders[i];
                    final status = order['status'] ?? 'accepted';
                    final isActive = status != 'delivered' && status != 'cancelled';
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () {
                          if (isActive) {
                            // ✅ Go to OrderDetailView for status updates
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => OrderDetailView(orderId: order['_id']),
                              ),
                            ).then((_) => _loadActiveOrders());
                          } else {
                            // Show tracking for completed/cancelled
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => OrderTrackingView(
                                  orderId: order['_id'],
                                  initialStatus: status,
                                ),
                              ),
                            ).then((_) => _loadActiveOrders());
                          }
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(15),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Order header
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    "Order #${order['_id'].toString().substring(0, 8)}",
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(status).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(_getStatusIcon(status), size: 14, color: _getStatusColor(status)),
                                        const SizedBox(width: 4),
                                        Text(
                                          status.replaceAll('_', ' ').toUpperCase(),
                                          style: TextStyle(
                                            color: _getStatusColor(status),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              
                              const SizedBox(height: 10),
                              
                              // Address
                              Row(
                                children: [
                                  Icon(Icons.location_on, size: 14, color: TColor.secondaryText),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      order['deliveryAddress'] ?? 'No address',
                                      style: TextStyle(color: TColor.secondaryText, fontSize: 12),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                              
                              const SizedBox(height: 6),
                              
                              // Items + Total
                              Row(
                                children: [
                                  Icon(Icons.shopping_cart, size: 14, color: TColor.secondaryText),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${order['items']?.length ?? 0} items",
                                    style: TextStyle(color: TColor.secondaryText, fontSize: 12),
                                  ),
                                  const Spacer(),
                                  Text(
                                    "\$${(order['total'] ?? 0).toStringAsFixed(2)}",
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                ],
                              ),
                              
                              const SizedBox(height: 8),
                              
                              // Next action + Button
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _getNextAction(status),
                                    style: TextStyle(
                                      color: _getStatusColor(status),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  if (isActive)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(status),
                                        borderRadius: BorderRadius.circular(15),
                                      ),
                                      child: const Text(
                                        "Update Status",
                                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    )
                                  else
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(15),
                                      ),
                                      child: const Text(
                                        "View",
                                        style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 10),
                const Divider(indent: 20, endIndent: 20),
              ],
              
              // If no active orders
              if (activeOrders.isEmpty && !isLoadingOrders)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.inbox, color: TColor.placeholder, size: 40),
                        const SizedBox(width: 15),
                        Expanded(
                          child: Text(
                            "No active orders\nAccept orders from the Orders tab",
                            style: TextStyle(color: TColor.secondaryText, fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              
              // Loading indicator
              if (isLoadingOrders)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator()),
                ),
              
              const SizedBox(height: 10),
              
              // Menu Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "Menu",
                  style: TextStyle(
                    color: TColor.primaryText,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              
              ListView.builder(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 15),
                itemCount: menuItems.length,
                itemBuilder: (context, index) {
                  final item = menuItems[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        width: 45,
                        height: 45,
                        decoration: BoxDecoration(
                          color: (item['color'] as Color).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(item['icon'], color: item['color'], size: 24),
                      ),
                      title: Text(
                        item['title'],
                        style: TextStyle(
                          color: TColor.primaryText,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      trailing: Icon(Icons.chevron_right, color: TColor.placeholder),
                      onTap: () => _navigateTo(item['route']),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}