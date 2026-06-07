import 'package:flutter/material.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/globs.dart';
import 'package:food_delivery/common_widget/round_button.dart';
import '../../common_widget/popular_resutaurant_row.dart';
import '../more/cart_view.dart';
import '../menu/item_details_view.dart';
import 'offer_service.dart';

class OfferView extends StatefulWidget {
  const OfferView({super.key});

  @override
  State<OfferView> createState() => _OfferViewState();
}

class _OfferViewState extends State<OfferView> {
  TextEditingController txtSearch = TextEditingController();
  List offers = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    setState(() => isLoading = true);
    final data = await OfferService.getOffers();
    if (mounted) {
      setState(() {
        offers = data;
        isLoading = false;
      });
    }
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
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Latest Offers",
                      style: TextStyle(
                        color: TColor.primaryText,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const CartView()),
                        );
                      },
                      icon: Icon(Icons.shopping_cart_outlined, color: TColor.primaryText, size: 28),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "Find discounts, Offers special\nmeals and more!",
                  style: TextStyle(
                    color: TColor.secondaryText,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: SizedBox(
                  width: 140,
                  height: 36,
                  child: RoundButton(
                    title: "Check Offers",
                    fontSize: 12,
                    onPressed: _loadOffers,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              if (isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (offers.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.local_offer, size: 64, color: TColor.placeholder),
                        const SizedBox(height: 16),
                        Text(
                          "No offers available",
                          style: TextStyle(color: TColor.secondaryText, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  itemCount: offers.length,
                  itemBuilder: (context, index) {
                    var offer = offers[index] as Map? ?? {};
                    
                    // ✅ Keep image path as-is (asset or network)
                    String imagePath = offer['image']?.toString() ?? '';
                    if (imagePath.isEmpty) {
                      imagePath = 'assets/img/offer_1.png';
                    }
                    
                    var mappedOffer = {
                      "image": imagePath, // ✅ Don't convert to URL
                      "name": offer['name']?.toString() ?? 'Offer',
                      "rate": offer['rate']?.toString() ?? '4.5',
                      "rating": offer['rating']?.toString() ?? '0',
                      "type": offer['type']?.toString() ?? 'Food',
                      "food_type": offer['food_type']?.toString() ?? 'Meal',
                      "offerPrice": offer['offerPrice']?.toString() ?? '',
                      "originalPrice": offer['price']?.toString() ?? '',
                    };
                    
                    return PopularRestaurantRow(
                      pObj: mappedOffer,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ItemDetailsView(product: offer),
                          ),
                        );
                      },
                    );
                  },
                ),
              
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}