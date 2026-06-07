import 'package:flutter/material.dart';
import '../../common/color_extension.dart';
import '../../common/globs.dart';           // ✅ added
import '../../common/service_call.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class DeliveryHistoryView extends StatefulWidget {
  const DeliveryHistoryView({super.key});

  @override
  State<DeliveryHistoryView> createState() => _DeliveryHistoryViewState();
}

class _DeliveryHistoryViewState extends State<DeliveryHistoryView> {
  List orders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => isLoading = true);
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/delivery/history');
    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
    });
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['status'] == '1') {
        setState(() => orders = data['payload']);
      }
    }
    setState(() => isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Delivery History"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : orders.isEmpty
              ? const Center(child: Text("No deliveries yet"))
              : ListView.separated(
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => Divider(color: TColor.secondaryText.withValues(alpha: 0.2)),
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: TColor.primary,
                        child: Text("${index + 1}", style: const TextStyle(color: Colors.white)),
                      ),
                      title: Text("Order #${order['_id']}", style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text("Delivered: ${_formatDate(order['createdAt'])} • \$${order['total']}"),
                      trailing: const Icon(Icons.check_circle, color: Colors.green),
                    );
                  },
                ),
    );
  }

  String _formatDate(dynamic timestamp) {
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    return "${date.day}/${date.month}/${date.year}";
  }
}