import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/globs.dart';
import '../common/service_call.dart';
import '../services/chat/chat_service.dart';
import '../services/chat/chat_conversation_view.dart';

class ReportStatusView extends StatefulWidget {
  final String reportId;
  const ReportStatusView({super.key, required this.reportId});

  @override
  State<ReportStatusView> createState() => _ReportStatusViewState();
}

class _ReportStatusViewState extends State<ReportStatusView> {
  Map report = {};
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/reports/client/${widget.reportId}');
    final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
    final data = json.decode(res.body);
    if (data['status'] == '1') {
      setState(() {
        report = data['payload'];
        loading = false;
      });
    }
  }

  Future<void> _chatWithAdmin() async {
    // You need the admin's user ID. For demonstration, fetch the admin user from the backend.
    // Or store admin ID globally (e.g., from login). For simplicity, we assume admin ID is known.
    // Here we fetch the first admin user (you can improve).
    final token = ServiceCall.userPayload['auth_token'];
    final adminRes = await http.get(Uri.parse('${SVKey.mainUrl}/api/admin/users'),
        headers: {'Authorization': 'Bearer $token'});
    final adminData = json.decode(adminRes.body);
    if (adminData['status'] == '1') {
      final admin = adminData['payload'].firstWhere((u) => u['role'] == 'admin', orElse: () => null);
      if (admin != null) {
        final chatRes = await ChatService.getOrCreateChat(admin['_id']);
        final chatId = chatRes['payload']['_id'];
        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ChatConversationView(
                chatId: chatId,
                otherUserId: admin['_id'],
              ),
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Admin not found")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Report Details')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Reason: ${report['reason']}', style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            Text('Description: ${report['description']}', style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 8),
            Text('Status: ${report['status']}', style: TextStyle(color: report['status'] == 'accepted' ? Colors.green : Colors.orange)),
            if (report['status'] == 'accepted')
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: ElevatedButton(
                  onPressed: _chatWithAdmin,
                  child: const Text('Chat with Admin'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}