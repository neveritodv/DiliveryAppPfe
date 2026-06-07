import 'package:flutter/material.dart';
import 'package:food_delivery/common/color_extension.dart';
import 'package:food_delivery/common/cart.dart';
import 'package:food_delivery/common_widget/round_textfield.dart';
import '../../common_widget/menu_item_row.dart';
import '../../services/product_service.dart';
import '../more/cart_view.dart';
import 'item_details_view.dart';

class MenuItemsView extends StatefulWidget {
  final Map mObj;
  const MenuItemsView({super.key, required this.mObj});

  @override
  State<MenuItemsView> createState() => _MenuItemsViewState();
}

class _MenuItemsViewState extends State<MenuItemsView> {
  TextEditingController txtSearch = TextEditingController();
  List<dynamic> menuItemsArr = [];
  List<dynamic> filteredItems = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
    txtSearch.addListener(_filterItems);
  }

  @override
  void dispose() {
    txtSearch.removeListener(_filterItems);
    txtSearch.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => isLoading = true);
    final products = await ProductService.getProducts();
    if (mounted) {
      setState(() {
        menuItemsArr = products;
        filteredItems = products;
        isLoading = false;
      });
    }
  }

  void _filterItems() {
    final query = txtSearch.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        filteredItems = menuItemsArr;
      } else {
        filteredItems = menuItemsArr.where((item) {
          final name = (item['name']?.toString() ?? '').toLowerCase();
          final type = (item['type']?.toString() ?? '').toLowerCase();
          final foodType = (item['food_type']?.toString() ?? '').toLowerCase();
          final desc = (item['description']?.toString() ?? '').toLowerCase();
          return name.contains(query) || type.contains(query) || foodType.contains(query) || desc.contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              const SizedBox(height: 46),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(widget.mObj["name"].toString(),
                        style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800)),
                    ),
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
                          icon: Icon(Icons.shopping_cart_outlined, color: TColor.primaryText, size: 28),
                        ),
                        if (Cart.totalItems > 0)
                          Positioned(
                            right: 2, top: 2,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(color: TColor.accent, borderRadius: BorderRadius.circular(10)),
                              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                              child: Text(Cart.totalItems.toString(),
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center),
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
                child: RoundTextfield(
                  hintText: "Search Food",
                  controller: txtSearch,
                  left: Container(
                    alignment: Alignment.center,
                    width: 30,
                    child: Icon(Icons.search, color: TColor.placeholder),
                  ),
                ),
              ),
              const SizedBox(height: 15),
              if (isLoading)
                const Center(child: CircularProgressIndicator())
              else if (filteredItems.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        Icon(Icons.search_off, size: 64, color: TColor.placeholder),
                        const SizedBox(height: 16),
                        Text("No products found", style: TextStyle(color: TColor.secondaryText, fontSize: 16)),
                      ],
                    ),
                  ),
                )
              else
                ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  itemCount: filteredItems.length,
                  itemBuilder: (context, index) {
                    final mObj = filteredItems[index] as Map? ?? {};
                    return MenuItemRow(
                      mObj: mObj,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => ItemDetailsView(product: mObj)),
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