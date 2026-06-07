import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';

class DeliveryApi {
  static Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final userPayloadStr = prefs.getString(Globs.userPayload) ?? '{}';
    final Map<String, dynamic> userPayload = json.decode(userPayloadStr);
    return userPayload['auth_token'] ?? '';
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<List<dynamic>> getAvailableOrders() async {
    try {
      final headers = await _getHeaders();
      final url = Uri.parse('${SVKey.mainUrl}/api/delivery/available-orders');
      final res = await http.get(url, headers: headers);
      final data = json.decode(res.body);
      if (data['status'] == '1') return data['payload'] ?? [];
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<void> acceptOrder(String orderId) async {
    final headers = await _getHeaders();
    await http.post(
      Uri.parse('${SVKey.mainUrl}/api/delivery/accept/$orderId'),
      headers: headers,
    );
  }

  static Future<bool> updateOrderStatus(String orderId, String status) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('${SVKey.mainUrl}/api/delivery/update-status/$orderId'),
      body: json.encode({'status': status}),
      headers: headers,
    );
    final data = json.decode(response.body);
    if (data['status'] == '1') {
      return true;
    } else {
      print('❌ Update failed: ${data['message']}');
      return false;
    }
  }

  static Future<void> refuseOrder(String orderId) async {
  final headers = await _getHeaders();
  await http.post(Uri.parse('${SVKey.mainUrl}/api/delivery/refuse/$orderId'), headers: headers);
}

  static Future<Map<String, dynamic>> getOrderDetails(String orderId) async {
    final headers = await _getHeaders();
    final res = await http.get(
      Uri.parse('${SVKey.mainUrl}/api/orders/$orderId'),
      headers: headers,
    );
    final data = json.decode(res.body);
    if (data['status'] == '1') return data['payload'] ?? {};
    return {};
  }
}