class CartItem {
  final String id;
  final String name;
  final double price;
  int quantity;
  final String image;

  CartItem({required this.id, required this.name, required this.price, required this.quantity, required this.image});

  Map<String, dynamic> toMap() => {'id': id, 'name': name, 'price': price, 'quantity': quantity, 'image': image};

  factory CartItem.fromMap(Map<String, dynamic> map) {
    return CartItem(
      id: map['id'],
      name: map['name'],
      price: map['price'] is int ? (map['price'] as int).toDouble() : map['price'],
      quantity: map['quantity'],
      image: map['image'],
    );
  }
}

class Cart {
  static final List<CartItem> _items = [];

  static List<CartItem> get items => List.unmodifiable(_items);
  static int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);
  static double get totalPrice => _items.fold(0, (sum, item) => sum + (item.price * item.quantity));

  static void addItem(CartItem item) {
    final existingIndex = _items.indexWhere((i) => i.id == item.id);
    if (existingIndex != -1) {
      _items[existingIndex].quantity += item.quantity;
    } else {
      _items.add(item);
    }
  }

  static void removeItem(String id) {
    _items.removeWhere((i) => i.id == id);
  }

  static void updateQuantity(String id, int newQuantity) {
    final index = _items.indexWhere((i) => i.id == id);
    if (index != -1) {
      if (newQuantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = newQuantity;
      }
    }
  }

  static void clear() {
    _items.clear();
  }
}