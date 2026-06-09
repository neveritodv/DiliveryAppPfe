import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/globs.dart';
import '../common/service_call.dart';

class ChatService {
  static Future<Map<String, dynamic>> getOrCreateChat(String otherUserId) async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/chat/get-or-create');
    final res = await http.post(url,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'otherUserId': otherUserId}));
    return jsonDecode(res.body);
  }

  static Future<List<dynamic>> getMyChats() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/chat/my-chats');
    final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
    final data = jsonDecode(res.body);
    if (data['status'] == '1') return data['payload'];
    return [];
  }

  static Future<List<dynamic>> getMessages(String chatId) async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/chat/messages/$chatId');
    final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
    final data = jsonDecode(res.body);
    if (data['status'] == '1') return data['payload'];
    return [];
  }

  // ✅ NEW method – returns the server’s saved message
  static Future<Map<String, dynamic>?> sendMessageAndGetMessage(
      String chatId, String text) async {
    try {
      final token = ServiceCall.userPayload['auth_token'];
      final url = Uri.parse('${SVKey.mainUrl}/api/chat/message');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'chatId': chatId, 'text': text}),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == '1') return data['payload'];
      }
    } catch (_) {}
    return null;
  }

  // Old method kept for backward compatibility
  static Future<bool> sendMessage(String chatId, String text) async {
    final msg = await sendMessageAndGetMessage(chatId, text);
    return msg != null;
  }

  static Future<void> markRead(String chatId) async {
    final token = ServiceCall.userPayload['auth_token'];
    await http.patch(Uri.parse('${SVKey.mainUrl}/api/chat/read/$chatId'),
        headers: {'Authorization': 'Bearer $token'});
  }
}