import 'package:flutter/material.dart';
import '../common/color_extension.dart';

class PopularRestaurantRow extends StatelessWidget {
  final Map pObj;
  final VoidCallback onTap;
  const PopularRestaurantRow({super.key, required this.pObj, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final imagePath = pObj["image"]?.toString() ?? '';
    final isNetworkImage = imagePath.startsWith('http');
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: double.maxFinite,
              height: 200,
              child: imagePath.isNotEmpty
                ? (isNetworkImage
                    ? Image.network(
                        imagePath,
                        width: double.maxFinite,
                        height: 200,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return _buildPlaceholder();
                        },
                      )
                    : Image.asset(
                        imagePath,
                        width: double.maxFinite,
                        height: 200,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                      ))
                : _buildPlaceholder(),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pObj["name"]?.toString() ?? "Restaurant",
                    style: TextStyle(
                      color: TColor.primaryText,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.star, color: TColor.primary, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        pObj["rate"]?.toString() ?? "4.5",
                        style: TextStyle(color: TColor.primary, fontSize: 11),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "(${pObj["rating"]?.toString() ?? "0"} Ratings)",
                        style: TextStyle(color: TColor.secondaryText, fontSize: 11),
                      ),
                      if (pObj["type"]?.toString().isNotEmpty == true) ...[
                        const SizedBox(width: 8),
                        Text(
                          pObj["type"]?.toString() ?? "",
                          style: TextStyle(color: TColor.secondaryText, fontSize: 11),
                        ),
                        Text(
                          " · ",
                          style: TextStyle(color: TColor.primary, fontSize: 11),
                        ),
                      ],
                      Text(
                        pObj["food_type"]?.toString() ?? "",
                        style: TextStyle(color: TColor.secondaryText, fontSize: 12),
                      ),
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

  Widget _buildPlaceholder() {
    return Container(
      width: double.maxFinite,
      height: 200,
      color: TColor.textfield,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.restaurant, color: TColor.primary, size: 50),
            const SizedBox(height: 8),
            Text(
              pObj["name"]?.toString() ?? "Restaurant",
              style: TextStyle(color: TColor.placeholder, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}