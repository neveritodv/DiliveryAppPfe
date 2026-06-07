// lib/services/more/my_order_view.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common/service_call.dart';
import 'package:food_delivery/services/order_service.dart';
import 'package:food_delivery/delivery/views/order_tracking_view.dart';

class MyOrderView extends StatefulWidget {
  const MyOrderView({super.key});

  @override
  State<MyOrderView> createState() => _MyOrderViewState();
}

class _MyOrderViewState extends State<MyOrderView> {
  List orders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => isLoading = true);
    final data = await OrderService.getMyOrders();
    if (mounted) {
      setState(() {
        orders = data;
        isLoading = false;
      });
    }
  }

  Future<void> _clearHistory() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Clear History"),
        content: const Text("Are you sure you want to delete all order history?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text("Clear All", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/orders/clear-history');
      final response = await http.delete(url, headers: {
        'Authorization': 'Bearer $token',
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') {
          setState(() => orders = []);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Order history cleared"),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'confirmed': return Colors.blue;
      case 'preparing': return Colors.purple;
      case 'picked_up': return Colors.teal;
      case 'on_the_way': return Colors.indigo;
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.red;
      case 'refused': return Colors.grey;
      default: return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'pending': return Icons.hourglass_empty;
      case 'confirmed': return Icons.check_circle_outline;
      case 'preparing': return Icons.restaurant;
      case 'picked_up': return Icons.shopping_bag;
      case 'on_the_way': return Icons.delivery_dining;
      case 'delivered': return Icons.check_circle;
      case 'cancelled': return Icons.cancel;
      case 'refused': return Icons.block;
      default: return Icons.circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: Column(
        children: [
          const SizedBox(height: 46),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Image.asset("assets/img/btn_back.png", width: 20, height: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "My Orders",
                    style: TextStyle(
                      color: TColor.primaryText,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (orders.isNotEmpty)
                  IconButton(
                    onPressed: _clearHistory,
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    tooltip: "Clear History",
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: isLoading
              ? const Center(child: CircularProgressIndicator())
              : orders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long, size: 80, color: TColor.placeholder),
                        const SizedBox(height: 16),
                        Text("No orders yet", style: TextStyle(color: TColor.secondaryText, fontSize: 16)),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadOrders,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      itemCount: orders.length,
                      itemBuilder: (ctx, i) {
                        final order = orders[i];
                        final status = order['status'] ?? 'pending';
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(15),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      "Order #${order['_id'].toString().substring(0, 8)}",
                                      style: TextStyle(
                                        color: TColor.primaryText,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(status).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(_getStatusIcon(status), size: 16, color: _getStatusColor(status)),
                                          const SizedBox(width: 5),
                                          Text(
                                            status.replaceAll('_', ' ').toUpperCase(),
                                            style: TextStyle(
                                              color: _getStatusColor(status),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Icon(Icons.location_on, size: 16, color: TColor.secondaryText),
                                    const SizedBox(width: 5),
                                    Expanded(
                                      child: Text(
                                        order['deliveryAddress'] ?? 'No address',
                                        style: TextStyle(color: TColor.secondaryText, fontSize: 13),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Icon(Icons.shopping_cart, size: 16, color: TColor.secondaryText),
                                    const SizedBox(width: 5),
                                    Text(
                                      "${order['items']?.length ?? 0} items",
                                      style: TextStyle(color: TColor.secondaryText, fontSize: 13),
                                    ),
                                    const Spacer(),
                                    Text(
                                      "\$${(order['total'] ?? 0).toStringAsFixed(2)}",
                                      style: TextStyle(
                                        color: TColor.primaryText,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if (status == 'pending')
                                      TextButton.icon(
                                        onPressed: () async {
                                          await OrderService.cancelOrder(order['_id']);
                                          _loadOrders();
                                        },
                                        icon: const Icon(Icons.close, size: 18),
                                        label: const Text("Cancel"),
                                        style: TextButton.styleFrom(foregroundColor: Colors.red),
                                      ),
                                    const SizedBox(width: 8),
                                    ElevatedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => OrderTrackingView(
                                              orderId: order['_id'],
                                              initialStatus: status,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.track_changes, size: 18, color: Colors.white),
                                      label: const Text("Track", style: TextStyle(color: Colors.white)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: TColor.primary,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}