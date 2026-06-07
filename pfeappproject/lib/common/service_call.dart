import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common/locator.dart';

typedef ResSuccess = Future<void> Function(Map<String, dynamic>);
typedef ResFailure = Future<void> Function(dynamic);

class ServiceCall {
  static final NavigationService navigationService = locator<NavigationService>();
  static Map userPayload = {};

  static void post(Map<String, dynamic> parameter, String path,
      {bool isToken = false, ResSuccess? withSuccess, ResFailure? failure}) {
    Future(() async {
      try {
        String fullUrl = path;
        if (!path.startsWith('http')) {
          fullUrl = '${SVKey.baseUrl}${path.startsWith('/') ? path.substring(1) : path}';
        }
        if (kDebugMode) print('🌐 POST $fullUrl');

        var headers = {'Content-Type': 'application/json'};
        if (isToken && userPayload.containsKey('auth_token')) {
          headers['Authorization'] = 'Bearer ${userPayload['auth_token']}';
        }

        final response = await http.post(Uri.parse(fullUrl),
            body: json.encode(parameter), headers: headers);

        if (kDebugMode) print('✅ Response: ${response.body}');

        final jsonObj = json.decode(response.body) as Map<String, dynamic>? ?? {};
        if (withSuccess != null) await withSuccess(jsonObj);
      } catch (err) {
        if (failure != null) await failure(err.toString());
      }
    });
  }

  static void logout() {
    // Clear all stored user data
    Globs.udBoolSet(false, Globs.userLogin);
    Globs.udRemove(Globs.userPayload);
    Globs.udRemove(Globs.userRole);
    userPayload = {};
    // Force navigate to welcome screen and clear stack
    navigationService.navigatorKey.currentState?.pushNamedAndRemoveUntil("welcome", (route) => false);
  }
}