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

  @override
  void initState() {
    super.initState();
    WebSocketService.connect(widget.orderId);
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    final details = await DeliveryApi.getOrderDetails(widget.orderId);
    if (mounted) setState(() => orderDetails = details);
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    WebSocketService.disconnect();
    super.dispose();
  }

  Future<void> _updateStatus(String newStatus) async {
    final success = await DeliveryApi.updateOrderStatus(widget.orderId, newStatus);
    if (success) {
      if (mounted) setState(() => status = newStatus);
      WebSocketService.sendStatusUpdate(widget.orderId, newStatus);
      if (newStatus == 'picked_up') {
        _startRealLocationSharing();
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to update status. Please try again.")),
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

  @override
  Widget build(BuildContext context) {
    final bool showChatButton = status == 'accepted' || status == 'picked_up';

    return Scaffold(
      appBar: AppBar(title: Text("Order #${widget.orderId}")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              "Status: $status",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: TColor.primary),
            ),
            const SizedBox(height: 20),
            if (orderDetails.isNotEmpty)
              Card(
                child: ListTile(
                  title: Text(orderDetails['deliveryAddress'] ?? 'No address'),
                  subtitle: Text("Total: \$${orderDetails['total']}"),
                  trailing: const Icon(Icons.location_on),
                ),
              ),
            const SizedBox(height: 30),
            if (status == "accepted")
              RoundButton(title: "Mark as Picked Up", onPressed: () => _updateStatus("picked_up")),
            if (status == "picked_up") ...[
              RoundButton(title: "Mark as Delivered", onPressed: () => _updateStatus("delivered")),
              const SizedBox(height: 20),
              RoundButton(
                title: "Start Navigation",
                type: RoundButtonType.textPrimary,
                onPressed: _openNavigation,
              ),
            ],
            if (showChatButton) ...[
              const SizedBox(height: 20),
              RoundButton(
                title: "Chat with Client",
                type: RoundButtonType.textPrimary,
                onPressed: _chatWithClient,
              ),
            ],
          ],
        ),
      ),
    );
  }
}