import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../common/globs.dart';

class RestaurantService {
  static Future<List<dynamic>> getRestaurants() async {
    try {
      final url = Uri.parse('${SVKey.mainUrl}/api/restaurants');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') return data['payload'] ?? [];
      }
    } catch (e) {}
    return [];
  }

  static Future<List<dynamic>> getPopularRestaurants() async {
    try {
      final url = Uri.parse('${SVKey.mainUrl}/api/restaurants/popular');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') return data['payload'] ?? [];
      }
    } catch (e) {}
    return [];
  }
}