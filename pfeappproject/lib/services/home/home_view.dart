import 'package:flutter/material.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/cart.dart';
import 'package:food_delivery/common_widget/round_textfield.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import '../../common_widget/category_cell.dart';
import '../../common_widget/popular_resutaurant_row.dart';
import '../../common_widget/view_all_title_row.dart';
import '../more/cart_view.dart';
import '../menu/menu_items_view.dart';
import '../restaurant/restaurant_service.dart';
import '../offer/offer_view.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  TextEditingController txtSearch = TextEditingController();
  List popularRestaurants = [];
  List allRestaurants = [];
  List filteredPopular = [];
  List filteredAll = [];
  bool isLoading = true;

  List catArr = [
    {"image": "assets/img/cat_offer.png", "name": "Offers", "route": "offers"},
    {"image": "assets/img/cat_sri.png", "name": "Food", "route": "food"},
    {"image": "assets/img/cat_3.png", "name": "Italian", "route": "italian"},
    {"image": "assets/img/cat_4.png", "name": "Indian", "route": "indian"},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
    txtSearch.addListener(_filterResults);
  }

  @override
  void dispose() {
    txtSearch.removeListener(_filterResults);
    txtSearch.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    final popular = await RestaurantService.getPopularRestaurants();
    final all = await RestaurantService.getRestaurants();
    if (mounted) {
      setState(() {
        popularRestaurants = popular;
        allRestaurants = all;
        filteredPopular = popular;
        filteredAll = all;
        isLoading = false;
      });
    }
  }

  void _filterResults() {
    final query = txtSearch.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        filteredPopular = popularRestaurants;
        filteredAll = allRestaurants;
      } else {
        filteredPopular = popularRestaurants.where((r) {
          final name = (r['name']?.toString() ?? '').toLowerCase();
          final type = (r['type']?.toString() ?? '').toLowerCase();
          final foodType = (r['food_type']?.toString() ?? '').toLowerCase();
          return name.contains(query) || type.contains(query) || foodType.contains(query);
        }).toList();
        filteredAll = allRestaurants.where((r) {
          final name = (r['name']?.toString() ?? '').toLowerCase();
          final type = (r['type']?.toString() ?? '').toLowerCase();
          final foodType = (r['food_type']?.toString() ?? '').toLowerCase();
          return name.contains(query) || type.contains(query) || foodType.contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: TColor.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              children: [
                const SizedBox(height: 46),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Good morning ${ServiceCall.userPayload[KKey.name] ?? ""}!",
                          style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800),
                        ),
                      ),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const CartView())).then((_) => setState(() {}));
                            },
                            icon: Icon(Icons.shopping_cart_outlined, color: TColor.primaryText, size: 28),
                          ),
                          if (Cart.totalItems > 0)
                            Positioned(
                              right: 2, top: 2,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(color: TColor.accent, borderRadius: BorderRadius.circular(10)),
                                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                                child: Text(Cart.totalItems.toString(), style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Delivering to", style: TextStyle(color: TColor.secondaryText, fontSize: 11)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.location_on, color: TColor.accent, size: 18),
                          const SizedBox(width: 8),
                          Text("Current Location", style: TextStyle(color: TColor.secondaryText, fontSize: 16, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: RoundTextfield(
                    hintText: "Search Food",
                    controller: txtSearch,
                    left: Container(alignment: Alignment.center, width: 30, child: Icon(Icons.search, color: TColor.placeholder)),
                  ),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    itemCount: catArr.length,
                    itemBuilder: (context, index) {
                      var cObj = catArr[index] as Map? ?? {};
                      return CategoryCell(
                        cObj: cObj,
                        onTap: () {
                          if (index == 0) {
                            Navigator.push(context, MaterialPageRoute(builder: (context) => const OfferView()));
                          } else {
                            Navigator.push(context, MaterialPageRoute(builder: (context) => MenuItemsView(mObj: cObj)));
                          }
                        },
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ViewAllTitleRow(title: "Popular Restaurants", onView: () {}),
                ),
                if (isLoading)
                  const Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())
                else if (filteredPopular.isEmpty)
                  const Padding(padding: EdgeInsets.all(20), child: Text("No restaurants found"))
                else
                  ListView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    itemCount: filteredPopular.length,
                    itemBuilder: (context, index) {
                      var r = filteredPopular[index] as Map? ?? {};
                      var mappedR = {
                        "image": r['image']?.toString() ?? 'assets/img/res_1.png',
                        "name": r['name']?.toString() ?? 'Restaurant',
                        "rate": r['rate']?.toString() ?? '4.5',
                        "rating": r['rating']?.toString() ?? '0',
                        "type": r['type']?.toString() ?? '',
                        "food_type": r['food_type']?.toString() ?? '',
                      };
                      return PopularRestaurantRow(pObj: mappedR, onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => MenuItemsView(mObj: r)));
                      });
                    },
                  ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ViewAllTitleRow(title: "All Restaurants", onView: () {}),
                ),
                if (!isLoading && filteredAll.isNotEmpty)
                  ListView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    itemCount: filteredAll.length > 6 ? 6 : filteredAll.length,
                    itemBuilder: (context, index) {
                      var r = filteredAll[index] as Map? ?? {};
                      var mappedR = {
                        "image": r['image']?.toString() ?? 'assets/img/res_1.png',
                        "name": r['name']?.toString() ?? 'Restaurant',
                        "rate": r['rate']?.toString() ?? '4.5',
                        "rating": r['rating']?.toString() ?? '0',
                        "type": r['type']?.toString() ?? '',
                        "food_type": r['food_type']?.toString() ?? '',
                      };
                      return PopularRestaurantRow(pObj: mappedR, onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => MenuItemsView(mObj: r)));
                      });
                    },
                  ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}