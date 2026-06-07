import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/locator.dart';
import 'package:food_delivery/common/service_call.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/services/on_boarding/startup_view.dart';
import 'package:food_delivery/services/login/welcome_view.dart';
import 'package:food_delivery/services/main_tabview/main_tabview.dart';
import 'package:food_delivery/services/notification_service.dart';
import 'package:food_delivery/services/websocket_service.dart';  // ✅ ADD THIS

void main() async {
  setUpLocator();
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  Globs.init(prefs);
  await NotificationService.init();

  if (Globs.udValueBool(Globs.userLogin)) {
    ServiceCall.userPayload = Globs.udValue(Globs.userPayload);
    WebSocketService.connect(); // persistent connection for chat
  }

  runApp(const MyApp(defaultHome: StartupView()));
  configLoading();
}

void configLoading() {
  EasyLoading.instance
    ..indicatorType = EasyLoadingIndicatorType.ring
    ..loadingStyle = EasyLoadingStyle.custom
    ..indicatorSize = 45.0
    ..radius = 5.0
    ..progressColor = TColor.primaryText
    ..backgroundColor = TColor.primary
    ..indicatorColor = Colors.yellow
    ..textColor = TColor.primaryText
    ..userInteractions = false
    ..dismissOnTap = false;
}

class MyApp extends StatelessWidget {
  final Widget defaultHome;
  const MyApp({super.key, required this.defaultHome});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Food Delivery',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(fontFamily: "Metropolis"),
      home: defaultHome,
      navigatorKey: locator<NavigationService>().navigatorKey,
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case "welcome":
            return MaterialPageRoute(builder: (context) => const WelcomeView());
          case "Home":
            return MaterialPageRoute(builder: (context) => const MainTabView());
          default:
            return null;
        }
      },
      builder: (context, child) => FlutterEasyLoading(child: child),
    );
  }
}