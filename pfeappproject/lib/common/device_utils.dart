import 'package:flutter/foundation.dart';

String get deviceType {
  if (kIsWeb) return 'W';
  // On mobile, defaultTargetPlatform works
  try {
    if (defaultTargetPlatform == TargetPlatform.android) return 'A';
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'I';
  } catch (_) {}
  return 'A'; // fallback
}