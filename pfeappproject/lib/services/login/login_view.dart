import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/extension.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common_widget/round_button.dart';
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
      backgroundColor: TColor.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),

              // Logo - clean, no rounded corners, no clipping
              Center(
                child: Image.asset(
                  "assets/img/newlogo.png",
                  width: 140,
                  height: 140,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [TColor.primary, TColor.primaryDark],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Icon(
                        Icons.delivery_dining,
                        color: Colors.white,
                        size: 60,
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 20),

              // Brand Name
              Text(
                "RACINE DELIVERY",
                style: TextStyle(
                  color: TColor.primary,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                ),
              ),

              const SizedBox(height: 6),

              // Tagline
              Text(
                "Fast • Fresh • Reliable",
                style: TextStyle(
                  color: TColor.secondaryText,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 40),

              // Email field
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(8),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: RoundTextfield(
                  hintText: "Email Address",
                  controller: txtEmail,
                  keyboardType: TextInputType.emailAddress,
                ),
              ),

              const SizedBox(height: 18),

              // Password field
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(8),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: RoundTextfield(
                  hintText: "Password",
                  controller: txtPassword,
                  obscureText: true,
                ),
              ),

              const SizedBox(height: 28),

              // Login button
              RoundButton(title: "Sign In", onPressed: btnLogin),

              const SizedBox(height: 18),

              // Forgot password
              TextButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ResetPasswordView()),
                ),
                child: Text(
                  "Forgot your password?",
                  style: TextStyle(
                    color: TColor.accent,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),

              const SizedBox(height: 35),

              // Divider
              Row(
                children: [
                  Expanded(
                    child: Divider(color: TColor.placeholder.withAlpha(60)),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      "NEW HERE?",
                      style: TextStyle(
                        color: TColor.placeholder,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  Expanded(
                    child: Divider(color: TColor.placeholder.withAlpha(60)),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Sign up button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SignUpView()),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: TColor.primary,
                    side: BorderSide(color: TColor.primary, width: 2),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                  ),
                  child: const Text(
                    "Create Account",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 30),
            ],
          ),
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
        Globs.udSet(payload, Globs.userPayload);
        Globs.udBoolSet(true, Globs.userLogin);
        String role = payload[KKey.role] ?? "client";
        Globs.udStringSet(role, Globs.userRole);
        ServiceCall.userPayload = payload;
        final prefs = await SharedPreferences.getInstance();
        final stored = prefs.getString(Globs.userPayload);
        print('📦 Stored payload: $stored');
        Widget nextScreen;
        if (role == 'delivery') {
          nextScreen = const DeliveryHomeView();
        } else {
          nextScreen = const MainTabView();
        }
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => nextScreen),
          (route) => false,
        );
      } else {
        if (!mounted) return;
        mdShowAlert(
          Globs.appName,
          responseObj[KKey.message] as String? ?? MSG.fail,
          () {},
        );
      }
    }, failure: (err) async {
      Globs.hideHUD();
      if (!mounted) return;
      mdShowAlert(Globs.appName, err.toString(), () {});
    });
  }
}