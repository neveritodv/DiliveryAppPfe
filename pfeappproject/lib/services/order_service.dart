import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/globs.dart';
import '../common/service_call.dart';

class OrderService {
  // Fetch all orders for the current user (client)
  static Future<List<dynamic>> getMyOrders() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/orders/my-orders');
    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
    });
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['status'] == '1') {
        return data['payload'] as List<dynamic>;
      }
    }
    return [];
  }

  // Fetch only delivered orders (for client or delivery history)
  static Future<List<dynamic>> getDeliveredOrders() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/orders/my-orders');
    final response = await http.get(url, headers: {
      'Authorization': 'Bearer $token',
    });
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['status'] == '1') {
        final orders = data['payload'] as List<dynamic>;
        return orders.where((o) => o['status'] == 'delivered').toList();
      }
    }
    return [];
  }

  // Cancel a pending order (client only) - ✅ FIXED to return success
  static Future<bool> cancelOrder(String orderId) async {
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/orders/cancel/$orderId');
      final response = await http.patch(url, headers: {
        'Authorization': 'Bearer $token',
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['status'] == '1';
      }
      return false;
    } catch (e) {
      print("Cancel error: $e");
      return false;
    }
  }
}