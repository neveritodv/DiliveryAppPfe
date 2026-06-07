import 'package:flutter/material.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/cart.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common_widget/round_button.dart';
import 'checkout_view.dart';

class CartView extends StatefulWidget {
  const CartView({super.key});

  @override
  State<CartView> createState() => _CartViewState();
}

class _CartViewState extends State<CartView> {
  
  // ✅ Helper to get full image URL
  String getFullImageUrl(String image) {
    if (image.isEmpty) return '';
    if (image.startsWith('http')) return image;
    return '${SVKey.mainUrl}$image';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: Column(
        children: [
          const SizedBox(height: 46),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.arrow_back_ios, color: TColor.primaryText, size: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "My Cart",
                    style: TextStyle(
                      color: TColor.primaryText,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (Cart.items.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      Cart.clear();
                      setState(() {});
                    },
                    child: const Text("Clear", style: TextStyle(color: Colors.red)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Cart.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 80, color: TColor.placeholder),
                      const SizedBox(height: 16),
                      Text("Your cart is empty", 
                        style: TextStyle(color: TColor.secondaryText, fontSize: 16)),
                      const SizedBox(height: 8),
                      Text("Add items from the menu", 
                        style: TextStyle(color: TColor.placeholder, fontSize: 13)),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(15),
                        itemCount: Cart.items.length,
                        itemBuilder: (ctx, i) {
                          final item = Cart.items[i];
                          final imageUrl = getFullImageUrl(item.image);
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(15),
                              child: Row(
                                children: [
                                  // ✅ Item image with proper error handling
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: Container(
                                      width: 60,
                                      height: 60,
                                      decoration: BoxDecoration(
                                        color: TColor.textfield,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: imageUrl.isNotEmpty
                                        ? Image.network(
                                            imageUrl,
                                            width: 60,
                                            height: 60,
                                            fit: BoxFit.cover,
                                            errorBuilder: (context, error, stackTrace) {
                                              return Icon(Icons.fastfood, color: TColor.primary, size: 30);
                                            },
                                            loadingBuilder: (context, child, loadingProgress) {
                                              if (loadingProgress == null) return child;
                                              return Center(
                                                child: CircularProgressIndicator(
                                                  value: loadingProgress.expectedTotalBytes != null
                                                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                                    : null,
                                                  strokeWidth: 2,
                                                ),
                                              );
                                            },
                                          )
                                        : Icon(Icons.fastfood, color: TColor.primary, size: 30),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Item details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item.name,
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            color: TColor.primaryText,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text("\$${item.price.toStringAsFixed(2)}",
                                          style: TextStyle(
                                            color: TColor.primary,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Quantity controls
                                  Column(
                                    children: [
                                      InkWell(
                                        onTap: () {
                                          Cart.updateQuantity(item.id, item.quantity + 1);
                                          setState(() {});
                                        },
                                        child: Icon(Icons.add_circle, color: TColor.primary, size: 28),
                                      ),
                                      const SizedBox(height: 4),
                                      Text("${item.quantity}",
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      InkWell(
                                        onTap: () {
                                          if (item.quantity > 1) {
                                            Cart.updateQuantity(item.id, item.quantity - 1);
                                          } else {
                                            Cart.removeItem(item.id);
                                          }
                                          setState(() {});
                                        },
                                        child: Icon(
                                          Icons.remove_circle,
                                          color: item.quantity > 1 ? TColor.primary : Colors.red,
                                          size: 28,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    // Total + Checkout button
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: TColor.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 10,
                            offset: const Offset(0, -4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text("Subtotal (${Cart.totalItems} items)",
                                style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
                              Text("\$${Cart.totalPrice.toStringAsFixed(2)}",
                                style: TextStyle(
                                  color: TColor.primaryText,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 20,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 15),
                          RoundButton(
                            title: "Proceed to Checkout",
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const CheckoutView(),
                                ),
                              ).then((_) => setState(() {}));
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
          ),
        ],
      ),
    );
  }
}