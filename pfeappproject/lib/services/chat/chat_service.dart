import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../common/globs.dart';        // ✅ fixed path
import '../../common/service_call.dart'; // ✅ fixed path

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

  static Future<bool> sendMessage(String chatId, String text) async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/chat/message');
    final res = await http.post(url,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'chatId': chatId, 'text': text}));
    final data = jsonDecode(res.body);
    return data['status'] == '1';
  }

  static Future<void> markRead(String chatId) async {
    final token = ServiceCall.userPayload['auth_token'];
    await http.patch(Uri.parse('${SVKey.mainUrl}/api/chat/read/$chatId'),
        headers: {'Authorization': 'Bearer $token'});
  }
} 