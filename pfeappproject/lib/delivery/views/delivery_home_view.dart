import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../common/color_extension.dart';
import '../services/delivery_api.dart';
import 'order_detail_view.dart';
import 'delivery_profile_view.dart';
import 'delivery_settings_view.dart';

class DeliveryHomeView extends StatefulWidget {
  const DeliveryHomeView({super.key});

  @override
  State<DeliveryHomeView> createState() => _DeliveryHomeViewState();
}

class _DeliveryHomeViewState extends State<DeliveryHomeView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final GlobalKey<_OrdersTabState> _ordersTabKey = GlobalKey<_OrdersTabState>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _refreshOrders() {
    _ordersTabKey.currentState?.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Delivery Partner"),
        backgroundColor: TColor.primary,
        foregroundColor: Colors.white,
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _refreshOrders,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white.withAlpha(179),
          tabs: const [
            Tab(
              text: "Orders",
              icon: Icon(Icons.list_alt, color: Colors.white),
            ),
            Tab(
              text: "Profile",
              icon: Icon(Icons.person, color: Colors.white),
            ),
            Tab(
              text: "Settings",
              icon: Icon(Icons.settings, color: Colors.white),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _OrdersTab(key: _ordersTabKey),
          const DeliveryProfileView(),
          const DeliverySettingsView(),
        ],
      ),
    );
  }
}

class _OrdersTab extends StatefulWidget {
  const _OrdersTab({super.key});

  @override
  State<_OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<_OrdersTab> {
  List orders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => isLoading = true);
    final data = await DeliveryApi.getAvailableOrders();
    if (mounted) {
      setState(() {
        orders = data;
        isLoading = false;
      });
    }
  }

  void refresh() {
    _loadOrders();
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(
        child: CircularProgressIndicator(color: TColor.primary),
      );
    }

    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: TColor.placeholder),
            const SizedBox(height: 16),
            Text(
              "No orders available",
              style: TextStyle(color: TColor.secondaryText, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              "Pull down to refresh",
              style: TextStyle(color: TColor.placeholder, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: TColor.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: orders.length,
        itemBuilder: (ctx, i) {
          final o = orders[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            elevation: 2,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Order #${o['_id'].toString().substring(0, 8)}",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: TColor.primaryText,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.map, color: TColor.accent, size: 22),
                        onPressed: () async {
                          final address = Uri.encodeComponent(o['deliveryAddress'] ?? '');
                          final url = Uri.parse("https://www.google.com/maps/search/?api=1&query=$address");
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          }
                        },
                        tooltip: "Open in Maps",
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Address
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.location_on, size: 16, color: TColor.accent),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          o['deliveryAddress'] ?? 'Address not provided',
                          style: TextStyle(color: TColor.secondaryText, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Items + Total
                  Row(
                    children: [
                      Icon(Icons.shopping_bag, size: 16, color: TColor.accent),
                      const SizedBox(width: 4),
                      Text(
                        "${o['items']?.length ?? 0} items",
                        style: TextStyle(color: TColor.secondaryText, fontSize: 13),
                      ),
                      const Spacer(),
                      Text(
                        "\$${(o['total'] ?? 0).toStringAsFixed(2)}",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: TColor.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade400,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          elevation: 0,
                        ),
                        onPressed: () async {
                          await DeliveryApi.refuseOrder(o['_id']);
                          _loadOrders();
                        },
                        child: const Text("Refuse", style: TextStyle(fontSize: 13)),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: TColor.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        ),
                        onPressed: () async {
                          await DeliveryApi.acceptOrder(o['_id']);
                          if (!mounted) return;
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OrderDetailView(orderId: o['_id']),
                            ),
                          ).then((_) => _loadOrders());
                        },
                        child: const Text("Accept", style: TextStyle(fontSize: 13)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}