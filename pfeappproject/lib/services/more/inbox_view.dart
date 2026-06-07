import 'package:flutter/material.dart';
import '../../common/color_extension.dart';
import '../../common/service_call.dart';
import '../../services/chat/chat_service.dart';
import '../../services/chat/chat_conversation_view.dart';
import '../../services/report_service.dart';
import '../../client/report_status_view.dart';

class InboxView extends StatefulWidget {
  const InboxView({super.key});

  @override
  State<InboxView> createState() => _InboxViewState();
}

class _InboxViewState extends State<InboxView> {
  List<dynamic> items = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadInbox();
  }

  Future<void> _loadInbox() async {
    setState(() => loading = true);
    try {
      final chats = await ChatService.getMyChats();
      final reports = await ReportService.getMyReports();
      final List<dynamic> combined = [];
      combined.addAll(chats.map((c) => {'type': 'chat', 'data': c}));
      combined.addAll(reports.map((r) => {'type': 'report', 'data': r}));
      combined.sort((a, b) {
        final aTime = a['data']['updatedAt'] ?? a['data']['createdAt'];
        final bTime = b['data']['updatedAt'] ?? b['data']['createdAt'];
        return bTime.compareTo(aTime);
      });
      setState(() {
        items = combined;
        loading = false;
        error = null;
      });
    } catch (e) {
      setState(() {
        loading = false;
        error = e.toString();
      });
    }
  }

  String getOtherParticipantName(List participants) {
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
          : error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Error: $error"),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _loadInbox,
                        child: const Text("Retry"),
                      ),
                    ],
                  ),
                )
              : items.isEmpty
                  ? const Center(child: Text("No messages or reports"))
                  : ListView.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, __) => Divider(color: TColor.secondaryText.withValues(alpha: 0.2)),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        if (item['type'] == 'chat') {
                          final chat = item['data'];
                          final otherId = getOtherParticipantName(chat['participants']);
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: TColor.textfield,
                              child: Icon(Icons.chat, color: TColor.primary),
                            ),
                            title: Text("Chat with User ${otherId.substring(0, 6)}"),
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
                        } else {
                          final report = item['data'];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: report['status'] == 'accepted' ? Colors.green : Colors.orange,
                              child: Icon(Icons.report, color: Colors.white),
                            ),
                            title: Text("Report: ${report['reason']}"),
                            subtitle: Text("Status: ${report['status']}"),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ReportStatusView(reportId: report['_id']),
                                ),
                              );
                            },
                          );
                        }
                      },
                    ),
    );
  }
}