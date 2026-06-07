import 'package:flutter/material.dart';
import '../../common/color_extension.dart';
import '../../common/service_call.dart';
import '../../services/websocket_service.dart';
import '../../services/chat/chat_service.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../common/globs.dart';

class ChatConversationView extends StatefulWidget {
  final String chatId;
  final String otherUserId;
  const ChatConversationView({super.key, required this.chatId, required this.otherUserId});

  @override
  State<ChatConversationView> createState() => _ChatConversationViewState();
}

class _ChatConversationViewState extends State<ChatConversationView> {
  List messages = [];
  final TextEditingController _controller = TextEditingController();
  bool loading = true;
  Map<String, dynamic> otherUser = {};
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _loadMessages();
    WebSocketService.onNewMessage = (msg) {
      if (msg['chatId'] == widget.chatId) {
        setState(() {
          messages.add(msg); // add to end (chronological order)
        });
        _scrollToBottom();
      }
    };
    WebSocketService.joinChat(widget.chatId);
    ChatService.markRead(widget.chatId);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _loadUserInfo() async {
    final token = ServiceCall.userPayload['auth_token'];
    final url = Uri.parse('${SVKey.mainUrl}/api/admin/users/${widget.otherUserId}');
    final res = await http.get(url, headers: {'Authorization': 'Bearer $token'});
    final data = json.decode(res.body);
    if (data['status'] == '1') {
      setState(() => otherUser = data['payload']);
    }
  }

  Future<void> _loadMessages() async {
    final msgs = await ChatService.getMessages(widget.chatId);
    setState(() {
      messages = msgs; // already chronological (oldest first)
      loading = false;
    });
    _scrollToBottom();
  }

  void sendMessage() async {
    if (_controller.text.trim().isEmpty) return;
    final text = _controller.text;
    _controller.clear();

    // Optimistic add
    final tempMsg = {
      'chatId': widget.chatId,
      'senderId': ServiceCall.userPayload['userId'],
      'text': text,
      'createdAt': DateTime.now().toIso8601String(),
      'read': false,
    };
    setState(() => messages.add(tempMsg));
    _scrollToBottom();

    final success = await ChatService.sendMessage(widget.chatId, text);
    if (!success) {
      setState(() => messages.removeWhere((m) => m == tempMsg));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to send message")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ServiceCall.userPayload['userId'];
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              backgroundImage: otherUser['avatar'] != null
                  ? NetworkImage('${SVKey.mainUrl}${otherUser['avatar']}')
                  : null,
              child: otherUser['avatar'] == null ? Icon(Icons.person, color: TColor.white) : null,
            ),
            const SizedBox(width: 10),
            Text(otherUser['name'] ?? 'User'),
          ],
        ),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    reverse: true, // so newest at bottom
                    itemCount: messages.length,
                    itemBuilder: (_, i) {
                      final msg = messages[messages.length - 1 - i]; // iterate from newest to oldest for display order
                      final isMe = msg['senderId'] == currentUserId;
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        child: Row(
                          mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                          children: [
                            Container(
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.7,
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: isMe ? TColor.primary : TColor.textfield,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  if (!isMe)
                                    Text(
                                      otherUser['name'] ?? 'User',
                                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                                    ),
                                  Text(
                                    msg['text'],
                                    style: TextStyle(
                                      color: isMe ? Colors.white : TColor.primaryText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: sendMessage,
                        icon: Icon(Icons.send, color: TColor.primary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}