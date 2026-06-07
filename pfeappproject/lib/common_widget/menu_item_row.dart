import 'package:flutter/material.dart';
import '../common/color_extension.dart';
import '../common/globs.dart';

class MenuItemRow extends StatelessWidget {
  final Map mObj;
  final VoidCallback onTap;
  const MenuItemRow({super.key, required this.mObj, required this.onTap});

  String getImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('assets/')) return path;
    return '${SVKey.mainUrl}$path';
  }

  @override
  Widget build(BuildContext context) {
    final imagePath = mObj['image']?.toString() ?? '';
    final isNetworkImage = imagePath.startsWith('http');
    final isAssetImage = imagePath.startsWith('assets/');
    final name = mObj['name']?.toString() ?? 'No name';
    final rate = mObj['rate']?.toString() ?? '0';
    final type = mObj['type']?.toString() ?? '';
    final foodType = mObj['food_type']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: onTap,
        child: Stack(
          alignment: Alignment.bottomLeft,
          children: [
            // ✅ Image handling
            SizedBox(
              width: double.infinity,
              height: 200,
              child: imagePath.isNotEmpty
                ? (isNetworkImage
                    ? Image.network(imagePath, width: double.infinity, height: 200, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholder(name))
                    : isAssetImage
                        ? Image.asset(imagePath, width: double.infinity, height: 200, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _placeholder(name))
                        : _placeholder(name))
                : _placeholder(name),
            ),
            // Gradient overlay
            Container(
              width: double.infinity,
              height: 200,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.transparent, Colors.black54],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
            // Text info
            Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 14),
                      const SizedBox(width: 4),
                      Text(rate, style: TextStyle(color: TColor.primary, fontSize: 12)),
                      if (type.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(type, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                      if (type.isNotEmpty && foodType.isNotEmpty)
                        Text(" · ", style: TextStyle(color: TColor.primary, fontSize: 12)),
                      if (foodType.isNotEmpty)
                        Text(foodType, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(String name) {
    return Container(
      width: double.infinity,
      height: 200,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [TColor.primary.withAlpha(100), TColor.primary.withAlpha(50)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.fastfood, color: Colors.white, size: 50),
            const SizedBox(height: 8),
            Text(name, style: TextStyle(color: Colors.white70, fontSize: 16)),
          ],
        ),
      ),
    );
  }
}