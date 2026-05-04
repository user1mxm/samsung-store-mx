// @ts-nocheck
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, Package, ShoppingCart, TrendingUp, DollarSign,
  Star, ShieldCheck, LogOut, BarChart3, Activity, Calendar,
  Upload, Plus, Trash2, Pencil, X, Image, Check, Search,
  RefreshCw, Eye, ChevronUp, ChevronDown, Zap, CreditCard, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#1428A0", "#00BFFF", "#0077C8", "#FF6900", "#A50034", "#28a745", "#6c5ce7"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', model: '', category: 'oled', price: '', description: '', stock: '', rating: '4.5', imageUrl: '' });
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [statsAnimated, setStatsAnimated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const { data: products, refetch: refetchProducts } = trpc.product.list.useQuery();
  const { data: orders } = trpc.order.list.useQuery();
  const { data: agents } = trpc.agent.list.useQuery();
  const { data: reviews } = trpc.review.list.useQuery();
  const { data: networkData } = trpc.referral.getNetworkTree.useQuery(undefined, { retry: false });

  const createProductMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success(`Producto "${newProduct.name}" creado`);
      setNewProduct({ name: '', model: '', category: 'oled', price: '', description: '', stock: '', rating: '4.5', imageUrl: '' });
      refetchProducts();
    },
    onError: (e: any) => toast.error(e.message || 'Error al crear producto'),
  });

  const deleteProductMutation = trpc.product.delete.useMutation({
    onSuccess: () => { toast.success('Producto eliminado'); refetchProducts(); },
    onError: (e: any) => toast.error(e.message || 'Error al eliminar'),
  });

  const updateOrderStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => toast.success('Estado actualizado'),
    onError: (e: any) => toast.error(e.message || 'Error al actualizar'),
  });

  const totalRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = (orders || []).filter(o => o.status === "pending").length;
  const completedOrders = (orders || []).filter(o => o.status === "completed" || o.status === "delivered").length;
  const totalProducts = (products || []).length;
  const lowStock = (products || []).filter(p => Number(p.stock) < 5).length;

  useEffect(() => { setTimeout(() => setStatsAnimated(true), 300); }, []);

  const handleImageUpload = useCallback(async (files: FileList | null, productId?: number) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (productId && editProduct) setEditProduct({ ...editProduct, imageUrl: url });
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  }, [editProduct]);

  const handleBulkUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) { toast.error(`${file.name}: formato no soportado`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: maximo 5MB`); continue; }
      const reader = new FileReader();
      await new Promise<void>((resolve) => { reader.onload = (e) => { const url = e.target?.result as string; if (url) uploaded.push(url); resolve(); }; reader.readAsDataURL(file); });
    }
    setUploading(false);
    toast.success(`${uploaded.length} imagenes procesadas`);
    refetchProducts();
  }, [refetchProducts]);

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.price) { toast.error('Nombre y precio son requeridos'); return; }
    createProductMutation.mutate({
      name: newProduct.name,
      model: newProduct.model || newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      imageUrl: newProduct.imageUrl || '/tv-neo-real.jpg',
      description: newProduct.description || undefined,
      stock: Number(newProduct.stock) || 0,
      featured: 'no',
    });
  };

  const handleDeleteProduct = (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    deleteProductMutation.mutate({ id });
  };

  const filteredProducts = (products || []).filter(p =>
    p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.model?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  // Build last-7-days sales chart from real orders
  const salesData = useMemo(() => {
    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const buckets: Record<string, { ventas: number; ordenes: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = DAY_NAMES[d.getDay()];
      buckets[key] = { ventas: 0, ordenes: 0 };
    }
    (orders || []).forEach(o => {
      const d = new Date(o.createdAt);
      const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diffDays <= 6) {
        const key = DAY_NAMES[d.getDay()];
        if (buckets[key]) {
          buckets[key].ventas += Number(o.total || 0);
          buckets[key].ordenes += 1;
        }
      }
    });
    const avg = Object.values(buckets).reduce((s, b) => s + b.ventas, 0) / 7 || 40000;
    return Object.entries(buckets).map(([name, b]) => ({ name, ventas: b.ventas, ordenes: b.ordenes, meta: Math.round(avg) }));
  }, [orders]);

  const cats: Record<string, number> = {};
  (products || []).forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  const productCategoryData = Object.entries(cats).length > 0
    ? Object.entries(cats).map(([name, value]) => ({ name, value }))
    : [{ name: "OLED", value: 3 }, { name: "Neo QLED", value: 3 }, { name: "The Frame", value: 1 }, { name: "Gaming", value: 1 }];

  const statsCards = [
    { label: "Ingresos Totales", value: `$${(statsAnimated ? totalRevenue : 0).toLocaleString()}`, raw: totalRevenue, icon: DollarSign, color: "from-emerald-500 to-emerald-600", trend: "+12.5%", up: true, sublabel: "vs semana anterior" },
    { label: "Productos Activos", value: statsAnimated ? totalProducts : 0, raw: totalProducts, icon: Package, color: "from-[#1428A0] to-[#0f1f7a]", trend: `${lowStock} bajo stock`, up: null, sublabel: "en catalogo" },
    { label: "Ordenes", value: statsAnimated ? ((orders || []).length) : 0, raw: (orders || []).length, icon: ShoppingCart, color: "from-orange-500 to-orange-600", trend: `${pendingOrders} pendientes`, up: null, sublabel: `${completedOrders} completadas` },
    { label: "Agentes", value: statsAnimated ? (agents || []).length : 0, raw: (agents || []).length, icon: Users, color: "from-purple-500 to-purple-600", trend: "Activo", up: true, sublabel: "en campo" },
  ];

  const tabIcons: Record<string, any> = {
    overview: Activity, products: Package, orders: ShoppingCart,
    agents: Users, reviews: Star, upload: Upload, network: BarChart3
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <ShieldCheck className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm hidden sm:inline">PANEL ADMINISTRATIVO</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline opacity-90">{user?.name}</span>
            <Badge className="bg-white/20 text-white text-[10px] font-bold">ADMIN</Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statsCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    {s.up !== null && (
                      <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {s.trend}
                      </div>
                    )}
                    {s.up === null && (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">{s.trend}</span>
                    )}
                  </div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.sublabel}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Overview Charts */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid lg:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#1428A0]" /> Ventas Semanales</CardTitle>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1428A0]" />Ventas</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />Meta</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={salesData}>
                        <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1428A0" stopOpacity={0.25} /><stop offset="95%" stopColor="#1428A0" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number, n: string) => [n === 'ventas' ? `$${v.toLocaleString()}` : `$${v.toLocaleString()}`, n === 'ventas' ? 'Ventas' : 'Meta']} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                        <Area type="monotone" dataKey="ventas" stroke="#1428A0" fill="url(#colorSales)" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><PieChart className="w-4 h-4 text-[#1428A0]" /> Categorias</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={productCategoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                          {productCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                      {productCategoryData.map((cat, i) => (
                        <span key={cat.name} className="text-[10px] text-gray-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{cat.name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity + Quick Actions */}
              <div className="grid lg:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-[#1428A0]" /> Acciones Rapidas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Plus, label: 'Nuevo Producto', desc: 'Agregar al catalogo', action: () => setActiveTab('upload'), color: 'from-[#1428A0] to-[#0077C8]' },
                        { icon: Upload, label: 'Subir Imagenes', desc: 'Bulk upload', action: () => setActiveTab('upload'), color: 'from-purple-500 to-purple-600' },
                        { icon: Users, label: 'Gestionar Agentes', desc: `${(agents || []).length} activos`, action: () => setActiveTab('agents'), color: 'from-orange-500 to-orange-600' },
                        { icon: BarChart3, label: 'Ver Reportes', desc: 'Analytics', action: () => {}, color: 'from-emerald-500 to-emerald-600' },
                      ].map(action => (
                        <motion.button key={action.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={action.action}
                          className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left group">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-4 h-4" />
                          </div>
                          <p className="text-[11px] font-bold">{action.label}</p>
                          <p className="text-[9px] text-gray-500">{action.desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-[#1428A0]" /> Actividad Reciente</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { icon: CheckCircle2, text: 'Orden #124 completada', time: 'Hace 5 min', color: 'text-green-500' },
                      { icon: Plus, text: 'Producto S95D agregado', time: 'Hace 30 min', color: 'text-blue-500' },
                      { icon: Users, text: 'Nuevo agente registrado', time: 'Hace 1h', color: 'text-purple-500' },
                      { icon: CreditCard, text: 'Pago confirmado $47,999', time: 'Hace 2h', color: 'text-emerald-500' },
                      { icon: Star, text: 'Nueva resena 5 estrellas', time: 'Hace 3h', color: 'text-yellow-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                        <div className="flex-1 min-w-0"><p className="text-[11px] font-medium truncate">{item.text}</p><p className="text-[9px] text-gray-400">{item.time}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 mb-4 overflow-x-auto pb-1">
          {["overview", "products", "orders", "agents", "reviews", "network", "upload"].map((tab) => {
            const Icon = tabIcons[tab];
            return (
              <Button key={tab} variant={activeTab === tab ? "default" : "outline"}
                className={`rounded-full text-[11px] capitalize font-bold ${activeTab === tab ? "bg-[#1428A0] text-white shadow-md" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setActiveTab(tab)}>
                <Icon className="w-3.5 h-3.5 mr-1" /> {tab === 'upload' ? 'Subir' : tab === 'network' ? 'Red' : tab}
              </Button>
            );
          })}
        </div>

        {/* Products Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input placeholder="Buscar producto..." value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} className="pl-9 h-10 text-sm rounded-xl" />
                </div>
                <Button size="sm" className="h-10 bg-[#1428A0] rounded-xl text-xs font-bold" onClick={() => setActiveTab("upload")}><Plus className="w-4 h-4 mr-1" /> Nuevo</Button>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50">
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Producto</th>
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Categoria</th>
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Precio</th>
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Stock</th>
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Estado</th>
                        <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Acciones</th>
                      </tr></thead>
                      <tbody>
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 transition-colors">
                            <td className="p-3"><div className="flex items-center gap-2.5"><img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg" /><span className="font-medium text-[11px] truncate max-w-[140px]">{p.name}</span></div></td>
                            <td className="p-3"><Badge variant="outline" className="text-[10px] font-bold">{p.category}</Badge></td>
                            <td className="p-3 font-black text-[#1428A0]">${Number(p.price).toLocaleString()}</td>
                            <td className="p-3"><span className={`font-bold ${Number(p.stock) < 5 ? 'text-orange-500' : 'text-gray-700'}`}>{p.stock}</span></td>
                            <td className="p-3"><Badge className={`text-[10px] font-bold ${Number(p.stock) > 5 ? 'bg-green-100 text-green-700' : Number(p.stock) > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{Number(p.stock) > 5 ? 'Disponible' : Number(p.stock) > 0 ? 'Bajo stock' : 'Agotado'}</Badge></td>
                            <td className="p-3"><div className="flex gap-1"><Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-blue-50" onClick={() => setEditProduct(p)}><Pencil className="w-3.5 h-3.5 text-blue-500" /></Button><Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-red-50" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Tab */}
        <AnimatePresence>
          {activeTab === "upload" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Upload className="w-4 h-4 text-[#1428A0]" /> Subir Imagenes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div onClick={() => bulkInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleBulkUpload(e.dataTransfer.files); }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${uploading ? 'border-[#1428A0] bg-blue-50/50' : 'border-gray-200 hover:border-[#1428A0] hover:bg-gray-50/50'}`}>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${uploading ? 'text-[#1428A0] animate-bounce' : 'text-gray-300'}`} />
                    <p className="text-sm font-bold mb-1">{uploading ? 'Subiendo...' : 'Arrastra imagenes aqui'}</p>
                    <p className="text-[10px] text-gray-400">JPG, PNG, WebP · Max 5MB</p>
                    <input ref={bulkInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleBulkUpload(e.target.files)} />
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-2 text-gray-500">Vista Previa del Catalogo</p>
                    <div className="grid grid-cols-4 gap-2">
                      {(products || []).slice(0, 8).map(p => (
                        <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-video">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-[8px] text-white font-bold text-center px-1">{p.name}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-[#1428A0]" /> Crear Producto</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Nombre *" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="h-10 rounded-xl text-sm" />
                  <Input placeholder="Modelo (ej: QN65S95DAFXZA)" value={newProduct.model} onChange={e => setNewProduct({ ...newProduct, model: e.target.value })} className="h-10 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white">
                      <option value="oled">OLED</option><option value="neo-qled">Neo QLED</option><option value="the-frame">The Frame</option><option value="gaming">Gaming</option><option value="crystal-uhd">Crystal UHD</option>
                    </select>
                    <Input placeholder="Precio MXN *" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="h-10 rounded-xl text-sm" />
                  </div>
                  <Input placeholder="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="h-10 rounded-xl text-sm" />
                  <Input placeholder="URL de imagen" value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} className="h-10 rounded-xl text-sm" />
                  <textarea placeholder="Descripcion" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[80px] resize-none" />
                  <Button className="w-full h-11 samsung-btn-primary rounded-xl text-sm font-bold" onClick={handleCreateProduct} disabled={createProductMutation.isPending}><Check className="w-4 h-4 mr-2" /> {createProductMutation.isPending ? 'Creando...' : 'Crear Producto'}</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders, Agents, Reviews tabs */}
        <AnimatePresence>
          {activeTab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-[#1428A0]" /> Ordenes ({(orders || []).length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(orders || []).length === 0 ? (
                    <div className="text-center py-10"><ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Sin ordenes aun</p></div>
                  ) : (
                    (orders || []).map((o) => (
                      <div key={o.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#1428A0]/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-[#1428A0]" /></div>
                          <div>
                            <p className="text-xs font-bold">Orden #{o.id}</p>
                            <p className="text-[10px] text-gray-500">{new Date(o.createdAt).toLocaleDateString('es-MX')}</p>
                            {o.agentId && <p className="text-[9px] text-[#1428A0]">Agente #{o.agentId}</p>}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="text-sm font-black text-[#1428A0]">${Number(o.total || 0).toLocaleString()}</p>
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatusMutation.mutate({ id: o.id, status: e.target.value as any })}
                            className="text-[10px] border border-gray-200 rounded-lg px-1.5 py-0.5 bg-white cursor-pointer"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeTab === "agents" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-[#1428A0]" /> Agentes de Ventas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(agents || []).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white font-bold text-sm">{a.name?.[0] || 'A'}</div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{a.name || 'Agente'}</p><p className="text-xs text-gray-500">{a.specialty || 'Ventas General'}</p></div>
                      <div className="text-right"><p className="text-xs font-black text-[#1428A0]">${Number(a.commission || 0).toLocaleString()}</p>
                        <div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${a.status === 'online' ? 'bg-green-500' : a.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'}`} /><span className="text-[9px] text-gray-500">{a.status || 'offline'}</span></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Resenas de Clientes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(reviews || []).length === 0 ? (
                    <div className="text-center py-10"><Star className="w-10 h-10 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Sin resenas aun</p></div>
                  ) : (
                    (reviews || []).map((r) => (
                      <div key={r.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">{(r.authorName || 'U')[0]}</div><span className="text-xs font-bold">{r.authorName || 'Usuario'}</span></div>
                          <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{r.comment}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {activeTab === "network" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#1428A0]" /> Red de Embajadores ({(networkData || []).length})</CardTitle></CardHeader>
                <CardContent>
                  {!(networkData || []).length ? (
                    <div className="text-center py-10"><Users className="w-10 h-10 mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Sin miembros registrados</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Usuario</th>
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Codigo</th>
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Nivel</th>
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Red</th>
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Ventas Red</th>
                          <th className="text-left p-3 font-bold text-[10px] uppercase tracking-wider text-gray-500">Ganancias</th>
                        </tr></thead>
                        <tbody>
                          {(networkData || []).map((n: any) => (
                            <tr key={n.userId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-[10px] font-bold">{(n.name || 'U')[0]}</div>
                                  <div>
                                    <p className="font-medium">{n.name}</p>
                                    <p className="text-[9px] text-gray-400">{n.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-[#1428A0] font-bold">{n.referralCode}</td>
                              <td className="p-3"><Badge variant="outline" className="text-[9px]">Nivel {n.level}</Badge></td>
                              <td className="p-3 font-bold">{n.networkSize}</td>
                              <td className="p-3 font-black text-[#1428A0]">${Number(n.totalNetworkSales || 0).toLocaleString()}</td>
                              <td className="p-3 font-black text-emerald-600">${Number(n.totalEarnings || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
