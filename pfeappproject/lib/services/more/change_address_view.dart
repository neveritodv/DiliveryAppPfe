import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../common/color_extension.dart';
import '../../common_widget/round_textfield.dart';

class ChangeAddressView extends StatefulWidget {
  const ChangeAddressView({super.key});

  @override
  State<ChangeAddressView> createState() => _ChangeAddressViewState();
}

class _ChangeAddressViewState extends State<ChangeAddressView> {
  GoogleMapController? _controller;
  final LatLng _initialPosition = const LatLng(37.42796133580664, -122.085749655962);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: TColor.white,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: Image.asset("assets/img/btn_back.png", width: 20, height: 20),
        ),
        centerTitle: false,
        title: Text(
          "Change Address",
          style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800),
        ),
      ),
      body: Column(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: _initialPosition, zoom: 14),
              onMapCreated: (ctrl) => _controller = ctrl,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 25),
            child: RoundTextfield(
              hintText: "Search Address",
              left: Icon(Icons.search, color: TColor.primaryText),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25),
            child: Row(
              children: [
                Image.asset('assets/img/fav_icon.png', width: 35, height: 35),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Choose a saved place",
                    style: TextStyle(color: TColor.primaryText, fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
                Image.asset('assets/img/btn_next.png', width: 15, height: 15, color: TColor.primaryText),
              ],
            ),
          ),
        ],
      ),
    );
  }
}