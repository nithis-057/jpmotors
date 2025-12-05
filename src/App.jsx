import React, { useState, useEffect } from 'react'; 
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Search, 
  LogOut, 
  Plus, 
  Trash2, 
  TrendingDown, 
  Truck,
  FileText,
  UserPlus,
  Minus,
  Clock,
  Printer,
  Box
} from 'lucide-react';

// Import database functions
import { 
  fetchProducts, 
  fetchUsers, 
  fetchAllOrders, 
  insertNewOrder, 
  updateOrderStatus as updateDbOrderStatus,
  insertUser
} from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('login'); 
  
  // Initialize with empty arrays (waiting for DB)
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [cart, setCart] = useState([]);
  const [loginError, setLoginError] = useState('');

  // --- CONNECT TO DATABASE ---
  useEffect(() => {
    async function loadData() {
      const productData = await fetchProducts();
      setProducts(productData);

      const userData = await fetchUsers();
      setUsers(userData);

      const orderData = await fetchAllOrders();
      setOrders(orderData);
    }
    loadData();
  }, []);
  

  // --- LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    // Checks against the users fetched from DB
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      setLoginError('');
      setView(foundUser.role === 'admin' ? 'admin' : 'catalog');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setView('login');
  };

  const calculatePrice = (basePrice) => {
    if (!user || user.role === 'admin') return basePrice;
    const discountMultiplier = (100 - user.discount) / 100;
    return Math.floor(basePrice * discountMultiplier);
  };

  const addToCart = (product, qty) => {
    const finalPrice = calculatePrice(product.price);
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item));
    } else {
      setCart([...cart, { ...product, qty, finalPrice }]);
    }
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Note: This only updates local state for now. 
  // Real implementation would need an insertUser function in supabaseClient.js
  const addUser = (newUser) => {
    setUsers([...users, { ...newUser, id: `u${users.length + 1}` }]);
  };

  const placeOrder = async (grandTotal) => {
    // 1. Prepare data for DB
    const orderData = { userId: user.id, total: grandTotal };
    const orderItems = cart.map(i => ({
      product_id: i.id,
      quantity: i.qty,
      price_at_order: i.finalPrice
    }));

    // 2. Send to DB
    const success = await insertNewOrder(orderData, orderItems);

    if (success) {
      alert('Order Placed Successfully!');
      setCart([]);
      
      // 3. Refresh Orders from DB
      const updatedOrders = await fetchAllOrders();
      setOrders(updatedOrders);
      
      setView('orders');
    } else {
      alert('Failed to place order. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // 1. Update in DB
    const success = await updateDbOrderStatus(orderId, newStatus);
    
    if (success) {
      // 2. Refresh local state
      const updatedOrders = await fetchAllOrders();
      setOrders(updatedOrders);
    } else {
      alert('Failed to update status.');
    }
  };

  // --- VIEWS ---

  const LoginView = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        <div className="bg-yellow-500 p-10 flex flex-col justify-center md:w-1/2">
          <div className="mb-6">
            <Truck size={64} className="text-slate-900 mb-4" />
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">JP Motors</h1>
            <p className="text-slate-900 font-bold mt-2 opacity-80">Three-Wheeler Spares Wholesale</p>
          </div>
          <p className="text-slate-800 text-sm leading-relaxed">
            Exclusive B2B portal. Authorized retailers only.
          </p>
        </div>
        <div className="p-10 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Retailer Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="username" type="text" className="w-full p-3 border rounded" placeholder="Username" />
            <input name="password" type="password" className="w-full p-3 border rounded" placeholder="Password" />
            {loginError && <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded">{loginError}</p>}
            <button className="w-full py-3 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition">Access Portal</button>
          </form>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 bg-slate-800 text-slate-300 p-4 rounded shadow text-xs">
        <p className="font-bold text-white mb-1">System Status:</p>
        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400"></span> Database Connected</p>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-slate-900 text-white sticky top-0 z-10 shadow-lg print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div onClick={() => setView('catalog')} className="flex items-center gap-2 cursor-pointer">
          <Truck className="text-yellow-500" />
          <span className="font-black text-xl tracking-tight uppercase">JP Motors</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-yellow-400">{user.name}</p>
            <p className="text-xs text-slate-400">Tier: <span className="text-white">{user.discount}% OFF</span></p>
          </div>
          <button onClick={() => setView('orders')} title="Order History" className="p-2 hover:bg-slate-800 rounded">
            <Clock />
          </button>
          <button onClick={() => setView('cart')} className="relative p-2 hover:bg-slate-800 rounded">
            <ShoppingCart />
            {cart.length > 0 && <span className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
          </button>
          <button onClick={handleLogout}><LogOut size={20} className="text-slate-400 hover:text-white" /></button>
        </div>
      </div>
    </header>
  );

  const CatalogView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="bg-slate-50 min-h-screen pb-20">
        <Header />
        <div className="bg-slate-800 px-4 py-3 print:hidden">
          <div className="max-w-7xl mx-auto relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
            <input 
              className="w-full bg-slate-900 text-white border border-slate-700 rounded pl-10 pr-4 py-2 focus:border-yellow-500 outline-none"
              placeholder="Search Part Name or part_number..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {products.length === 0 ? (
             <div className="text-center py-20 opacity-50"><p>Loading Products...</p></div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => {
              const myPrice = calculatePrice(product.price);
              const savings = product.price - myPrice;
              return (
                <div key={product.id} className="bg-white p-4 rounded border border-slate-200 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{product.part_number}</span>
                    <span className="text-xs text-slate-400">{product.category}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4">{product.name}</h3>
                  <div className="bg-slate-50 p-3 rounded mb-4">
                    <div className="flex justify-between items-end">
                      <div className="text-slate-400 text-sm line-through decoration-red-400 decoration-2">MRP: ₹{product.price}</div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">₹{myPrice}</div>
                        {savings > 0 && (
                          <div className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end">
                            <TrendingDown size={12} />
                            Your Price
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => addToCart(product, 1)} className="w-full bg-yellow-500 text-slate-900 font-bold py-2 rounded hover:bg-yellow-400 transition flex justify-center items-center gap-2">
                    <Plus size={16} /> Add to Order
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    );
  };

  const CartView = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.finalPrice * item.qty), 0);
    const packingCharge = Math.ceil(subtotal * 0.02);
    const taxableValue = subtotal + packingCharge;
    const gstAmount = Math.ceil(taxableValue * 0.18);
    const grandTotal = taxableValue + gstAmount;

    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-bold mb-6">Current Order Draft</h2>
          {cart.length === 0 ? (
            <div className="text-center py-20 opacity-50"><ShoppingCart size={48} className="mx-auto mb-4" /><p>Cart is empty.</p></div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-sm text-slate-500">part_number: {item.part_number}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">₹{item.finalPrice} / unit</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded border border-slate-200">
                      <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="p-2 hover:bg-slate-200"><Minus size={16} /></button>
                      <span className="w-10 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="p-2 hover:bg-slate-200"><Plus size={16} /></button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold">₹{item.finalPrice * item.qty}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs mt-1 flex items-center gap-1 justify-end hover:text-red-700"><Trash2 size={12} /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-white rounded shadow-lg overflow-hidden mt-8">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} /> Invoice Summary</h3></div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-slate-800"><span>Subtotal (Net)</span><span className="font-bold">₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600 text-sm"><span>Packing & Fwd (2%)</span><span>₹{packingCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600 text-sm border-b pb-4"><span>IGST (18%)</span><span>₹{gstAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-2xl font-black text-slate-900 pt-2"><span>Grand Total</span><span>₹{grandTotal.toLocaleString()}</span></div>
                  <button onClick={() => placeOrder(grandTotal)} className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded hover:bg-slate-800 text-lg shadow-xl transition">Confirm Purchase Order</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrdersView = () => {
    // Filter orders for the current user (Admin sees all, normal user sees theirs)
    const myOrders = user.role === 'admin' ? orders : orders.filter(o => o.userId === user.id);

    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-bold mb-6">Order History</h2>
          {orders.length === 0 ? <p className="opacity-50 text-center">No orders found.</p> : (
          <div className="space-y-4">
            {myOrders.map(order => (
              <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">Order #{order.id}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                        order.status === 'Packed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{order.date}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <p className="text-xs text-slate-400 uppercase">Total Amount</p>
                    <p className="text-xl font-black text-slate-900">₹{order.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-600">
                      <span>{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                      <span className="font-mono">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                   <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm font-bold transition">
                     <Printer size={16} /> Print Order
                   </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    );
  };

  const AdminView = () => {
    const [activeTab, setActiveTab] = useState('orders'); 
    const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', discount: 10 });

    const handleCreateUser = async (e) => { // Mark function as async
      e.preventDefault();
      
      const userPayload = { 
        ...newUserForm, 
        role: 'retailer' 
        // We don't add 'id' here; let Supabase generate the ID automatically
      };

      // 1. Send to Supabase
      const createdUser = await insertUser(userPayload);

      if (createdUser) {
        // 2. If successful, update local state using the data Supabase returned
        setUsers([...users, createdUser]);
        
        // 3. Clear the form
        setNewUserForm({ name: '', username: '', password: '', discount: 10 });
        alert("User Created and Saved to Database!");
      } else {
        alert("Failed to create user. Check the console for errors.");
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex">
        <aside className="w-64 bg-slate-800 text-white flex flex-col">
          <div className="p-6 font-black text-xl text-yellow-500 tracking-tight">JP ADMIN</div>
          <nav className="flex-1 px-2 space-y-1">
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 ${activeTab === 'orders' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}><FileText size={18} /> Orders</button>
            <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 ${activeTab === 'inventory' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}><Package size={18} /> Inventory</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 ${activeTab === 'users' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}><Users size={18} /> Retailers</button>
          </nav>
          <div className="p-4"><button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-white"><LogOut size={18} /> Logout</button></div>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 capitalize">{activeTab} Management</h1>

          {activeTab === 'inventory' && (
            <div className="bg-white rounded shadow overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b">
                   <tr>
                     <th className="p-4 text-sm font-bold text-slate-500">Part Name</th>
                     <th className="p-4 text-sm font-bold text-slate-500">part_number</th>
                     <th className="p-4 text-sm font-bold text-slate-500">Price</th>
                     <th className="p-4 text-sm font-bold text-slate-500">Stock</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">{products.map(p => <tr key={p.id}><td className="p-4">{p.name}</td><td className="p-4 font-mono text-sm text-slate-500">{p.part_number}</td><td className="p-4">₹{p.price}</td><td className="p-4">{p.stock}</td></tr>)}</tbody>
               </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {users.filter(u => u.role !== 'admin').map(u => (
                  <div key={u.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                    <div><h4 className="font-bold">{u.name}</h4><p className="text-sm text-slate-500">User: {u.username}</p></div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-bold">{u.discount}% Discount</div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded shadow h-fit">
                <h3 className="font-bold mb-4 flex items-center gap-2"><UserPlus size={18} /> Add Retailer</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <input placeholder="Shop Name" className="w-full p-2 border rounded" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Username" className="w-full p-2 border rounded" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} required />
                    <input placeholder="Password" className="w-full p-2 border rounded" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} required />
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">Discount Tier (%)</label><input type="number" className="w-full p-2 border rounded" value={newUserForm.discount} onChange={e => setNewUserForm({...newUserForm, discount: parseInt(e.target.value)})} /></div>
                  <button className="w-full bg-slate-900 text-white font-bold py-2 rounded hover:bg-slate-700">Create Credentials</button>
                </form>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">Pending Orders</p>
                   <p className="text-2xl font-black text-slate-800">{orders.filter(o => o.status === 'Pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">To Be Shipped</p>
                   <p className="text-2xl font-black text-slate-800">{orders.filter(o => o.status === 'Packed').length}</p>
                </div>
                <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">Completed Revenue</p>
                   <p className="text-2xl font-black text-slate-800">
                     ₹{(orders.filter(o => o.status === 'Delivered').reduce((acc, curr) => acc + curr.total, 0)/1000).toFixed(1)}k
                   </p>
                </div>
              </div>

              {orders.map(order => {
                return (
                  <div key={order.id} className="bg-white p-6 rounded shadow border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg">#{order.id}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                            order.status === 'Packed' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Customer: {order.customerName} ({order.userId})</p>
                        <p className="text-xs text-slate-400">Date: {order.date}</p>
                      </div>
                      <div className="text-right mt-2 md:mt-0">
                         <p className="font-black text-xl">₹{order.total.toLocaleString()}</p>
                         <p className="text-xs text-slate-400">Items: {order.items.length}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded mb-4 text-sm space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                          <span>{item.name} x {item.qty}</span>
                          <span className="font-mono text-slate-500">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'Pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'Packed')}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Box size={16} /> Mark as Packed
                        </button>
                      )}
                      
                      {order.status === 'Packed' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'Delivered')}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 flex items-center gap-2"
                        >
                          <Truck size={16} /> Mark Dispatched
                        </button>
                      )}

                      <button className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded hover:bg-slate-200 border border-slate-300">
                        View Invoice PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  };

  if (view === 'login') return <LoginView />;
  if (view === 'admin') return <AdminView />;
  if (view === 'cart') return <CartView />;
  if (view === 'orders') return <OrdersView />;
  return <CatalogView />;
}