import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../common/globs.dart';
import '../common/service_call.dart';

Future<void> showReportDialog(BuildContext context, String orderId, String deliveryPersonId) async {
  final reasonController = TextEditingController();
  final descriptionController = TextEditingController();

  return showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Report Delivery Person'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: reasonController, decoration: const InputDecoration(labelText: 'Reason')),
          const SizedBox(height: 8),
          TextField(controller: descriptionController, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        TextButton(
          onPressed: () async {
            final token = ServiceCall.userPayload['auth_token'];
            final url = Uri.parse('${SVKey.mainUrl}/api/reports');
            final res = await http.post(url,
                headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
                body: jsonEncode({
                  'orderId': orderId,
                  'deliveryPersonId': deliveryPersonId,
                  'reason': reasonController.text,
                  'description': descriptionController.text,
                }));
            if (res.statusCode == 200) {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted')));
            } else {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit report')));
            }
          },
          child: const Text('Submit'),
        ),
      ],
    ),
  );
}