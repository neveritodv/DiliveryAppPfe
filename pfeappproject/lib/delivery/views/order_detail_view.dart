import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import '../../common_widget/round_button.dart';
import '../../services/websocket_service.dart';
import '../../services/chat/chat_service.dart';
import '../../services/chat/chat_conversation_view.dart';
import '../services/delivery_api.dart';
import 'order_tracking_view.dart';

class OrderDetailView extends StatefulWidget {
  final String orderId;
  const OrderDetailView({super.key, required this.orderId});

  @override
  State<OrderDetailView> createState() => _OrderDetailViewState();
}

class _OrderDetailViewState extends State<OrderDetailView> {
  String status = "accepted";
  StreamSubscription<Position>? _positionStream;
  Map orderDetails = {};
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    WebSocketService.connect(widget.orderId);
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    final details = await DeliveryApi.getOrderDetails(widget.orderId);
    if (mounted) {
      setState(() {
        orderDetails = details;
        status = details['status'] ?? 'accepted';
        isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    WebSocketService.disconnect();
    super.dispose();
  }

  Future<void> _updateStatus(String newStatus) async {
    // Confirm before cancelling
    if (newStatus == 'cancelled') {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text("Cancel Order"),
          content: const Text("Are you sure you want to cancel this order?"),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("No")),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text("Yes, Cancel", style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    final success = await DeliveryApi.updateOrderStatus(widget.orderId, newStatus);
    if (success) {
      if (mounted) setState(() => status = newStatus);
      WebSocketService.sendStatusUpdate(widget.orderId, newStatus);
      
      if (newStatus == 'picked_up') {
        _startRealLocationSharing();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("📦 Order picked up!"), backgroundColor: Colors.teal),
          );
        }
      }
      
      if (newStatus == 'delivered') {
        _positionStream?.cancel();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("✅ Order delivered!"), backgroundColor: Colors.green),
          );
          // Go back to orders list
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) Navigator.pop(context, true);
          });
        }
      }
      
      if (newStatus == 'cancelled') {
        _positionStream?.cancel();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("❌ Order cancelled"), backgroundColor: Colors.red),
          );
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) Navigator.pop(context, true);
          });
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to update status"), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _startRealLocationSharing() async {
    LocationPermission permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      _positionStream = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 5),
      ).listen((Position pos) {
        WebSocketService.sendLocation(pos.latitude, pos.longitude);
      });
    }
  }

  void _openNavigation() async {
    final address = Uri.encodeComponent(orderDetails['deliveryAddress'] ?? '');
    final url = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$address");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Cannot open maps")),
        );
      }
    }
  }

  Future<void> _chatWithClient() async {
    final clientId = orderDetails['clientId'];
    if (clientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Client not available")),
      );
      return;
    }
    final chatRes = await ChatService.getOrCreateChat(clientId);
    final chatId = chatRes['payload']['_id'];
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatConversationView(
            chatId: chatId,
            otherUserId: clientId,
          ),
        ),
      );
    }
  }

  Color _getStatusColor(String s) {
    switch (s) {
      case 'accepted': return Colors.blue;
      case 'picked_up': return Colors.teal;
      case 'on_the_way': return Colors.indigo;
      case 'delivered': return Colors.green;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _getStatusIcon(String s) {
    switch (s) {
      case 'accepted': return Icons.check_circle_outline;
      case 'picked_up': return Icons.shopping_bag;
      case 'on_the_way': return Icons.delivery_dining;
      case 'delivered': return Icons.check_circle;
      case 'cancelled': return Icons.cancel;
      default: return Icons.circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text("Order Details")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final bool showActions = status == 'accepted' || status == 'picked_up' || status == 'on_the_way';
    final bool showChatButton = status == 'accepted' || status == 'picked_up';

    return Scaffold(
      backgroundColor: TColor.white,
      appBar: AppBar(
        title: Text("Order #${widget.orderId.substring(0, 8)}"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => OrderTrackingView(
                    orderId: widget.orderId,
                    initialStatus: status,
                  ),
                ),
              );
            },
            icon: const Icon(Icons.track_changes, color: Colors.white),
            label: const Text("Track", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _getStatusColor(status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _getStatusColor(status), width: 1),
              ),
              child: Row(
                children: [
                  Icon(_getStatusIcon(status), color: _getStatusColor(status), size: 30),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Status: ${status.replaceAll('_', ' ').toUpperCase()}",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: _getStatusColor(status),
                          ),
                        ),
                        if (status == 'cancelled')
                          const Text("This order has been cancelled", style: TextStyle(fontSize: 12, color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Order Info Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.location_on, color: TColor.primary, size: 20),
                        const SizedBox(width: 8),
                        Text("Delivery Address", style: TextStyle(fontSize: 12, color: TColor.secondaryText)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(orderDetails['deliveryAddress'] ?? 'N/A',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Icon(Icons.shopping_bag, color: TColor.primary, size: 20),
                        const SizedBox(width: 8),
                        Text("Items", style: TextStyle(fontSize: 12, color: TColor.secondaryText)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (orderDetails['items'] != null)
                      ...List.generate(orderDetails['items'].length, (i) {
                        final item = orderDetails['items'][i];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text("• ${item['name'] ?? 'Item'} x${item['quantity'] ?? 1}"),
                        );
                      }),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Total", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text("\$${orderDetails['total'] ?? '0.00'}",
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: TColor.primary)),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Map button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _openNavigation,
                icon: const Icon(Icons.map),
                label: const Text("Open in Google Maps"),
                style: OutlinedButton.styleFrom(
                  foregroundColor: TColor.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),

            // Status Update Buttons
            if (showActions) ...[
              const SizedBox(height: 24),
              Text("Update Status",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: TColor.primaryText)),
              const SizedBox(height: 12),

              if (status == 'accepted') ...[
                _buildButton("📦 Mark as Picked Up", 'picked_up', Colors.teal),
                const SizedBox(height: 10),
                _buildButton("❌ Cancel Order", 'cancelled', Colors.red),
              ],

              if (status == 'picked_up') ...[
                _buildButton("🚗 On the Way", 'on_the_way', Colors.indigo),
                const SizedBox(height: 10),
                _buildButton("❌ Cancel Order", 'cancelled', Colors.red),
              ],

              if (status == 'on_the_way')
                _buildButton("✅ Mark as Delivered", 'delivered', Colors.green),
            ],

            // Chat button
            if (showChatButton) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _chatWithClient,
                  icon: const Icon(Icons.chat),
                  label: const Text("Chat with Client"),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: TColor.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildButton(String label, String newStatus, Color color) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          elevation: 2,
        ),
        onPressed: () => _updateStatus(newStatus),
        child: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }
}