import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import '../../common_widget/round_button.dart';
import '../../common_widget/round_textfield.dart';

class DeliveryProfileView extends StatefulWidget {
  const DeliveryProfileView({super.key});

  @override
  State<DeliveryProfileView> createState() => _DeliveryProfileViewState();
}

class _DeliveryProfileViewState extends State<DeliveryProfileView> {
  final ImagePicker picker = ImagePicker();
  XFile? image;
  int _avatarVersion = 0;
  String _lastAvatarUrl = '';

  TextEditingController txtName = TextEditingController();
  TextEditingController txtEmail = TextEditingController();
  TextEditingController txtMobile = TextEditingController();
  TextEditingController txtAddress = TextEditingController();
  TextEditingController txtPassword = TextEditingController();
  TextEditingController txtConfirmPassword = TextEditingController();

  bool isAvailable = true;
  bool isLoading = false;
  Map userData = {};

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final payload = Globs.udValue(Globs.userPayload);
    if (mounted) {
      setState(() {
        userData = payload ?? {};
        txtName.text = payload?['name'] ?? '';
        txtEmail.text = payload?['email'] ?? '';
        txtMobile.text = payload?['mobile'] ?? '';
        txtAddress.text = payload?['address'] ?? '';
        isAvailable = payload?['isAvailable'] ?? true;
        _lastAvatarUrl = payload?['avatar'] ?? '';
      });
    }
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
      'isAvailable': isAvailable,
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
              const SnackBar(content: Text("Profile updated")),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Update failed: ${data['message']}")),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
      }
    }
  }

  Future<void> _uploadAvatar() async {
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile == null) return;

    setState(() => image = pickedFile);

    final token = ServiceCall.userPayload['auth_token'];
    if (token == null || token.toString().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Please login again")),
        );
      }
      return;
    }

    try {
      final bytes = await pickedFile.readAsBytes();
      final fileName = pickedFile.name;
      final base64Image = base64Encode(bytes);

      final url = Uri.parse('${SVKey.mainUrl}/api/auth/upload-avatar');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'avatar': base64Image,
          'fileName': fileName,
        }),
      );

      if (response.statusCode == 200) {
        final respData = jsonDecode(response.body);
        if (respData['status'] == '1') {
          final avatarPath = respData['avatarUrl'] ?? '';

          final updatedPayload = Map<String, dynamic>.from(userData);
          updatedPayload['avatar'] = avatarPath;

          // Save to storage
          Globs.udSet(updatedPayload, Globs.userPayload);
          ServiceCall.userPayload = updatedPayload;

          // Clear cache
          imageCache.clear();
          imageCache.clearLiveImages();

          // Increment version to force refresh
          _avatarVersion++;
          _lastAvatarUrl = avatarPath;

          _loadUserData();
          setState(() => image = null);

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Avatar updated successfully!"),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Upload failed: ${respData['message']}")),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => image = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
      }
    }
  }

  Widget _buildAvatar() {
    // If user picked a new image locally
    if (image != null) {
      if (kIsWeb) {
        return Image.network(
          image!.path,
          width: 110,
          height: 110,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return const Icon(Icons.person, size: 60, color: Colors.grey);
          },
        );
      } else {
        return Image.file(
          File(image!.path),
          width: 110,
          height: 110,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return const Icon(Icons.person, size: 60, color: Colors.grey);
          },
        );
      }
    }

    // If user has an avatar URL from server
    final avatarUrl = userData['avatar']?.toString();
    if (avatarUrl != null && avatarUrl.isNotEmpty) {
      String fullUrl = avatarUrl;
      if (!avatarUrl.startsWith('http')) {
        fullUrl = '${SVKey.mainUrl}$avatarUrl';
      }
      // ✅ Add version to break cache
      fullUrl = '$fullUrl?v=$_avatarVersion';

      return Image.network(
        fullUrl,
        key: ValueKey(fullUrl), // ✅ Unique key
        width: 110,
        height: 110,
        fit: BoxFit.cover,
        cacheWidth: 110,
        cacheHeight: 110,
        errorBuilder: (context, error, stackTrace) {
          return const Icon(Icons.person, size: 60, color: Colors.grey);
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return const Center(
            child: CircularProgressIndicator(strokeWidth: 2),
          );
        },
      );
    }

    // Default avatar
    return const Icon(Icons.person, size: 60, color: Colors.grey);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TColor.white,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 46),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Delivery Profile",
                      style: TextStyle(
                        color: TColor.primaryText,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.person, color: TColor.primaryText),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Avatar
              GestureDetector(
                onTap: _uploadAvatar,
                child: Stack(
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: TColor.textfield,
                        borderRadius: BorderRadius.circular(55),
                        border: Border.all(
                          color: TColor.primary.withValues(alpha: 0.3),
                          width: 3,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(55),
                        child: _buildAvatar(),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: CircleAvatar(
                        radius: 20,
                        backgroundColor: TColor.primary,
                        child: const Icon(Icons.camera_alt, size: 20, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _uploadAvatar,
                child: Text("Change Photo", style: TextStyle(color: TColor.primary, fontSize: 13)),
              ),
              const SizedBox(height: 10),
              Text(
                userData['name'] ?? "Delivery Person",
                style: TextStyle(
                  color: TColor.primaryText,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                userData['email'] ?? "",
                style: TextStyle(color: TColor.secondaryText, fontSize: 14),
              ),
              const SizedBox(height: 20),

              // Name
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: RoundTitleTextfield(
                  title: "Name",
                  hintText: "Enter Name",
                  controller: txtName,
                ),
              ),

              // Email
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: Container(
                  width: double.infinity,
                  height: 55,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: TColor.textfield,
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Email", style: TextStyle(color: TColor.placeholder, fontSize: 11)),
                      Text(txtEmail.text, style: TextStyle(color: TColor.primaryText, fontSize: 14)),
                    ],
                  ),
                ),
              ),

              // Mobile
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: RoundTitleTextfield(
                  title: "Mobile No",
                  hintText: "Enter Mobile No",
                  controller: txtMobile,
                  keyboardType: TextInputType.phone,
                ),
              ),

              // Address
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: RoundTitleTextfield(
                  title: "Address",
                  hintText: "Enter Address",
                  controller: txtAddress,
                ),
              ),

              // Password
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: RoundTitleTextfield(
                  title: "New Password",
                  hintText: "Leave blank to keep same",
                  obscureText: true,
                  controller: txtPassword,
                ),
              ),

              // Confirm Password
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 20),
                child: RoundTitleTextfield(
                  title: "Confirm Password",
                  hintText: "Confirm Password",
                  obscureText: true,
                  controller: txtConfirmPassword,
                ),
              ),

              // Availability
              SwitchListTile(
                title: const Text("Available for deliveries"),
                value: isAvailable,
                onChanged: (val) => setState(() => isAvailable = val),
                activeTrackColor: TColor.primary,
              ),

              const SizedBox(height: 20),

              // Save
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : RoundButton(title: "Save Changes", onPressed: _updateProfile),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}