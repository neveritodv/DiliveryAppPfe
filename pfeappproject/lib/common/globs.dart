import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';

SharedPreferences? _prefs;

class Globs {
  static const appName = "Food Delivery";
  static const userPayload = "user_payload";
  static const userLogin = "user_login";
  static const userRole = "user_role";
  static const String webSocketUrl = "ws://localhost:3001";

  static void init(SharedPreferences prefs) {
    _prefs = prefs;
  }

  static void showHUD({String status = "loading ....."}) async {
    await Future.delayed(const Duration(milliseconds: 1));
    EasyLoading.show(status: status);
  }

  static void hideHUD() => EasyLoading.dismiss();

  static void udSet(dynamic data, String key) {
    final jsonStr = json.encode(data);
    _prefs?.setString(key, jsonStr);
  }

  static void udStringSet(String data, String key) => _prefs?.setString(key, data);
  static void udBoolSet(bool data, String key) => _prefs?.setBool(key, data);
  static void udIntSet(int data, String key) => _prefs?.setInt(key, data);
  static void udDoubleSet(double data, String key) => _prefs?.setDouble(key, data);

  static dynamic udValue(String key) => json.decode(_prefs?.get(key) as String? ?? "{}");
  static String udValueString(String key) => _prefs?.get(key) as String? ?? "";
  static bool udValueBool(String key) => _prefs?.get(key) as bool? ?? false;
  static bool udValueTrueBool(String key) => _prefs?.get(key) as bool? ?? true;
  static int udValueInt(String key) => _prefs?.get(key) as int? ?? 0;
  static double udValueDouble(String key) => _prefs?.get(key) as double? ?? 0.0;
  static void udRemove(String key) => _prefs?.remove(key);

  static Future<String> timeZone() async {
    try {
      return await FlutterTimezone.getLocalTimezone();
    } on PlatformException {
      return "";
    }
  }
}

// Keep your SVKey, KKey, MSG classes unchanged...



class SVKey {
  static const mainUrl = "http://localhost:3001";
  static const baseUrl = '$mainUrl/api/';
  static const svLogin = '${baseUrl}auth/login';
  static const svSignUp = '${baseUrl}auth/sign_up';
  static const svForgotPasswordRequest = '${baseUrl}auth/forgot_password_request';
  static const svForgotPasswordVerify = '${baseUrl}auth/forgot_password_verify';
  static const svForgotPasswordSetNew = '${baseUrl}auth/forgot_password_set_new';
}

class KKey {
  static const payload = "payload";
  static const status = "status";
  static const message = "message";
  static const authToken = "auth_token";
  static const name = "name";
  static const email = "email";
  static const mobile = "mobile";
  static const address = "address";
  static const userId = "user_id";
  static const resetCode = "reset_code";
  static const role = "role";
  static const productType = "product_type";
  static const canPoints = "can_points";
}

class MSG {
  static const enterEmail = "Please enter your valid email address.";
  static const enterName = "Please enter your name.";
  static const enterCode = "Please enter valid reset code.";
  static const enterMobile = "Please enter your valid mobile number.";
  static const enterAddress = "Please enter your address.";
  static const enterPassword = "Please enter password minimum 6 characters at least.";
  static const enterPasswordNotMatch = "Please enter password not match.";
  static const success = "success";
  static const fail = "fail";
}