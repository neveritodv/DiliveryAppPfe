import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../common/globs.dart';

class OfferService {
  static Future<List<dynamic>> getOffers() async {
    try {
      final url = Uri.parse('${SVKey.mainUrl}/api/offers');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') {
          return data['payload'] as List<dynamic>;
        }
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  static Future<Map<String, dynamic>> getOfferById(String id) async {
    try {
      final url = Uri.parse('${SVKey.mainUrl}/api/offers/$id');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') {
          return data['payload'] as Map<String, dynamic>;
        }
      }
    } catch (e) {
      // ignore
    }
    return {};
  }
}