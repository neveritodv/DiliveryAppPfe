import 'package:flutter/material.dart';
import '../../common/color_extension.dart';
import '../../common/cart.dart';
import '../../common_widget/round_textfield.dart';
import '../more/cart_view.dart';
import 'menu_items_view.dart';

class MenuView extends StatefulWidget {
  const MenuView({super.key});

  @override
  State<MenuView> createState() => _MenuViewState();
}

class _MenuViewState extends State<MenuView> {
  List menuArr = [
    {"name": "Food", "image": "assets/img/menu_1.png", "items_count": "120"},
    {"name": "Beverages", "image": "assets/img/menu_2.png", "items_count": "220"},
    {"name": "Desserts", "image": "assets/img/menu_3.png", "items_count": "155"},
    {"name": "Promotions", "image": "assets/img/menu_4.png", "items_count": "25"},
  ];
  List filteredMenu = [];
  TextEditingController txtSearch = TextEditingController();

  @override
  void initState() {
    super.initState();
    filteredMenu = menuArr;
    txtSearch.addListener(_filterMenu);
  }

  @override
  void dispose() {
    txtSearch.removeListener(_filterMenu);
    txtSearch.dispose();
    super.dispose();
  }

  void _filterMenu() {
    final query = txtSearch.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        filteredMenu = menuArr;
      } else {
        filteredMenu = menuArr.where((item) {
          final name = (item['name']?.toString() ?? '').toLowerCase();
          return name.contains(query);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    var media = MediaQuery.of(context).size;
    return Scaffold(
      body: Stack(
        alignment: Alignment.centerLeft,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 180),
            width: media.width * 0.27,
            height: media.height * 0.6,
            decoration: BoxDecoration(
              color: TColor.primary,
              borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(35),
                  bottomRight: Radius.circular(35)),
            ),
          ),
          SingleChildScrollView(
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
                        Text("Menu", style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800)),
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
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: RoundTextfield(
                      hintText: "Search Food",
                      controller: txtSearch,
                      left: Container(alignment: Alignment.center, width: 30, child: Image.asset("assets/img/search.png", width: 20, height: 20)),
                    ),
                  ),
                  const SizedBox(height: 30),
                  if (filteredMenu.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(40),
                      child: Text("No categories found", style: TextStyle(color: TColor.secondaryText, fontSize: 16)),
                    )
                  else
                    ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      itemCount: filteredMenu.length,
                      itemBuilder: (context, index) {
                        var mObj = filteredMenu[index];
                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => MenuItemsView(mObj: mObj)),
                            );
                          },
                          child: Stack(
                            alignment: Alignment.centerRight,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(top: 8, bottom: 8, right: 20),
                                width: media.width - 100,
                                height: 90,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.only(
                                    topLeft: Radius.circular(25),
                                    bottomLeft: Radius.circular(25),
                                    topRight: Radius.circular(10),
                                    bottomRight: Radius.circular(10),
                                  ),
                                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 7, offset: Offset(0, 4))],
                                ),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Image.asset(mObj["image"].toString(), width: 80, height: 80, fit: BoxFit.contain),
                                  const SizedBox(width: 15),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(mObj["name"].toString(), style: TextStyle(color: TColor.primaryText, fontSize: 22, fontWeight: FontWeight.w700)),
                                        const SizedBox(height: 4),
                                        Text("${mObj["items_count"].toString()} items", style: TextStyle(color: TColor.secondaryText, fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    width: 35,
                                    height: 35,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(17.5),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                                    ),
                                    alignment: Alignment.center,
                                    child: Image.asset("assets/img/btn_next.png", width: 15, height: 15),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}