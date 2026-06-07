import 'package:flutter/material.dart';
import 'package:food_delivery/common/cart.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/services/more/my_order_view.dart';

class CartIconButton extends StatefulWidget {
  final Color? iconColor;
  const CartIconButton({super.key, this.iconColor});

  @override
  State<CartIconButton> createState() => _CartIconButtonState();
}

class _CartIconButtonState extends State<CartIconButton> {
  int itemCount = 0;

  @override
  void initState() {
    super.initState();
    _updateCount();
  }

  void _updateCount() {
    itemCount = Cart.items.fold(0, (sum, item) => sum + item.quantity);
  }

  @override
  Widget build(BuildContext context) {
    _updateCount();
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MyOrderView()),
            ).then((_) => _updateCount());
          },
          icon: Icon(
            Icons.shopping_cart_outlined,
            color: widget.iconColor ?? TColor.primaryText,
            size: 28,
          ),
        ),
        if (itemCount > 0)
          Positioned(
            right: 2,
            top: 2,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
              ),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              child: Text(
                itemCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}