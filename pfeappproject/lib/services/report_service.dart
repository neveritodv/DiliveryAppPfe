import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/globs.dart';
import '../common/service_call.dart';

class ReportService {
  static Future<void> submitReport(
    String orderId,
    String deliveryPersonId,
    String reason,
    String description,
  ) async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/reports');
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'orderId': orderId,
        'deliveryPersonId': deliveryPersonId,
        'reason': reason,
        'description': description,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to submit report: ${response.statusCode}');
    }
    final data = jsonDecode(response.body);
    if (data['status'] != '1') {
      throw Exception(data['message'] ?? 'Failed to submit report');
    }
  }

  static Future<List<dynamic>> getMyReports() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/reports/my-reports');
    final response = await http.get(
      url,
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch reports: ${response.statusCode}');
    }
    final data = jsonDecode(response.body);
    if (data['status'] != '1') {
      throw Exception(data['message'] ?? 'Failed to fetch reports');
    }
    return data['payload'] ?? [];
  }

  static Future<Map<String, dynamic>> getReportById(String reportId) async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/reports/client/$reportId');
    final response = await http.get(
      url,
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch report: ${response.statusCode}');
    }
    final data = jsonDecode(response.body);
    if (data['status'] != '1') {
      throw Exception(data['message'] ?? 'Failed to fetch report');
    }
    return data['payload'] ?? {};
  }
}