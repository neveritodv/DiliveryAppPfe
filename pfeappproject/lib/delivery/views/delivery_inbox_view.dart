import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../common/color_extension.dart';
import '../../common/globs.dart';
import '../../common/service_call.dart';
import '../../services/chat/chat_service.dart';
import '../../services/chat/chat_conversation_view.dart';

class DeliveryInboxView extends StatefulWidget {
  const DeliveryInboxView({super.key});

  @override
  State<DeliveryInboxView> createState() => _DeliveryInboxViewState();
}

class _DeliveryInboxViewState extends State<DeliveryInboxView> {
  List chats = [];
  bool loading = true;
  Map<String, Map<String, dynamic>> userCache = {};

  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  Future<void> _loadChats() async {
    final chatList = await ChatService.getMyChats();
    setState(() {
      chats = chatList;
      loading = false;
    });
  }

  Future<Map<String, dynamic>> getUserInfo(String userId) async {
    if (userCache.containsKey(userId)) return userCache[userId]!;
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/admin/users/$userId');
    final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
    final data = json.decode(res.body);
    if (data['status'] == '1') {
      userCache[userId] = data['payload'];
      return data['payload'];
    }
    return {};
  }

  String getOtherParticipantId(List participants) {
    final currentUserId = ServiceCall.userPayload['userId'];
    return participants.firstWhere((id) => id != currentUserId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Inbox"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : chats.isEmpty
              ? const Center(child: Text("No conversations yet"))
              : ListView.separated(
                  itemCount: chats.length,
                  separatorBuilder: (_, __) => Divider(color: TColor.secondaryText.withValues(alpha: 0.2)),
                  itemBuilder: (context, index) {
                    final chat = chats[index];
                    final otherId = getOtherParticipantId(chat['participants']);
                    return FutureBuilder<Map<String, dynamic>>(
                      future: getUserInfo(otherId),
                      builder: (_, snap) {
                        final name = snap.data?['name'] ?? otherId.substring(0, 6);
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: TColor.textfield,
                            child: Icon(Icons.chat, color: TColor.primary),
                          ),
                          title: Text("Chat with $name"),
                          subtitle: Text(chat['updatedAt'] != null ? "Last message" : "No messages yet"),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ChatConversationView(
                                  chatId: chat['_id'],
                                  otherUserId: otherId,
                                ),
                              ),
                            );
                          },
                        );
                      },
                    );
                  },
                ),
    );
  }
}