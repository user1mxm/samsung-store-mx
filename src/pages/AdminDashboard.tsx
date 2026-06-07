// @ts-nocheck
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Package, ShoppingCart, TrendingUp, DollarSign, Star,
  LogOut, Upload, Plus, Trash2, Pencil, X, Search, Image,
  CheckCircle2, XCircle, ShieldCheck, UserCheck, UserX,
  ArrowUpRight, Zap, BarChart3, Clock, ChevronDown, ChevronUp,
  Tag, Layers, FileText, Settings, Eye, Hash, Phone, Mail,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const B = "#1428A0";
const A = "#0077C8";
const R = "#DC2626";
const CATS = ["oled","neo-qled","frame","gaming","crystal","monitor","mobile","audio","otro"];

/* ─── helpers ─── */
function StatCard({ icon: Icon, label, value, sub, color=B, trend }: any) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend!==undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trend>=0?"text-green-500":"text-red-500"}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend<0?"rotate-180":""}`} />{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}
function RoleBadge({ role }: any) {
  const m: any = {
    admin: ["bg-red-100","text-red-700","Admin"],
    agent: ["bg-blue-100","text-blue-700","Agente"],
    client:["bg-gray-100","text-gray-600","Cliente"],
  };
  const [bg,tx,lb] = m[role]??m.client;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bg} ${tx}`}>{lb}</span>;
}
function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-600 block">{label}</label>
      {children}
    </div>
  );
}

/* ─── Drag & Drop image zone ─── */
function ImageDropZone({ value, onChange, compact=false }: { value:string; onChange:(v:string)=>void; compact?:boolean }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const processFile = (file: File) => {
    if (!["jpg","jpeg","png","webp","gif"].includes(file.name.split(".").pop()?.toLowerCase()??"")) {
      toast.error("Formato no soportado"); return;
    }
    if (file.size > 8*1024*1024) { toast.error("Máximo 8MB"); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onClick = () => {
    const i = document.createElement("input");
    i.type="file"; i.accept="image/*";
    i.onchange = (e:any) => { const f=e.target.files[0]; if(f) processFile(f); };
    i.click();
  };

  return (
    <div ref={ref} onClick={onClick}
      onDragOver={e=>{e.preventDefault();setDragging(true)}}
      onDragLeave={()=>setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        dragging ? "border-[#1428A0] bg-blue-50" : value ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#1428A0] hover:bg-blue-50/30"
      } ${compact ? "h-24" : "h-40"}`}>
      {value ? (
        <div className="w-full h-full relative">
          <img src={value} alt="preview" className="w-full h-full object-contain rounded-xl p-1" />
          <button onClick={e=>{e.stopPropagation();onChange("")}}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
          <Upload className={`text-gray-300 ${compact?"w-6 h-6":"w-8 h-8"}`} />
          <p className={`text-gray-400 font-medium ${compact?"text-[10px]":"text-xs"}`}>
            {dragging ? "¡Suelta aquí!" : "Arrastra o click para subir"}
          </p>
          {!compact && <p className="text-[10px] text-gray-300">JPG, PNG, WEBP · máx 8MB</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Feature Tag input ─── */
function TagInput({ value, onChange, placeholder }: { value:string[]; onChange:(v:string[])=>void; placeholder?:string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();add();} }}
          placeholder={placeholder??"Agregar característica..."} className="h-9 rounded-xl text-xs flex-1" />
        <button type="button" onClick={add}
          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t,i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
              {t}
              <button onClick={()=>onChange(value.filter((_,j)=>j!==i))} className="hover:text-red-500">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Specs key-value editor ─── */
function SpecsEditor({ value, onChange }: { value:Record<string,string>; onChange:(v:Record<string,string>)=>void }) {
  const [k, setK] = useState("");
  const [v, setV] = useState("");
  const add = () => {
    if (!k.trim()) return;
    onChange({ ...value, [k.trim()]: v.trim() });
    setK(""); setV("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={k} onChange={e=>setK(e.target.value)} placeholder="Especificación" className="h-9 rounded-xl text-xs flex-1" onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),add())} />
        <Input value={v} onChange={e=>setV(e.target.value)} placeholder="Valor" className="h-9 rounded-xl text-xs flex-1" onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),add())} />
        <button type="button" onClick={add}
          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 flex-shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {Object.keys(value).length > 0 && (
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          {Object.entries(value).map(([sk,sv]) => (
            <div key={sk} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-[10px] font-bold text-gray-600 w-1/3 truncate">{sk}</span>
              <span className="text-[10px] text-gray-500 flex-1 truncate px-2">{sv}</span>
              <button onClick={()=>{ const n={...value}; delete n[sk]; onChange(n); }}
                className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Product Form (shared by new + edit) ─── */
function ProductForm({ initial, onSave, onCancel, saving }: any) {
  const empty = { name:"",model:"",category:"oled",price:"",comparePrice:"",stock:"10",
    description:"",imageUrl:"",featured:"no",features:[],specs:{},rating:"4.5" };
  const [p, setP] = useState<any>(initial ?? empty);
  const [section, setSection] = useState("basic");

  const set = (k:string,v:any) => setP((prev:any)=>({...prev,[k]:v}));

  const SECTIONS = [
    { id:"basic",   label:"Básico",        icon:Package  },
    { id:"media",   label:"Imagen",        icon:Image    },
    { id:"pricing", label:"Precios",       icon:Tag      },
    { id:"detail",  label:"Descripción",   icon:FileText },
    { id:"specs",   label:"Specs",         icon:Layers   },
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={()=>setSection(s.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all ${
              section===s.id ? "bg-white text-[#1428A0] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}>
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* BÁSICO */}
        {section==="basic" && <>
          <Field label="Nombre del producto *">
            <Input value={p.name} onChange={e=>set("name",e.target.value)}
              placeholder='Samsung S95D OLED 65"' className="h-10 rounded-xl text-sm" />
          </Field>
          <Field label="Número de modelo *">
            <Input value={p.model} onChange={e=>set("model",e.target.value)}
              placeholder="QN65S95DAFXZA" className="h-10 rounded-xl text-sm" />
          </Field>
          <Field label="Categoría">
            <select value={p.category} onChange={e=>set("category",e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 text-sm px-3 bg-white">
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <Input value={p.stock} onChange={e=>set("stock",e.target.value)}
                type="number" min="0" className="h-10 rounded-xl text-sm" />
            </Field>
            <Field label="Rating (0-5)">
              <Input value={p.rating} onChange={e=>set("rating",e.target.value)}
                type="number" min="0" max="5" step="0.1" className="h-10 rounded-xl text-sm" />
            </Field>
          </div>
          <Field label="Destacado en homepage">
            <div className="flex gap-2">
              {["yes","no"].map(v=>(
                <button key={v} type="button" onClick={()=>set("featured",v)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    p.featured===v ? "bg-[#1428A0] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>{v==="yes"?"⭐ Sí":"No"}</button>
              ))}
            </div>
          </Field>
        </>}

        {/* IMAGEN */}
        {section==="media" && <>
          <Field label="Imagen principal (drag & drop o click)">
            <ImageDropZone value={p.imageUrl} onChange={v=>set("imageUrl",v)} />
          </Field>
          <Field label="URL de imagen (alternativo)">
            <Input value={p.imageUrl?.startsWith("data:") ? "" : p.imageUrl}
              onChange={e=>set("imageUrl",e.target.value)}
              placeholder="/tv-s95d-real.jpg o https://..." className="h-10 rounded-xl text-sm" />
          </Field>
          {p.imageUrl && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 mb-2">Vista previa</p>
              <img src={p.imageUrl} alt="preview" className="w-full h-40 object-contain rounded-lg"
                onError={()=>set("imageUrl","")} />
            </div>
          )}
        </>}

        {/* PRECIOS */}
        {section==="pricing" && <>
          <Field label="Precio de venta (MXN) *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
              <Input value={p.price} onChange={e=>set("price",e.target.value)}
                type="number" min="0" placeholder="47999" className="h-10 rounded-xl text-sm pl-7" />
            </div>
          </Field>
          <Field label="Precio de comparación / tachado (MXN)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
              <Input value={p.comparePrice} onChange={e=>set("comparePrice",e.target.value)}
                type="number" min="0" placeholder="55999 (opcional)" className="h-10 rounded-xl text-sm pl-7" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Si se define, aparece tachado junto al precio de venta</p>
          </Field>
          {p.price && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Vista previa del precio:</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#1428A0]">${Number(p.price).toLocaleString()} MXN</span>
                {p.comparePrice && <span className="text-sm text-gray-400 line-through">${Number(p.comparePrice).toLocaleString()}</span>}
                {p.comparePrice && p.price && (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    -{Math.round((1-Number(p.price)/Number(p.comparePrice))*100)}% OFF
                  </span>
                )}
              </div>
            </div>
          )}
        </>}

        {/* DESCRIPCIÓN */}
        {section==="detail" && <>
          <Field label="Descripción larga">
            <textarea value={p.description} onChange={e=>set("description",e.target.value)}
              placeholder="Descripción detallada del producto, características principales, casos de uso..."
              className="w-full rounded-xl border border-gray-200 text-sm p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#1428A0]/20 focus:border-[#1428A0]" />
          </Field>
          <Field label="Características (Enter o + para agregar)">
            <TagInput value={p.features??[]} onChange={v=>set("features",v)}
              placeholder="4K OLED, 144Hz, Dolby Atmos..." />
          </Field>
        </>}

        {/* SPECS */}
        {section==="specs" && <>
          <Field label="Especificaciones técnicas">
            <SpecsEditor value={p.specs??{}} onChange={v=>set("specs",v)} />
          </Field>
          <p className="text-[10px] text-gray-400">Escribe la clave y el valor, luego presiona +</p>
        </>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl h-11">Cancelar</Button>
        <Button onClick={()=>onSave(p)} disabled={saving || !p.name || !p.price}
          className="flex-1 rounded-xl h-11 text-white font-bold" style={{ background:B }}>
          {saving ? "Guardando..." : "Guardar Producto"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Agent Form ─── */
function AgentForm({ users, onSave, onCancel, saving }: any) {
  const [form, setForm] = useState({
    userId:"", name:"", email:"", code:"", specialty:"OLED y Neo QLED", phone:"",
    isNew:false, newName:"", newEmail:"",
  });
  const set = (k:string,v:any) => setForm(p=>({...p,[k]:v}));

  const clientUsers = (users||[]).filter((u:any) => u.role==="client");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button onClick={()=>set("isNew",false)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!form.isNew?"bg-white text-[#1428A0] shadow-sm":"text-gray-400"}`}>
          Usuario existente
        </button>
        <button onClick={()=>set("isNew",true)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.isNew?"bg-white text-[#1428A0] shadow-sm":"text-gray-400"}`}>
          Crear nuevo usuario
        </button>
      </div>

      {!form.isNew ? (
        <Field label="Seleccionar usuario cliente">
          <select value={form.userId} onChange={e=>set("userId",e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 text-sm px-3 bg-white">
            <option value="">— Selecciona un usuario —</option>
            {clientUsers.map((u:any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          {clientUsers.length===0 && (
            <p className="text-[10px] text-amber-600 mt-1">No hay clientes disponibles para promover</p>
          )}
        </Field>
      ) : (
        <>
          <Field label="Nombre completo *">
            <Input value={form.newName} onChange={e=>set("newName",e.target.value)}
              placeholder="Carlos Mendez" className="h-10 rounded-xl text-sm" />
          </Field>
          <Field label="Correo electrónico *">
            <Input value={form.newEmail} onChange={e=>set("newEmail",e.target.value)}
              type="email" placeholder="agente@samsungstore.mx" className="h-10 rounded-xl text-sm" />
          </Field>
        </>
      )}

      <Field label="Código de agente *">
        <div className="relative">
          <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input value={form.code} onChange={e=>set("code",e.target.value)}
            placeholder="AGENT-007" className="h-10 rounded-xl text-sm pl-9" />
        </div>
      </Field>

      <Field label="Especialidad">
        <select value={form.specialty} onChange={e=>set("specialty",e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-200 text-sm px-3 bg-white">
          {["OLED y Neo QLED","Gaming Odyssey","The Frame y Lifestyle",
            "Crystal UHD","Monitores","Audio y Accesorios","General"].map(s=>(
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Teléfono (WhatsApp)">
        <div className="relative">
          <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input value={form.phone} onChange={e=>set("phone",e.target.value)}
            placeholder="+52 55 1234 5678" className="h-10 rounded-xl text-sm pl-9" />
        </div>
      </Field>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl h-11">Cancelar</Button>
        <Button onClick={()=>onSave(form)} disabled={saving || (!form.isNew && !form.userId) || (form.isNew && (!form.newName||!form.newEmail)) || !form.code}
          className="flex-1 rounded-xl h-11 text-white font-bold" style={{ background:B }}>
          {saving ? "Guardando..." : "Agregar Agente"}
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  /* queries */
  const { data: products, refetch: refetchProducts } = trpc.product.list.useQuery();
  const { data: orders }  = trpc.order.list.useQuery();
  const { data: agents, refetch: refetchAgents }  = trpc.agent.list.useQuery();
  const { data: userList, refetch: refetchUsers } = trpc.user.list.useQuery();
  const { data: userStats, refetch: refetchStats } = trpc.user.stats.useQuery();

  /* mutations */
  const deleteProduct  = trpc.product.delete.useMutation({ onSuccess:()=>{ toast.success("Producto eliminado"); refetchProducts(); setConfirmDelete(null); } });
  const updateProduct  = trpc.product.update.useMutation({ onSuccess:()=>{ toast.success("Producto actualizado ✓"); refetchProducts(); setEditProduct(null); } });
  const createProduct  = trpc.product.create.useMutation({ onSuccess:()=>{ toast.success("Producto creado ✓"); refetchProducts(); setShowNewProduct(false); } });
  const updateRole     = trpc.user.updateRole.useMutation({ onSuccess:()=>{ toast.success("Rol actualizado"); refetchUsers(); refetchStats(); refetchAgents(); } });
  const deleteUser     = trpc.user.delete.useMutation({ onSuccess:()=>{ toast.success("Usuario eliminado"); refetchUsers(); refetchStats(); setConfirmDelete(null); } });
  const approveAgent   = trpc.user.approveAgent.useMutation({ onSuccess:()=>{ toast.success("Agente aprobado ✓"); refetchUsers(); refetchStats(); refetchAgents(); setShowNewAgent(false); } });
  const updateStatus   = trpc.agent.updateStatus.useMutation({ onSuccess:()=>{ toast.success("Estado actualizado"); refetchAgents(); } });
  const updateCommission = trpc.agent.updateCommission.useMutation({ onSuccess:()=>toast.success("Comisión actualizada") });

  /* derived */
  const totalRevenue  = (orders||[]).reduce((s,o)=>s+Number(o.total||0),0);
  const pendingOrders = (orders||[]).filter(o=>o.status==="pending").length;
  const lowStock      = (products||[]).filter(p=>Number(p.stock)<5).length;

  const filteredProducts = useMemo(()=>
    (products||[]).filter(p=>
      p.name?.toLowerCase().includes(productSearch.toLowerCase())||
      p.model?.toLowerCase().includes(productSearch.toLowerCase())
    ),[products,productSearch]);

  const filteredUsers = useMemo(()=>
    (userList||[]).filter(u=>{
      const ms = u.name?.toLowerCase().includes(userSearch.toLowerCase())||u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const mr = roleFilter==="all"||u.role===roleFilter;
      return ms&&mr;
    }),[userList,userSearch,roleFilter]);

  /* save handlers */
  const handleSaveNew = (p:any) => {
    if(!p.name||!p.price){ toast.error("Nombre y precio son requeridos"); return; }
    createProduct.mutate({
      name:p.name, model:p.model||"N/A", category:p.category, price:String(p.price),
      comparePrice:p.comparePrice||undefined,
      imageUrl:p.imageUrl||"/logo-samsung-mx.png",
      description:p.description, features:p.features, specs:p.specs,
      stock:Number(p.stock)||0, rating:p.rating||"4.5", featured:p.featured,
    });
  };

  const handleSaveEdit = (p:any) => {
    updateProduct.mutate({ id:p.id, data:{
      name:p.name, model:p.model, category:p.category,
      price:String(p.price), comparePrice:p.comparePrice||undefined,
      imageUrl:p.imageUrl, description:p.description,
      features:p.features, specs:p.specs,
      stock:Number(p.stock), rating:p.rating, featured:p.featured,
    }});
  };

  const handleSaveAgent = async (form:any) => {
    if(form.isNew) {
      // Crear usuario nuevo + convertir en agente directamente via approveAgent con userId especial
      // Por simplicidad: crear vía approveAgent pasando datos de nuevo usuario
      // Nota: para crear usuario nuevo necesitaríamos un endpoint adicional.
      // Usar approveAgent con userId=0 como señal de nuevo usuario no aplica.
      // En su lugar, usamos updateRole después de register — aquí solo soportamos usuarios existentes.
      toast.info("Para nuevo usuario: regístralo primero en /login, luego promócelo aquí");
      setShowNewAgent(false);
      return;
    }
    approveAgent.mutate({ userId:Number(form.userId), code:form.code, specialty:form.specialty });
  };

  const salesData = [
    {mes:"Ene",ventas:12,ingresos:48000},{mes:"Feb",ventas:18,ingresos:72000},
    {mes:"Mar",ventas:14,ingresos:56000},{mes:"Abr",ventas:22,ingresos:88000},
    {mes:"May",ventas:28,ingresos:112000},{mes:"Jun",ventas:35,ingresos:140000},
  ];

  const TABS = [
    { id:"overview", label:"Overview",  icon:BarChart3   },
    { id:"products", label:"Productos", icon:Package     },
    { id:"users",    label:"Usuarios",  icon:Users       },
    { id:"orders",   label:"Órdenes",   icon:ShoppingCart},
    { id:"agents",   label:"Agentes",   icon:UserCheck   },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1428A0] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">SAMSUNG STORE MX</p>
              <p className="text-[10px] text-gray-400">Panel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">{user?.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">ADMIN</span>
            <button onClick={()=>{logout();navigate("/login");}}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                tab===t.id?"border-[#1428A0] text-[#1428A0]":"border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* OVERVIEW */}
        {tab==="overview" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} label="Ingresos" value={`$${totalRevenue.toLocaleString()}`} color={B} trend={12} />
              <StatCard icon={Package} label="Productos" value={products?.length??0} sub={`${lowStock} bajo stock`} color={A} />
              <StatCard icon={ShoppingCart} label="Órdenes pendientes" value={pendingOrders} color="#FF6900" />
              <StatCard icon={Users} label="Usuarios" value={userStats?.total??0} sub={`${userStats?.agents??0} agentes activos`} color="#28a745" trend={8} />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-4">Ventas mensuales</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesData}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={B} stopOpacity={0.15}/><stop offset="95%" stopColor={B} stopOpacity={0}/>
                  </linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} />
                  <Tooltip formatter={(v:any,n:string)=>[n==="ingresos"?`$${v.toLocaleString()}`:v,n]} />
                  <Area type="monotone" dataKey="ingresos" stroke={B} fill="url(#g)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* PRODUCTOS */}
        {tab==="products" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar producto..." value={productSearch} onChange={e=>setProductSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-sm" />
              </div>
              <Button onClick={()=>setShowNewProduct(true)}
                className="h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 text-white" style={{background:B}}>
                <Plus className="w-4 h-4" /> Nuevo Producto
              </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Cat.</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                    <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                    <th className="p-4"></th>
                  </tr></thead>
                  <tbody>
                    {filteredProducts.map(p=>(
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                              {p.imageUrl
                                ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e=>{(e.target as any).style.display="none"}} />
                                : <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-gray-300" /></div>}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 line-clamp-1 max-w-[150px]">{p.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{p.model}</p>
                              {p.featured==="yes" && <span className="text-[9px] font-bold text-amber-600">⭐ Destacado</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{p.category}</span>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-sm font-bold text-gray-900">${Number(p.price).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <span className={`text-xs font-bold ${Number(p.stock)<5?"text-red-500":"text-gray-700"}`}>{p.stock}</span>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          {Number(p.stock)<5
                            ? <span className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 rounded-full">Bajo stock</span>
                            : <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-full">Disponible</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={()=>{
                              const parsed = {
                                ...p,
                                features: typeof p.features==="string" ? JSON.parse(p.features||"[]") : (p.features||[]),
                                specs: typeof p.specs==="string" ? JSON.parse(p.specs||"{}") : (p.specs||{}),
                              };
                              setEditProduct(parsed);
                            }}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={()=>setConfirmDelete({type:"product",id:p.id,name:p.name})}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length===0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-sm text-gray-400">No se encontraron productos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* USUARIOS */}
        {tab==="users" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar usuario..." value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all","client","agent","admin"].map(r=>(
                  <button key={r} onClick={()=>setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      roleFilter===r?"bg-[#1428A0] text-white":"bg-white text-gray-500 border border-gray-200"
                    }`}>
                    {r==="all"?"Todos":r==="client"?"Clientes":r==="agent"?"Agentes":"Admins"}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Registro</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u=>(
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{background:u.role==="admin"?R:u.role==="agent"?A:B}}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{u.name}</p>
                            <p className="text-[10px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-[10px] text-gray-400">
                          {u.createdAt?new Date(u.createdAt).toLocaleDateString("es-MX"):"—"}
                        </span>
                      </td>
                      <td className="p-4"><RoleBadge role={u.role} /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          {u.role==="client"&&u.id!==user?.id&&(
                            <button onClick={()=>approveAgent.mutate({userId:u.id})}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100">
                              <UserCheck className="w-3 h-3" />Hacer Agente
                            </button>
                          )}
                          {u.role==="agent"&&u.id!==user?.id&&(
                            <button onClick={()=>updateRole.mutate({userId:u.id,role:"client"})}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200">
                              <UserX className="w-3 h-3" />Quitar Agente
                            </button>
                          )}
                          {u.role!=="admin"&&u.id!==user?.id&&(
                            <button onClick={()=>updateRole.mutate({userId:u.id,role:"admin"})}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-[10px] font-bold hover:bg-red-100">
                              <ShieldCheck className="w-3 h-3" />Admin
                            </button>
                          )}
                          {u.id!==user?.id&&(
                            <button onClick={()=>setConfirmDelete({type:"user",id:u.id,name:u.name})}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length===0&&(
                    <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400">No se encontraron usuarios</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ÓRDENES */}
        {tab==="orders" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
                </tr></thead>
                <tbody>
                  {(orders||[]).map(o=>(
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 text-xs font-mono text-gray-500">#{o.id}</td>
                      <td className="p-4 text-sm font-bold">${Number(o.total).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          o.status==="delivered"?"bg-green-50 text-green-700":
                          o.status==="pending"?"bg-amber-50 text-amber-700":
                          o.status==="cancelled"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700"
                        }`}>{o.status}</span>
                      </td>
                      <td className="p-4 text-xs text-gray-400 hidden md:table-cell">
                        {o.createdAt?new Date(o.createdAt).toLocaleDateString("es-MX"):"—"}
                      </td>
                    </tr>
                  ))}
                  {!(orders?.length)&&(
                    <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-400">No hay órdenes todavía</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* AGENTES */}
        {tab==="agents" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">{agents?.length??0} agentes registrados</p>
              <Button onClick={()=>setShowNewAgent(true)}
                className="h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 text-white" style={{background:B}}>
                <Plus className="w-4 h-4" /> Agregar Agente
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agents||[]).map(a=>(
                <motion.div key={a.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                        {a.name?.charAt(0)??"A"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{a.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">{a.code}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      a.status==="online"?"bg-green-50 text-green-700":
                      a.status==="busy"?"bg-amber-50 text-amber-700":"bg-gray-100 text-gray-500"
                    }`}>{a.status}</span>
                  </div>
                  {a.specialty && <p className="text-xs text-gray-500 mb-1">📋 {a.specialty}</p>}
                  {a.phone && <p className="text-xs text-gray-500 mb-3">📱 {a.phone}</p>}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-gray-900">${Number(a.totalSales||0).toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400">Ventas totales</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-black text-blue-700">${Number(a.commission||0).toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400">Comisiones</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {["online","busy","offline"].map(s=>(
                      <button key={s} onClick={()=>updateStatus.mutate({id:a.id,status:s as any})}
                        disabled={a.status===s}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-colors ${
                          a.status===s?"bg-[#1428A0] text-white":"bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>{s}</button>
                    ))}
                  </div>
                </motion.div>
              ))}
              {!(agents?.length)&&(
                <div className="col-span-3 p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                  <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-3">No hay agentes registrados</p>
                  <Button onClick={()=>setShowNewAgent(true)} className="text-white text-xs rounded-xl" style={{background:B}}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />Agregar primer agente
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* ══ MODAL: Nuevo Producto ══ */}
      <AnimatePresence>
        {showNewProduct&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e=>e.target===e.currentTarget&&setShowNewProduct(false)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-black text-gray-900">Nuevo Producto</p>
                <button onClick={()=>setShowNewProduct(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ProductForm onSave={handleSaveNew} onCancel={()=>setShowNewProduct(false)} saving={createProduct.isPending} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Editar Producto ══ */}
      <AnimatePresence>
        {editProduct&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e=>e.target===e.currentTarget&&setEditProduct(null)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-black text-gray-900">Editar Producto</p>
                <button onClick={()=>setEditProduct(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ProductForm initial={editProduct} onSave={handleSaveEdit} onCancel={()=>setEditProduct(null)} saving={updateProduct.isPending} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Nuevo Agente ══ */}
      <AnimatePresence>
        {showNewAgent&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e=>e.target===e.currentTarget&&setShowNewAgent(false)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-base font-black text-gray-900">Agregar Agente</p>
                  <p className="text-xs text-gray-400 mt-0.5">Promueve un cliente o registra un agente nuevo</p>
                </div>
                <button onClick={()=>setShowNewAgent(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <AgentForm users={userList} onSave={handleSaveAgent} onCancel={()=>setShowNewAgent(false)} saving={approveAgent.isPending} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL: Confirmar eliminación ══ */}
      <AnimatePresence>
        {confirmDelete&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-base font-black text-gray-900 mb-2">¿Confirmar eliminación?</p>
              <p className="text-sm text-gray-500 mb-5">
                Se eliminará <strong>{confirmDelete.name}</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={()=>setConfirmDelete(null)} className="flex-1 rounded-xl">Cancelar</Button>
                <Button onClick={()=>{
                    if(confirmDelete.type==="product") deleteProduct.mutate({id:confirmDelete.id});
                    else deleteUser.mutate({userId:confirmDelete.id});
                  }}
                  disabled={deleteProduct.isPending||deleteUser.isPending}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                  {deleteProduct.isPending||deleteUser.isPending?"Eliminando...":"Eliminar"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
