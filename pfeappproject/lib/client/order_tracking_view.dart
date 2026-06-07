import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../services/websocket_service.dart';
import '../common/color_extension.dart';
import '../common/globs.dart';
import '../common/service_call.dart';
import '../services/chat/chat_service.dart';
import '../services/chat/chat_conversation_view.dart';
import '../delivery/views/order_tracking_view.dart' as stepper;
import 'dart:async';

class OrderTrackingView extends StatefulWidget {
  final String orderId;
  final double? destLat;
  final double? destLng;
  const OrderTrackingView({super.key, required this.orderId, this.destLat, this.destLng});

  @override
  State<OrderTrackingView> createState() => _OrderTrackingViewState();
}

class _OrderTrackingViewState extends State<OrderTrackingView> {
  GoogleMapController? _mapController;
  LatLng _deliveryLocation = const LatLng(48.8566, 2.3522);
  String _status = "pending";
  Map _orderDetails = {};
  bool _loadingDetails = true;
  IO.Socket? _socket;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
    _connectSocket();
    // Auto-refresh every 10 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (_) => _loadOrderDetails());
  }

  void _connectSocket() {
    _socket = IO.io('${SVKey.mainUrl}', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    _socket!.onConnect((_) {
      _socket!.emit('join-order', 'order_${widget.orderId}');
    });

    _socket!.on('order-status', (data) {
      if (mounted) {
        setState(() {
          _status = data['status'] ?? _status;
        });
        if (_status == 'accepted' || _status == 'picked_up') {
          _loadOrderDetails();
        }
      }
    });

    _socket!.on('delivery-location', (data) {
      if (mounted && data['lat'] != null && data['lng'] != null) {
        final newLoc = LatLng(
          double.tryParse(data['lat'].toString()) ?? _deliveryLocation.latitude,
          double.tryParse(data['lng'].toString()) ?? _deliveryLocation.longitude,
        );
        setState(() => _deliveryLocation = newLoc);
        _mapController?.animateCamera(CameraUpdate.newLatLng(newLoc));
      }
    });
  }

  Future<void> _loadOrderDetails() async {
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/orders/${widget.orderId}');
      final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
      final data = json.decode(res.body);
      if (data['status'] == '1' && mounted) {
        setState(() {
          _orderDetails = data['payload'];
          _status = data['payload']['status'] ?? _status;
          _loadingDetails = false;
        });
      } else if (mounted) {
        setState(() => _loadingDetails = false);
      }
    } catch (e) {
      if (mounted) setState(() => _loadingDetails = false);
    }
  }

  Future<void> _openChatWithDelivery() async {
    final deliveryPersonId = _orderDetails['deliveryPersonId'];
    if (deliveryPersonId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Delivery person not assigned yet")),
      );
      return;
    }
    final chatRes = await ChatService.getOrCreateChat(deliveryPersonId);
    final chatId = chatRes['payload']['_id'];
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatConversationView(chatId: chatId, otherUserId: deliveryPersonId),
        ),
      );
    }
  }

  void _goToStepperTracking() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => stepper.OrderTrackingView(
          orderId: widget.orderId,
          initialStatus: _status,
        ),
      ),
    );
  }

  void _goHome() {
    Navigator.pushNamedAndRemoveUntil(context, 'Home', (route) => false);
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

  double _getProgress(String status) {
    switch (status) {
      case 'pending': return 0.1;
      case 'accepted': return 0.3;
      case 'picked_up': return 0.5;
      case 'on_the_way': return 0.75;
      case 'delivered': return 1.0;
      case 'cancelled': return 0.0;
      default: return 0.0;
    }
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('delivery'),
        position: _deliveryLocation,
        infoWindow: const InfoWindow(title: "Delivery person"),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
      ),
      if (widget.destLat != null && widget.destLng != null)
        Marker(
          markerId: const MarkerId('destination'),
          position: LatLng(widget.destLat!, widget.destLng!),
          infoWindow: const InfoWindow(title: "Your address"),
        ),
    };

    final bool showChatButton = (_status == 'accepted' || _status == 'picked_up') && _orderDetails['deliveryPersonId'] != null;
    final bool isLive = _socket?.connected == true;

    return Scaffold(
      appBar: AppBar(
        title: Text("Order #${widget.orderId.substring(0, 8)}"),
        backgroundColor: TColor.primary,
        foregroundColor: Colors.white,
        actions: [
          // Live indicator
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8, height: 8,
                  decoration: BoxDecoration(
                    color: isLive ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(isLive ? 'Live' : 'Offline', style: const TextStyle(fontSize: 11, color: Colors.white)),
              ],
            ),
          ),
        ],
      ),
      body: _loadingDetails
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              Expanded(
                child: Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(target: _deliveryLocation, zoom: 14),
                      onMapCreated: (ctrl) => _mapController = ctrl,
                      markers: markers,
                      myLocationEnabled: true,
                    ),
                    // Status badge on map
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: _getStatusColor(_status),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: Colors.black.withAlpha(30), blurRadius: 8)],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _status == 'delivered' ? Icons.check_circle : Icons.delivery_dining,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _status.replaceAll('_', ' ').toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Bottom panel
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 10, offset: const Offset(0, -4))],
                ),
                child: Column(
                  children: [
                    // Progress bar
                    LinearProgressIndicator(
                      value: _getProgress(_status),
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor(_status)),
                      minHeight: 6,
                    ),
                    const SizedBox(height: 12),
                    
                    // Status text
                    Text(
                      _status == 'delivered' ? '🎉 Order Delivered!' : _status == 'cancelled' ? 'Order Cancelled' : 'Estimated: 30-45 min',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _getStatusColor(_status),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Action buttons
                    Row(
                      children: [
                        // Back to Home
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _goHome,
                            icon: const Icon(Icons.home, size: 18),
                            label: const Text("Home"),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: TColor.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Track My Order (stepper)
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _goToStepperTracking,
                            icon: const Icon(Icons.track_changes, size: 18),
                            label: const Text("Track"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: TColor.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    
                    // Chat button
                    if (showChatButton) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _openChatWithDelivery,
                          icon: const Icon(Icons.chat, size: 18),
                          label: const Text("Chat with Delivery Person"),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: TColor.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
    );
  }
}