import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import '../../common_widget/round_button.dart';
import '../../common_widget/round_textfield.dart';
import '../more/my_order_view.dart';

class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  final ImagePicker picker = ImagePicker();
  XFile? image;

  TextEditingController txtName = TextEditingController();
  TextEditingController txtEmail = TextEditingController();
  TextEditingController txtMobile = TextEditingController();
  TextEditingController txtAddress = TextEditingController();
  TextEditingController txtPassword = TextEditingController();
  TextEditingController txtConfirmPassword = TextEditingController();

  bool isLoading = false;
  Map userData = {};

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final payload = Globs.udValue(Globs.userPayload);
    setState(() {
      userData = payload ?? {};
      txtName.text = payload?['name'] ?? '';
      txtEmail.text = payload?['email'] ?? '';
      txtMobile.text = payload?['mobile'] ?? '';
      txtAddress.text = payload?['address'] ?? '';
    });
  }

  Future<void> _updateProfile() async {
    if (txtPassword.text.isNotEmpty && txtPassword.text != txtConfirmPassword.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Passwords do not match")),
      );
      return;
    }

    setState(() => isLoading = true);

    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/auth/update-profile');

    Map<String, dynamic> updateData = {
      'name': txtName.text,
      'mobile': txtMobile.text,
      'address': txtAddress.text,
    };
    if (txtPassword.text.isNotEmpty) {
      updateData['password'] = txtPassword.text;
    }

    try {
      final response = await http.patch(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(updateData),
      );

      if (mounted) setState(() => isLoading = false);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == '1') {
          final updatedPayload = {...userData, ...updateData};
          Globs.udSet(updatedPayload, Globs.userPayload);
          ServiceCall.userPayload = updatedPayload;
          _loadUserData();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Profile updated"), backgroundColor: Colors.green),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

void _signOut() {
  Globs.udBoolSet(false, Globs.userLogin);
  Globs.udSet({}, Globs.userPayload);
  ServiceCall.userPayload = {};
  Navigator.pushNamedAndRemoveUntil(context, 'welcome', (route) => false);
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
            const SizedBox(height: 46),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Profile", style: TextStyle(color: TColor.primaryText, fontSize: 20, fontWeight: FontWeight.w800)),
                  IconButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const MyOrderView()));
                    },
                    icon: Icon(Icons.shopping_cart_outlined, color: TColor.primaryText, size: 28),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Avatar
            GestureDetector(
              onTap: () async {
                image = await picker.pickImage(source: ImageSource.gallery);
                setState(() {});
              },
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: TColor.textfield,
                  borderRadius: BorderRadius.circular(50),
                  border: Border.all(color: TColor.primary.withAlpha(51), width: 2),
                ),
                alignment: Alignment.center,
                child: image != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(50),
                      child: Image.file(File(image!.path), width: 100, height: 100, fit: BoxFit.cover),
                    )
                  : Icon(Icons.person, size: 60, color: TColor.secondaryText),
              ),
            ),
            TextButton.icon(
              onPressed: () async {
                image = await picker.pickImage(source: ImageSource.gallery);
                setState(() {});
              },
              icon: Icon(Icons.edit, color: TColor.primary, size: 12),
              label: Text("Edit Profile", style: TextStyle(color: TColor.primary, fontSize: 12)),
            ),
            Text(
              userData['name'] ?? "Hi there!",
              style: TextStyle(color: TColor.primaryText, fontSize: 16, fontWeight: FontWeight.w700),
            ),
            TextButton(
              onPressed: _signOut,
              child: Text("Sign Out", style: TextStyle(color: Colors.red, fontSize: 13)),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Name", hintText: "Enter Name", controller: txtName),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Email", hintText: "Enter Email", controller: txtEmail),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Mobile No", hintText: "Enter Mobile No", controller: txtMobile, keyboardType: TextInputType.phone),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Address", hintText: "Enter Address", controller: txtAddress),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Password", hintText: "* * * * * *", obscureText: true, controller: txtPassword),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
              child: RoundTitleTextfield(title: "Confirm Password", hintText: "* * * * * *", obscureText: true, controller: txtConfirmPassword),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: isLoading
                ? const CircularProgressIndicator()
                : RoundButton(title: "Save", onPressed: _updateProfile),
            ),
            const SizedBox(height: 20),
          ]),
        ),
      ),
    );
  }
}