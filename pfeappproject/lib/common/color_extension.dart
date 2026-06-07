//import 'package:flutter/material.dart';

// class TColor {
//   static Color get primary => const Color(0xffFC6011);
//   static Color get primaryText => const Color(0xff4A4B4D);
//   static Color get secondaryText => const Color(0xff7C7D7E);
//   static Color get textfield => const Color(0xffF2F2F2);
//   static Color get placeholder => const Color(0xffB6B7B7);
//   static Color get white => const Color(0xffffffff);
// }


import 'package:flutter/material.dart';

class TColor {
  // ✅ NEW: Violet as primary
  static Color get primary => const Color(0xff7C3AED);        // Violet
  static Color get primaryLight => const Color(0xffA78BFA);   // Light Violet
  static Color get primaryDark => const Color(0xff5B21B6);    // Dark Violet
  
  // ✅ NEW: Rose as accent
  static Color get accent => const Color(0xffF43F5E);         // Rose
  static Color get accentLight => const Color(0xffFDA4AF);    // Light Rose
  
  // Text colors
  static Color get primaryText => const Color(0xff1F2937);    // Dark gray
  static Color get secondaryText => const Color(0xff6B7280);  // Medium gray
  static Color get placeholder => const Color(0xff9CA3AF);    // Light gray
  
  // Backgrounds
  static Color get textfield => const Color(0xffF3F4F6);      // Very light gray
  static Color get white => const Color(0xffffffff);          // White
  static Color get background => const Color(0xffF9FAFB);     // Almost white
}