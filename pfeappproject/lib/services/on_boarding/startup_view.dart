import 'package:flutter/material.dart';
import 'package:food_delivery/services/login/welcome_view.dart';
import 'package:food_delivery/services/main_tabview/main_tabview.dart';
import 'package:food_delivery/delivery/views/delivery_home_view.dart';
import '../../common/globs.dart';

class StartupView extends StatefulWidget {
  const StartupView({super.key});

  @override
  State<StartupView> createState() => _StartupViewState();
}

class _StartupViewState extends State<StartupView> {
  @override
  void initState() {
    super.initState();
    _goToPage();
  }

  Future<void> _goToPage() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!Globs.udValueBool(Globs.userLogin)) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const WelcomeView()));
    } else {
      String role = Globs.udValueString(Globs.userRole);
      if (role == 'delivery') {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DeliveryHomeView()));
      } else {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainTabView()));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        alignment: Alignment.center,
        children: [
          Image.asset("assets/img/splash_bg.png", width: double.infinity, height: double.infinity, fit: BoxFit.cover),
          Image.asset("assets/img/new.png", width: MediaQuery.of(context).size.width * 0.55),
        ],
      ),
    );
  }
}