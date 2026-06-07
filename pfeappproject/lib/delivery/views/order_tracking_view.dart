import 'package:flutter/material.dart';
import '../../common/color_extension.dart';

class OrderTrackingView extends StatefulWidget {
  final String orderId;
  final String initialStatus;
  const OrderTrackingView({super.key, required this.orderId, this.initialStatus = 'pending'});

  @override
  State<OrderTrackingView> createState() => _OrderTrackingViewState();
}

class _OrderTrackingViewState extends State<OrderTrackingView> {
  String currentStatus = '';
  int currentStep = 0;

  final List<Map<String, dynamic>> statuses = [
    {'status': 'pending', 'label': 'Order Placed', 'icon': Icons.receipt_long},
    {'status': 'confirmed', 'label': 'Confirmed', 'icon': Icons.check_circle_outline},
    {'status': 'preparing', 'label': 'Preparing', 'icon': Icons.restaurant},
    {'status': 'picked_up', 'label': 'Picked Up', 'icon': Icons.shopping_bag},
    {'status': 'on_the_way', 'label': 'On the Way', 'icon': Icons.delivery_dining},
    {'status': 'delivered', 'label': 'Delivered', 'icon': Icons.home},
  ];

  @override
  void initState() {
    super.initState();
    currentStatus = widget.initialStatus;
    _updateStep();
  }

  void _updateStep() {
    final index = statuses.indexWhere((s) => s['status'] == currentStatus);
    setState(() {
      currentStep = index >= 0 ? index + 1 : 1;
    });
  }

  Color _getStepColor(int stepIndex) {
    if (stepIndex <= currentStep) {
      if (stepIndex == currentStep && currentStatus == 'cancelled') {
        return Colors.red;
      }
      return TColor.primary;
    }
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Order #${widget.orderId.substring(0, 8)}"),
        backgroundColor: TColor.primary,
        foregroundColor: TColor.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Order Status Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: TColor.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Column(
                children: [
                  Icon(
                    currentStatus == 'cancelled' ? Icons.cancel : Icons.check_circle,
                    size: 60,
                    color: currentStatus == 'cancelled' ? Colors.red : TColor.primary,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    currentStatus == 'cancelled' ? 'Order Cancelled' : 'Order ${currentStatus.replaceAll('_', ' ').toUpperCase()}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: currentStatus == 'cancelled' ? Colors.red : TColor.primaryText,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    currentStatus == 'delivered' 
                      ? 'Your order has been delivered!'
                      : currentStatus == 'cancelled'
                        ? 'This order has been cancelled'
                        : 'Estimated delivery: 30-45 min',
                    style: TextStyle(color: TColor.secondaryText, fontSize: 14),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 30),
            
            // Stepper Timeline
            ...List.generate(statuses.length, (index) {
              final stepNum = index + 1;
              final isCompleted = stepNum <= currentStep && currentStatus != 'cancelled';
              final isCurrent = stepNum == currentStep;
              final isLast = index == statuses.length - 1;

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Step indicator
                  Column(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _getStepColor(stepNum),
                        ),
                        child: Icon(
                          isCompleted ? Icons.check : statuses[index]['icon'],
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 3,
                          height: 50,
                          color: stepNum < currentStep ? TColor.primary : Colors.grey[300],
                        ),
                    ],
                  ),
                  const SizedBox(width: 15),
                  // Step label
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          statuses[index]['label'],
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                            color: isCompleted || isCurrent ? TColor.primaryText : Colors.grey,
                          ),
                        ),
                        if (isCurrent && currentStatus != 'delivered' && currentStatus != 'cancelled')
                          const SizedBox(height: 4),
                        if (isCurrent && currentStatus != 'delivered' && currentStatus != 'cancelled')
                          Text(
                            'In progress...',
                            style: TextStyle(fontSize: 12, color: TColor.secondaryText),
                          ),
                      ],
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}