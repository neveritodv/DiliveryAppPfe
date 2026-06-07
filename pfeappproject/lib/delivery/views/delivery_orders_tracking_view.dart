import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import 'order_tracking_view.dart';
import 'order_detail_view.dart';

class DeliveryOrdersTrackingView extends StatefulWidget {
  const DeliveryOrdersTrackingView({super.key});

  @override
  State<DeliveryOrdersTrackingView> createState() => _DeliveryOrdersTrackingViewState();
}

class _DeliveryOrdersTrackingViewState extends State<DeliveryOrdersTrackingView> {
  List orders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActiveOrders();
  }

  Future<void> _loadActiveOrders() async {
    setState(() => isLoading = true);
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/delivery/active-orders');
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
      });
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') {
          setState(() => orders = data['payload'] ?? []);
        }
      }
    } catch (e) {
      // ignore
    }
    setState(() => isLoading = false);
  }

  Color _getStatusColor(String status) {
    switch (status) {
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
      case 'accepted': return 'Next: Pick Up';
      case 'picked_up': return 'Next: On the Way';
      case 'on_the_way': return 'Next: Deliver';
      case 'delivered': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  }

  double _getProgressValue(String status) {
    switch (status) {
      case 'accepted': return 0.25;
      case 'picked_up': return 0.5;
      case 'on_the_way': return 0.75;
      case 'delivered': return 1.0;
      default: return 0.0;
    }
  }

  void _showPopupMenu(Offset position, Map order, String status, bool isActive) {
    showMenu<String>(
      context: context,
      position: RelativeRect.fromLTRB(position.dx, position.dy, position.dx + 1, position.dy + 1),
      items: [
        if (isActive)
          const PopupMenuItem(
            value: 'update',
            child: Row(
              children: [
                Icon(Icons.edit, size: 18, color: Colors.blue),
                SizedBox(width: 10),
                Text("Update Status"),
              ],
            ),
          ),
        const PopupMenuItem(
          value: 'track',
          child: Row(
            children: [
              Icon(Icons.track_changes, size: 18, color: Colors.orange),
              SizedBox(width: 10),
              Text("Track Order"),
            ],
          ),
        ),
      ],
      elevation: 8,
    ).then((value) {
      if (value == 'update' && isActive) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OrderDetailView(orderId: order['_id'])),
        ).then((_) => _loadActiveOrders());
      } else if (value == 'track') {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OrderTrackingView(orderId: order['_id'], initialStatus: status),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      appBar: AppBar(
        title: const Text("My Active Orders"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: isLoading
        ? const Center(child: CircularProgressIndicator())
        : orders.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 80, color: TColor.placeholder),
                  const SizedBox(height: 16),
                  Text("No active orders", style: TextStyle(fontSize: 18, color: TColor.secondaryText)),
                  const SizedBox(height: 8),
                  Text("Accept orders from the Orders tab", style: TextStyle(fontSize: 14, color: TColor.placeholder)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadActiveOrders,
              child: ListView.builder(
                padding: const EdgeInsets.all(15),
                itemCount: orders.length,
                itemBuilder: (ctx, i) {
                  final order = orders[i];
                  final status = order['status'] ?? 'accepted';
                  final isActive = status != 'delivered' && status != 'cancelled';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header row with 3-dot ALWAYS visible
                          Row(
                            children: [
                              // Order ID
                              Expanded(
                                child: Text(
                                  "Order #${order['_id'].toString().substring(0, 8)}",
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                              ),
                              // Status badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(status).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  status.replaceAll('_', ' ').toUpperCase(),
                                  style: TextStyle(
                                    color: _getStatusColor(status),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              // ✅ 3-DOT - Simple GestureDetector, always visible
                              GestureDetector(
                                onTapDown: (TapDownDetails details) {
                                  _showPopupMenu(details.globalPosition, order, status, isActive);
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  child: const Icon(Icons.more_vert, color: Colors.black54, size: 22),
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
                          const SizedBox(height: 4),
                          // Items + Total
                          Row(
                            children: [
                              Icon(Icons.shopping_cart, size: 14, color: TColor.secondaryText),
                              const SizedBox(width: 4),
                              Text("${order['items']?.length ?? 0} items", style: TextStyle(color: TColor.secondaryText, fontSize: 12)),
                              const Spacer(),
                              Text("\$${(order['total'] ?? 0).toStringAsFixed(2)}",
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Progress bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: LinearProgressIndicator(
                              value: _getProgressValue(status),
                              backgroundColor: Colors.grey.shade200,
                              valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor(status)),
                              minHeight: 5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          // Next action
                          Text(
                            _getNextAction(status),
                            style: TextStyle(color: _getStatusColor(status), fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}