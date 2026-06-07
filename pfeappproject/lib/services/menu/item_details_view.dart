import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../../common/color_extension.dart';
import '../../common/cart.dart';
import '../more/cart_view.dart';
import '../more/checkout_view.dart';

class ItemDetailsView extends StatefulWidget {
  final Map product;
  const ItemDetailsView({super.key, required this.product});

  @override
  State<ItemDetailsView> createState() => _ItemDetailsViewState();
}

class _ItemDetailsViewState extends State<ItemDetailsView> {
  late double price;
  int qty = 1;
  bool isFav = false;

  @override
  void initState() {
    super.initState();
    final rawPrice = widget.product['price'];
    if (rawPrice is double) {
      price = rawPrice;
    } else if (rawPrice is int) {
      price = rawPrice.toDouble();
    } else {
      price = double.tryParse(rawPrice.toString()) ?? 0.0;
    }
  }

  void _addToCart() {
    final product = widget.product;
    Cart.addItem(CartItem(
      id: product['_id']?.toString() ?? DateTime.now().toString(),
      name: product['name']?.toString() ?? "Product",
      price: price,
      quantity: qty,
      image: product['image']?.toString() ?? "",
    ));
    
    setState(() {});
    
    if (mounted) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("${product['name']} x$qty added (Total: ${Cart.totalItems} items)"),
          duration: const Duration(seconds: 1),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _buyNow() {
    final product = widget.product;
    Cart.addItem(CartItem(
      id: product['_id']?.toString() ?? DateTime.now().toString(),
      name: product['name']?.toString() ?? "Product",
      price: price,
      quantity: qty,
      image: product['image']?.toString() ?? "",
    ));
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CheckoutView()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final media = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: TColor.white,
      body: Stack(
        alignment: Alignment.topCenter,
        children: [
          Image.asset("assets/img/detail_top.png", width: media.width, height: media.width, fit: BoxFit.cover),
          Container(width: media.width, height: media.width, decoration: const BoxDecoration(gradient: LinearGradient(colors: [Colors.black, Colors.transparent, Colors.black], begin: Alignment.topCenter, end: Alignment.bottomCenter))),
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  Column(
                    children: [
                      SizedBox(height: media.width - 60),
                      Container(
                        decoration: BoxDecoration(color: TColor.white, borderRadius: const BorderRadius.only(topLeft: Radius.circular(30), topRight: Radius.circular(30))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 35),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Text(product['name']?.toString() ?? "Product", style: TextStyle(color: TColor.primaryText, fontSize: 22, fontWeight: FontWeight.w800)),
                            ),
                            const SizedBox(height: 8),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    IgnorePointer(
                                      ignoring: true,
                                      child: RatingBar.builder(
                                        initialRating: 4.5,
                                        minRating: 1,
                                        direction: Axis.horizontal,
                                        allowHalfRating: true,
                                        itemCount: 5,
                                        itemSize: 20,
                                        itemBuilder: (context, _) => Icon(Icons.star, color: TColor.primary),
                                        onRatingUpdate: (rating) {},
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text("4.5 Star Ratings", style: TextStyle(color: TColor.primary, fontSize: 11, fontWeight: FontWeight.w500)),
                                  ]),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text("\$${price.toStringAsFixed(2)}", style: TextStyle(color: TColor.primaryText, fontSize: 31, fontWeight: FontWeight.w700)),
                                      const SizedBox(height: 4),
                                      Text("/per Portion", style: TextStyle(color: TColor.primaryText, fontSize: 11, fontWeight: FontWeight.w500)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 15),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Text("Description", style: TextStyle(color: TColor.primaryText, fontSize: 14, fontWeight: FontWeight.w700)),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Text(product['description']?.toString() ?? "Delicious food item", style: TextStyle(color: TColor.secondaryText, fontSize: 12)),
                            ),
                            const SizedBox(height: 20),
                            Divider(color: TColor.secondaryText.withValues(alpha: 0.4), height: 1),
                            const SizedBox(height: 20),
                            
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Row(
                                children: [
                                  Text("Number of Portions", style: TextStyle(color: TColor.primaryText, fontSize: 14, fontWeight: FontWeight.w700)),
                                  const Spacer(),
                                  _buildQtyBtn("-", () => setState(() { if (qty > 1) qty--; })),
                                  const SizedBox(width: 8),
                                  Container(padding: const EdgeInsets.symmetric(horizontal: 15), height: 25, alignment: Alignment.center, decoration: BoxDecoration(border: Border.all(color: TColor.primary), borderRadius: BorderRadius.circular(12.5)), child: Text(qty.toString(), style: TextStyle(color: TColor.primary, fontSize: 14))),
                                  const SizedBox(width: 8),
                                  _buildQtyBtn("+", () => setState(() => qty++)),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 25),
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: TColor.textfield,
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text("Total Price", style: TextStyle(color: TColor.secondaryText, fontSize: 14)),
                                        Text("\$${(price * qty).toStringAsFixed(2)}", style: TextStyle(color: TColor.primary, fontSize: 24, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 15),
                                    SizedBox(
                                      width: double.infinity,
                                      height: 48,
                                      child: ElevatedButton(
                                        onPressed: _addToCart,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.white,
                                          foregroundColor: TColor.primary,
                                          side: BorderSide(color: TColor.primary, width: 2),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                                          elevation: 0,
                                        ),
                                        child: const Text("Add to Cart", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    SizedBox(
                                      width: double.infinity,
                                      height: 48,
                                      child: ElevatedButton(
                                        onPressed: _buyNow,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: TColor.primary,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                                          elevation: 2,
                                        ),
                                        child: const Text("Buy Now", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 30),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Positioned(bottom: 0, right: 4, child: InkWell(onTap: () => setState(() => isFav = !isFav), child: Image.asset(isFav ? "assets/img/favorites_btn.png" : "assets/img/favorites_btn_2.png", width: 70, height: 70))),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              children: [
                const SizedBox(height: 35),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.arrow_back_ios, color: TColor.white, size: 22)),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => const CartView()),
                              ).then((_) => setState(() {}));
                            },
                            icon: Icon(Icons.shopping_cart_outlined, color: TColor.white, size: 28),
                          ),
                          if (Cart.totalItems > 0)
                            Positioned(
                              right: 2, top: 2,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(10)),
                                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                                child: Text(Cart.totalItems.toString(), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                              ),
                            ),
                        ],
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

  Widget _buildQtyBtn(String text, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15),
        height: 25,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: TColor.primary, borderRadius: BorderRadius.circular(12.5)),
        child: Text(text, style: TextStyle(color: TColor.white, fontSize: 14, fontWeight: FontWeight.w700)),
      ),
    );
  }
}