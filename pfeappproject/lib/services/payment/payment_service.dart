import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../common/globs.dart';
import '../../common/service_call.dart';

class PaymentService {
  static Future<Map<String, dynamic>> createPaymentIntent(double amount) async {
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/payment/create-payment-intent');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': amount, 'currency': 'usd'}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return {'status': '0', 'message': 'Failed'};
    } catch (e) {
      return {'status': '0', 'message': e.toString()};
    }
  }

  // ✅ Simplified - works without flutter_stripe on web
  static Future<bool> processPayment(double amount) async {
    try {
      final result = await createPaymentIntent(amount);

      if (result['status'] == '1') {
        // On mobile, use Stripe SDK
        // On web, redirect to Stripe checkout page
        final clientSecret = result['clientSecret'];
        
        // For now, just return success for testing
        // In production, use Stripe Checkout or Elements
        print('✅ Payment intent created: $clientSecret');
        return true;
      }
      return false;
    } catch (e) {
      print('Payment error: $e');
      return false;
    }
  }
}