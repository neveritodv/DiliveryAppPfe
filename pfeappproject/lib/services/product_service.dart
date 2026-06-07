import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/globs.dart';

class ProductService {
  static Future<List<dynamic>> getProducts({String? category}) async {
    final url = Uri.parse('${SVKey.mainUrl}/api/products${category != null ? '?category=$category' : ''}');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        List<dynamic> products = data['payload'] ?? [];
        // Ensure each product has an image field (may be null)
        return products;
      }
      return [];
    } catch (e) {
      print('Error: $e');
      return [];
    }
  }
}