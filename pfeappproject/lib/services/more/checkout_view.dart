import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common_widget/round_button.dart';
import 'package:food_delivery/common/service_call.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common/cart.dart';
import 'package:food_delivery/client/order_tracking_view.dart';
import 'change_address_view.dart';

class CheckoutView extends StatefulWidget {
  const CheckoutView({super.key});

  @override
  State<CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends State<CheckoutView> {
  List paymentArr = [
    {"name": "Cash on delivery", "icon": "assets/img/cash.png", "type": "cash"},
    {"name": "Credit/Debit Card (Stripe)", "icon": "assets/img/visa_icon.png", "type": "stripe"},
    {"name": "**** **** **** 2187 (Saved)", "icon": "assets/img/visa_icon.png", "type": "saved_card"},
    {"name": "test@gmail.com", "icon": "assets/img/paypal.png", "type": "paypal"},
  ];
  int selectMethod = -1;
  bool isSending = false;

  final cardNumberController = TextEditingController();
  final expiryController = TextEditingController();
  final cvcController = TextEditingController();

  double get subTotal => Cart.totalPrice;
  double get deliveryCost => 2.0;
  double get discount => 4.0;
  double get total => subTotal + deliveryCost - discount;

  Future<void> _sendOrder({String paymentMethod = 'cash'}) async {
    if (Cart.items.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Cart is empty")));
      }
      return;
    }

    setState(() => isSending = true);

    final items = Cart.items
        .map((item) => {"name": item.name, "price": item.price, "quantity": item.quantity})
        .toList();

    final orderData = {
      "items": items,
      "total": total,
      "deliveryAddress": "653 Nostrand Ave.\nBrooklyn, NY 11216",
      "paymentMethod": paymentMethod,
    };

    final token = ServiceCall.userPayload['auth_token'] ?? '';
    if (token.isEmpty) {
      setState(() => isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Please login again (token missing)")),
        );
      }
      return;
    }

    final url = Uri.parse('${SVKey.mainUrl}/api/orders');
    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(orderData),
      );

      setState(() => isSending = false);

      if (response.statusCode == 200) {
        final String body = response.body;
        if (body.trim().isEmpty) throw Exception('Empty response');
        final data = jsonDecode(body);
        if (data['status'] == '1') {
          final orderId = data['payload']['_id'];
          Cart.clear();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Order placed successfully!"),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
              ),
            );
            // ✅ Navigate to client map tracking view
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => OrderTrackingView(
                  orderId: orderId,
                  destLat: 48.8566,
                  destLng: 2.3522,
                ),
              ),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Order failed: ${data['message'] ?? 'Unknown error'}")),
            );
          }
        }
      }
    } catch (e) {
      setState(() => isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Network error: ${e.toString()}")),
        );
      }
    }
  }

  void _showStripeCardForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            const Text("Enter Card Details", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            TextField(
              controller: cardNumberController,
              keyboardType: TextInputType.number,
              maxLength: 19,
              decoration: InputDecoration(
                labelText: "Card Number",
                hintText: "4242 4242 4242 4242",
                prefixIcon: const Icon(Icons.credit_card),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: expiryController,
                    decoration: InputDecoration(
                      labelText: "Expiry (MM/YY)",
                      hintText: "12/28",
                      prefixIcon: const Icon(Icons.calendar_today),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: cvcController,
                    maxLength: 4,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: "CVC",
                      hintText: "123",
                      prefixIcon: const Icon(Icons.lock),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
              child: const Text("Test: 4242 4242 4242 4242 | Any date | Any CVC",
                style: TextStyle(fontSize: 11, color: Colors.blue)),
            ),
            const SizedBox(height: 15),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  if (cardNumberController.text.isEmpty || expiryController.text.isEmpty || cvcController.text.isEmpty) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text("Please fill all card details")),
                    );
                    return;
                  }
                  Navigator.pop(ctx);
                  _processStripePayment();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF635BFF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text("Pay \$${total.toStringAsFixed(2)}", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _processStripePayment() async {
    setState(() => isSending = true);
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/payment/create-payment-intent');
      await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': total, 'currency': 'usd'}),
      );
      await _sendOrder(paymentMethod: 'stripe');
    } catch (e) {
      setState(() => isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  void _handlePayment() {
    if (selectMethod == -1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Select payment method")),
      );
      return;
    }

    final type = paymentArr[selectMethod]["type"] as String;

    if (type == "stripe") {
      _showStripeCardForm();
    } else if (type == "cash") {
      _sendOrder(paymentMethod: 'cash');
    } else if (type == "saved_card") {
      _sendOrder(paymentMethod: 'saved_card');
    } else if (type == "paypal") {
      _sendOrder(paymentMethod: 'paypal');
    }
  }

  @override
  void dispose() {
    cardNumberController.dispose();
    expiryController.dispose();
    cvcController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 46),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text("Checkout",
                        style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 25),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Delivery Address", style: TextStyle(color: TColor.secondaryText, fontSize: 12)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Text("653 Nostrand Ave.\nBrooklyn, NY 11216",
                            style: TextStyle(color: TColor.primaryText, fontSize: 15, fontWeight: FontWeight.w700)),
                        ),
                        TextButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ChangeAddressView())),
                          child: Text("Change", style: TextStyle(color: TColor.primary, fontSize: 13, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(decoration: BoxDecoration(color: TColor.textfield), height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 25),
                child: Column(
                  children: [
                    const SizedBox(height: 15),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Payment method", style: TextStyle(color: TColor.secondaryText, fontSize: 13)),
                        TextButton.icon(
                          onPressed: () {},
                          icon: Icon(Icons.add, color: TColor.primary),
                          label: Text("Add Card", style: TextStyle(color: TColor.primary, fontSize: 13)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: paymentArr.length,
                      itemBuilder: (context, index) {
                        final pObj = paymentArr[index];
                        final isSelected = selectMethod == index;
                        return GestureDetector(
                          onTap: () => setState(() => selectMethod = index),
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 6),
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 15),
                            decoration: BoxDecoration(
                              color: isSelected ? TColor.primary.withAlpha(15) : TColor.textfield,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? TColor.primary : TColor.secondaryText.withAlpha(51),
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Image.asset(pObj["icon"]!, width: 40, height: 25),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(pObj["name"]!,
                                    style: TextStyle(
                                      color: TColor.primaryText,
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                    )),
                                ),
                                Container(
                                  width: 22,
                                  height: 22,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: isSelected ? TColor.primary : Colors.grey, width: 2),
                                  ),
                                  child: isSelected
                                    ? Center(
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: BoxDecoration(shape: BoxShape.circle, color: TColor.primary),
                                        ),
                                      )
                                    : null,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(decoration: BoxDecoration(color: TColor.textfield), height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 25),
                child: Column(
                  children: [
                    const SizedBox(height: 15),
                    _buildRow("Sub Total", "\$${subTotal.toStringAsFixed(2)}"),
                    const SizedBox(height: 8),
                    _buildRow("Delivery Cost", "\$2.00"),
                    const SizedBox(height: 8),
                    _buildRow("Discount", "-\$4.00"),
                    const SizedBox(height: 15),
                    Divider(color: TColor.secondaryText.withAlpha(127)),
                    const SizedBox(height: 15),
                    _buildRow("Total", "\$${total.toStringAsFixed(2)}", isTotal: true),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(decoration: BoxDecoration(color: TColor.textfield), height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 25),
                child: isSending
                  ? const Center(child: CircularProgressIndicator())
                  : RoundButton(title: "Send Order", onPressed: _handlePayment),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(
          color: TColor.primaryText,
          fontSize: isTotal ? 15 : 13,
          fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500)),
        Text(value, style: TextStyle(
          color: TColor.primaryText,
          fontSize: isTotal ? 15 : 13,
          fontWeight: FontWeight.w700)),
      ],
    );
  }
}