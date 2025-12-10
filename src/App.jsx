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
  Box,
  Home 
} from 'lucide-react';

// Import database functions
import { 
  fetchProducts, 
  fetchUsers, 
  fetchAllOrders, 
  insertNewOrder, 
  updateOrderStatus as updateDbOrderStatus,
  insertUser,
  deleteUser 
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

  // --- 1. SESSION PERSISTENCE FIX ---
  useEffect(() => {
    const savedUser = localStorage.getItem('jp_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setView(parsedUser.role === 'admin' ? 'admin' : 'catalog');
      } catch (e) {
        localStorage.removeItem('jp_user');
      }
    }
  }, []);

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
    
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      setLoginError('');
      localStorage.setItem('jp_user', JSON.stringify(foundUser)); 
      setView(foundUser.role === 'admin' ? 'admin' : 'catalog');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jp_user'); 
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

  const placeOrder = async (grandTotal) => {
    const orderData = { userId: user.id, total: grandTotal };
    const orderItems = cart.map(i => ({
      product_id: i.id,
      quantity: i.qty,
      price_at_order: i.finalPrice
    }));

    const success = await insertNewOrder(orderData, orderItems);

    if (success) {
      alert('Order Placed Successfully!');
      setCart([]);
      const updatedOrders = await fetchAllOrders();
      setOrders(updatedOrders);
      setView('orders');
    } else {
      alert('Failed to place order. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const success = await updateDbOrderStatus(orderId, newStatus);
    if (success) {
      const updatedOrders = await fetchAllOrders();
      setOrders(updatedOrders);
    } else {
      alert('Failed to update status.');
    }
  };

  // --- HELPER: ROBUST BRAND DETECTION ---
  const getProductBrand = (p) => {
    return p.brand || p.Brand || p.category || p.Category || p.CATEGORY || 'Other';
  };

  // --- VIEWS ---

  const LoginView = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row border border-slate-800">
        <div className="bg-yellow-500 p-10 flex flex-col justify-center md:w-1/2">
          <div className="mb-6">
            <Truck size={64} className="text-slate-900 mb-4" />
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">JP Motors</h1>
            <p className="text-slate-900 font-bold mt-2 opacity-80">Three-Wheeler Spares Wholesale</p>
          </div>
          <p className="text-slate-900 font-semibold text-sm leading-relaxed">
            Exclusive B2B portal. Authorized retailers only.
          </p>
        </div>
        <div className="p-10 md:w-1/2 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-6">Retailer Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="username" type="text" className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:border-yellow-500 outline-none transition" placeholder="Username" />
            <input name="password" type="password" className="w-full p-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:border-yellow-500 outline-none transition" placeholder="Password" />
            {loginError && <p className="text-red-400 text-sm font-bold bg-red-900/20 border border-red-900 p-2 rounded">{loginError}</p>}
            <button className="w-full py-3 bg-yellow-500 text-slate-900 font-bold rounded hover:bg-yellow-400 transition">Access Portal</button>
          </form>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-slate-950 text-white sticky top-0 z-50 shadow-lg border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div onClick={() => setView('catalog')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
          <Truck className="text-yellow-500" />
          <span className="font-black text-xl tracking-tight uppercase">JP Motors</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-yellow-400">{user.name}</p>
            <p className="text-xs text-slate-500">Tier: <span className="text-white">{user.discount}% OFF</span></p>
          </div>
          
          <button onClick={() => setView('catalog')} title="Home" className="p-2 hover:bg-slate-800 rounded flex items-center gap-2 text-slate-400 hover:text-white transition">
            <Home size={20} />
            <span className="hidden sm:block font-bold text-sm">Home</span>
          </button>

          <button onClick={() => setView('orders')} title="Order History" className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition">
            <Clock size={20} />
          </button>
          
          <button onClick={() => setView('cart')} className="relative p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition">
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
          </button>
          
          <button onClick={handleLogout}><LogOut size={20} className="text-slate-500 hover:text-red-400 transition" /></button>
        </div>
      </div>
    </header>
  );

  const CatalogView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');

    const filtered = products.filter(p => {
      // SAFE SEARCH: handle nulls
      const name = p.name ? p.name.toLowerCase() : '';
      const partNo = p.part_number ? p.part_number.toLowerCase() : '';
      const brandName = getProductBrand(p).toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = name.includes(term) || partNo.includes(term) || brandName.includes(term);
      
      // Brand Filter Logic
      const productBrand = getProductBrand(p);
      const matchesBrand = selectedBrand === 'All' || productBrand === selectedBrand; 
      
      return matchesSearch && matchesBrand;
    });

    // Dynamic Brand List (Unique values from DB)
    const uniqueBrands = ['All', ...new Set(products.map(p => getProductBrand(p)).filter(b => b !== 'Other'))];
    const sortedBrands = uniqueBrands.sort();

    return (
      <div className="bg-slate-900 min-h-screen pb-20">
        <Header />
        
        {/* Search and Filter Bar */}
        <div className="bg-slate-950 px-4 py-3 print:hidden border-b border-slate-800 shadow-md sticky top-[72px] z-40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
            
            {/* SEARCH INPUT */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-500 w-5 h-5" />
              <input 
                className="w-full bg-slate-900 text-white border border-slate-800 rounded pl-10 pr-4 py-2 focus:border-yellow-500 outline-none placeholder-slate-600 transition"
                placeholder="Search Part Name, PN, or Brand..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* BRAND FILTER DROPDOWN */}
            <div className="w-full md:w-48">
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-900 text-slate-300 border border-slate-800 rounded px-4 py-2 focus:border-yellow-500 outline-none cursor-pointer"
              >
                 {sortedBrands.length > 1 
                  ? sortedBrands.map(brand => (
                      <option key={brand} value={brand}>{brand === 'All' ? 'All Brands' : brand}</option>
                    ))
                  : <option value="All">All Brands</option>
                }
              </select>
            </div>

          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {products.length === 0 ? (
             <div className="text-center py-20 opacity-50 text-slate-400"><p>Loading Products...</p></div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => {
              const myPrice = calculatePrice(product.price);
              const savings = product.price - myPrice;
              const displayBrand = getProductBrand(product);

              return (
                <div key={product.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg hover:border-yellow-500/50 transition duration-200 group">
                  <div className="flex justify-between items-start mb-2">
                    
                    <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded font-mono flex items-center gap-2">
                      <span>PN: {product.part_number}</span>
                      {product.HSN_code && (
                        <>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-300">HSN: {product.HSN_code}</span>
                        </>
                      )}
                    </span>

                    <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{displayBrand}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-yellow-400 transition">{product.name}</h3>
                  <div className="bg-slate-900/50 p-3 rounded mb-4 border border-slate-800">
                    <div className="flex justify-between items-end">
                      <div className="text-slate-500 text-sm line-through decoration-slate-600 decoration-2">MRP: ₹{product.price}</div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">₹{myPrice}</div>
                        {savings > 0 && (
                          <div className="text-xs font-bold text-green-400 flex items-center gap-1 justify-end">
                            <TrendingDown size={12} />
                            Save ₹{savings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => addToCart(product, 1)} className="w-full bg-yellow-500 text-slate-900 font-bold py-2 rounded hover:bg-yellow-400 transition flex justify-center items-center gap-2 shadow-lg shadow-yellow-500/20">
                    <Plus size={16} /> Add to Order
                  </button>
                </div>
              );
            })}
             {filtered.length === 0 && (
                <div className="col-span-full text-center py-10 opacity-50 text-slate-400">
                    <p>No products found matching your search or filter.</p>
                </div>
            )}
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
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-bold mb-6 text-white">Current Order Draft</h2>
          {cart.length === 0 ? (
            <div className="text-center py-20 opacity-50 text-slate-400"><ShoppingCart size={48} className="mx-auto mb-4" /><p>Cart is empty.</p></div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-sm text-slate-400 font-mono">PN: {item.part_number}</p>
                    <p className="text-sm font-bold text-yellow-500 mt-1">₹{item.finalPrice} / unit</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-900 rounded border border-slate-700">
                      <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="p-2 hover:bg-slate-700 text-slate-300 transition"><Minus size={16} /></button>
                      <span className="w-10 text-center font-bold text-sm text-white">{item.qty}</span>
                      <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="p-2 hover:bg-slate-700 text-slate-300 transition"><Plus size={16} /></button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-white">₹{item.finalPrice * item.qty}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 text-xs mt-1 flex items-center gap-1 justify-end hover:text-red-300 transition"><Trash2 size={12} /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-slate-800 rounded shadow-lg overflow-hidden mt-8 border border-slate-700">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-700"><h3 className="font-bold text-slate-300 flex items-center gap-2"><FileText size={18} /> Invoice Summary</h3></div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-slate-300"><span>Subtotal (Net)</span><span className="font-bold">₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-500 text-sm"><span>Packing & Fwd (2%)</span><span>₹{packingCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-500 text-sm border-b border-slate-700 pb-4"><span>IGST (18%)</span><span>₹{gstAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between text-2xl font-black text-white pt-2"><span>Grand Total</span><span className="text-yellow-400">₹{grandTotal.toLocaleString()}</span></div>
                  <button onClick={() => placeOrder(grandTotal)} className="w-full mt-6 bg-yellow-500 text-slate-900 font-bold py-4 rounded hover:bg-yellow-400 text-lg shadow-xl shadow-yellow-500/20 transition">Confirm Purchase Order</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrdersView = () => {
    const myOrders = user.role === 'admin' ? orders : orders.filter(o => o.userId === user.id);

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <h2 className="text-xl font-bold mb-6 text-white">Order History</h2>
          {orders.length === 0 ? <p className="opacity-50 text-center text-slate-400">No orders found.</p> : (
          <div className="space-y-4">
            {myOrders.map(order => (
              <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-md">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-slate-700 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">Order #{order.id}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'Pending' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' : 
                        order.status === 'Packed' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' :
                        'bg-green-900/40 text-green-400 border border-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Customer: {order.customerName} ({order.userId})</p>
                    <p className="text-xs text-slate-600">Date: {order.date}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                    <p className="text-xl font-black text-yellow-400">₹{order.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-slate-400">
                      <span>{item.name} <span className="text-slate-600">x{item.qty}</span></span>
                      <span className="font-mono text-slate-500">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                   <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm font-bold transition border border-slate-600">
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

    const handleCreateUser = async (e) => {
      e.preventDefault();
      const userPayload = { 
        ...newUserForm, 
        discount: parseFloat(newUserForm.discount), // PARSE ONLY ON SUBMIT
        role: 'retailer' 
      };
      
      const createdUser = await insertUser(userPayload);
      if (createdUser) {
        setUsers([...users, createdUser]);
        setNewUserForm({ name: '', username: '', password: '', discount: 10 });
        alert("User Created!");
      } else {
        alert("Failed to create user. Check console.");
      }
    };

    const handleDeleteUser = async (userId, userName) => {
      if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
      
      const success = await deleteUser(userId); 
      if (success) {
        setUsers(users.filter(u => u.id !== userId));
        alert("User Deleted Successfully");
      } else {
        alert("Failed to delete user.");
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 flex text-slate-200">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
          <div className="p-6 font-black text-xl text-yellow-500 tracking-tight">JP ADMIN</div>
          <nav className="flex-1 px-2 space-y-1">
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition ${activeTab === 'orders' ? 'bg-slate-800 text-white' : 'hover:bg-slate-900 text-slate-400'}`}><FileText size={18} /> Orders</button>
            <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition ${activeTab === 'inventory' ? 'bg-slate-800 text-white' : 'hover:bg-slate-900 text-slate-400'}`}><Package size={18} /> Inventory</button>
            <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 transition ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'hover:bg-slate-900 text-slate-400'}`}><Users size={18} /> Retailers</button>
          </nav>
          <div className="p-4"><button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"><LogOut size={18} /> Logout</button></div>
        </aside>

        <main className="flex-1 p-8 overflow-auto bg-slate-900">
          <h1 className="text-2xl font-bold text-white mb-6 capitalize">{activeTab} Management</h1>

          {activeTab === 'inventory' && (
            <div className="bg-slate-800 rounded shadow overflow-hidden border border-slate-700">
               <table className="w-full text-left">
                 <thead className="bg-slate-950 border-b border-slate-700">
                   <tr>
                     <th className="p-4 text-sm font-bold text-slate-400">Part Name</th>
                     <th className="p-4 text-sm font-bold text-slate-400">Part Number</th>
                     <th className="p-4 text-sm font-bold text-slate-400">HSN Code</th>
                     <th className="p-4 text-sm font-bold text-slate-400">Category</th>
                     <th className="p-4 text-sm font-bold text-slate-400">Price</th>
                     <th className="p-4 text-sm font-bold text-slate-400">Stock</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">{products.map(p => (
                   <tr key={p.id} className="hover:bg-slate-700/50 transition">
                     <td className="p-4 text-slate-200">{p.name}</td>
                     <td className="p-4 font-mono text-sm text-slate-400">{p.part_number}</td>
                     {/* UPDATE: Using p.HSN_code here too for consistency */}
                     <td className="p-4 text-slate-400">{p.HSN_code || '-'}</td>
                     <td className="p-4 text-slate-400">{getProductBrand(p)}</td>
                     <td className="p-4 text-slate-200">₹{p.price}</td>
                     <td className="p-4 text-slate-200">{p.stock}</td>
                   </tr>
                 ))}</tbody>
               </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {users.filter(u => u.role !== 'admin').map(u => (
                  <div key={u.id} className="bg-slate-800 p-4 rounded shadow flex justify-between items-center border border-slate-700">
                    <div>
                        <h4 className="font-bold text-white">{u.name}</h4>
                        <p className="text-sm text-slate-500">User: {u.username}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 rounded text-sm font-bold">{u.discount}% Discount</div>
                        <button 
                            onClick={() => handleDeleteUser(u.id, u.name)} 
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 p-6 rounded shadow h-fit border border-slate-700">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-white"><UserPlus size={18} /> Add Retailer</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <input placeholder="Shop Name" className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:border-yellow-500 outline-none" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Username" className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:border-yellow-500 outline-none" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} required />
                    <input placeholder="Password" className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:border-yellow-500 outline-none" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} required />
                  </div>
                  {/* DECIMAL DISCOUNT FIX: STORE AS STRING, PARSE ON SUBMIT */}
                  <div>
                    <label className="text-xs font-bold text-slate-500">Discount Tier (%)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white focus:border-yellow-500 outline-none" 
                      value={newUserForm.discount} 
                      onChange={e => setNewUserForm({...newUserForm, discount: e.target.value})} 
                    />
                  </div>
                  <button className="w-full bg-yellow-500 text-slate-900 font-bold py-2 rounded hover:bg-yellow-400 transition">Create Credentials</button>
                </form>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded shadow border-l-4 border-yellow-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">Pending Orders</p>
                   <p className="text-2xl font-black text-white">{orders.filter(o => o.status === 'Pending').length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded shadow border-l-4 border-blue-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">To Be Shipped</p>
                   <p className="text-2xl font-black text-white">{orders.filter(o => o.status === 'Packed').length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded shadow border-l-4 border-green-500">
                   <p className="text-xs text-slate-500 uppercase font-bold">Completed Revenue</p>
                   <p className="text-2xl font-black text-white">
                     ₹{(orders.filter(o => o.status === 'Delivered').reduce((acc, curr) => acc + curr.total, 0)/1000).toFixed(1)}k
                   </p>
                </div>
              </div>

              {orders.map(order => {
                return (
                  <div key={order.id} className="bg-slate-800 p-6 rounded shadow border border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg text-white">#{order.id}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            order.status === 'Pending' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800' : 
                            order.status === 'Packed' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' :
                            'bg-green-900/40 text-green-400 border border-green-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Customer: {order.customerName} ({order.userId})</p>
                        <p className="text-xs text-slate-600">Date: {order.date}</p>
                      </div>
                      <div className="text-right mt-2 md:mt-0">
                         <p className="font-black text-xl text-yellow-400">₹{order.total.toLocaleString()}</p>
                         <p className="text-xs text-slate-500">Items: {order.items.length}</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded mb-4 text-sm space-y-1 border border-slate-700">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-700 last:border-0 pb-1 last:pb-0">
                          <span className="text-slate-300">{item.name} x {item.qty}</span>
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

                      <button className="px-3 py-2 bg-slate-700 text-slate-300 text-sm font-bold rounded hover:bg-slate-600 border border-slate-600">
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