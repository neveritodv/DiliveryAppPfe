import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/extension.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common_widget/round_button.dart';
import 'package:food_delivery/common_widget/round_icon_button.dart';
import 'package:food_delivery/common_widget/round_textfield.dart';
import 'package:food_delivery/common/service_call.dart';
import 'package:food_delivery/services/login/rest_password_view.dart';
import 'package:food_delivery/services/login/sing_up_view.dart';
import 'package:food_delivery/delivery/views/delivery_home_view.dart';
import 'package:food_delivery/services/main_tabview/main_tabview.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final TextEditingController txtEmail = TextEditingController();
  final TextEditingController txtPassword = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 25),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 64),
            Text("Login", style: TextStyle(color: TColor.primaryText, fontSize: 30, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text("Add your details to login", style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
            const SizedBox(height: 25),
            RoundTextfield(hintText: "Your Email", controller: txtEmail, keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 25),
            RoundTextfield(hintText: "Password", controller: txtPassword, obscureText: true),
            const SizedBox(height: 25),
            RoundButton(title: "Login", onPressed: btnLogin),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ResetPasswordView())),
              child: Text("Forgot your password?", style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
            ),
            const SizedBox(height: 30),
            Text("or Login With", style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
            const SizedBox(height: 30),
            RoundIconButton(icon: "assets/img/facebook_logo.png", title: "Login with Facebook", color: const Color(0xff367FC0), onPressed: () {}),
            const SizedBox(height: 25),
            RoundIconButton(icon: "assets/img/google_logo.png", title: "Login with Google", color: const Color(0xffDD4B39), onPressed: () {}),
            const SizedBox(height: 80),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SignUpView())),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Don't have an Account? ", style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
                  Text("Sign Up", style: TextStyle(color: TColor.primary, fontSize: 14, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void btnLogin() {
    if (!txtEmail.text.isEmail) {
      mdShowAlert(Globs.appName, MSG.enterEmail, () {});
      return;
    }
    if (txtPassword.text.length < 6) {
      mdShowAlert(Globs.appName, MSG.enterPassword, () {});
      return;
    }
    endEditing();
    serviceCallLogin({"email": txtEmail.text, "password": txtPassword.text, "push_token": ""});
  }

  void serviceCallLogin(Map<String, dynamic> parameter) {
    Globs.showHUD();
    ServiceCall.post(parameter, SVKey.svLogin,
        withSuccess: (responseObj) async {
      Globs.hideHUD();
      if (responseObj[KKey.status] == "1") {
        var payload = responseObj[KKey.payload] as Map? ?? {};
        // Save to SharedPreferences
        Globs.udSet(payload, Globs.userPayload);
        Globs.udBoolSet(true, Globs.userLogin);
        String role = payload[KKey.role] ?? "client";
        Globs.udStringSet(role, Globs.userRole);
        // Update ServiceCall static payload
        ServiceCall.userPayload = payload;
        // Verify storage
        final prefs = await SharedPreferences.getInstance();
        final stored = prefs.getString(Globs.userPayload);
        print('📦 Stored payload: $stored');
        // Navigate directly
        Widget nextScreen;
        if (role == 'delivery') {
          nextScreen = const DeliveryHomeView();
        } else {
          nextScreen = const MainTabView();
        }
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => nextScreen),
          (route) => false,
        );
      } else {
        mdShowAlert(Globs.appName, responseObj[KKey.message] as String? ?? MSG.fail, () {});
      }
    }, failure: (err) async {
      Globs.hideHUD();
      mdShowAlert(Globs.appName, err.toString(), () {});
    });
  }
}