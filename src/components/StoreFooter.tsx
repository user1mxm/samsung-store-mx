import { Link } from 'react-router';
import { ArrowUpRight, ArrowRight, Box, ShieldCheck, ScanLine } from 'lucide-react';

type Props = { user?: {role?: string; name?: string} | null; isAuthenticated: boolean; onLogout: () => void; onExplore: () => void; onTechnology: () => void };
export default function StoreFooter({user,isAuthenticated,onLogout,onExplore,onTechnology}: Props) {
  return <footer className="store-footer" aria-label="Información de la tienda">
    <div className="footer-inner">
      <section className="footer-invitation" aria-labelledby="footer-title">
        <div><p className="footer-eyebrow">TU PRÓXIMA PANTALLA, CON MÁS PERSPECTIVA</p><h2 id="footer-title">Elige el detalle.<br/><span>Encuentra tu Samsung.</span></h2><p>Compara modelos, explora sus ángulos y descubre la unidad que encaja contigo.</p></div>
        <button className="footer-explore" onClick={onExplore}>Explorar modelos <ArrowRight size={18}/></button>
      </section>
      <div className="footer-highlights">
        <div><ScanLine size={20}/><span><strong>Exploración 360°</strong><small>Diseño desde todos los ángulos</small></span></div>
        <div><Box size={20}/><span><strong>Información por unidad</strong><small>Estado, accesorios y disponibilidad</small></span></div>
        <div><ShieldCheck size={20}/><span><strong>Tu cuenta, conectada</strong><small>Pedidos y seguimiento de posventa</small></span></div>
      </div>
      <div className="footer-grid">
        <div className="footer-brand"><Link to="/" aria-label="Samsung Store MX, inicio"><img src="/logo-samsung-mx.png" alt="" width="44" height="44" loading="lazy"/><span>SAMSUNG<small>STORE MX</small></span></Link><p>Diseño, tecnología y una forma más clara de elegir tu pantalla.</p><span className="footer-region">México <span>·</span> Precios en MXN</span></div>
        <nav aria-label="Explorar tienda"><h3>Descubre</h3><button onClick={onExplore}>Catálogo de modelos <ArrowUpRight size={14}/></button><button onClick={onTechnology}>Tecnología Samsung <ArrowUpRight size={14}/></button><Link to="/mi-red">Programa de embajadores</Link></nav>
        <nav aria-label="Cuenta y soporte"><h3>Tu experiencia</h3><Link to="/mi-cuenta">Mi cuenta y posventa</Link><Link to="/mis-pedidos">Mis pedidos</Link>{isAuthenticated?<button onClick={onLogout}>Cerrar sesión</button>:<Link to="/login">Iniciar sesión</Link>}</nav>
        <div className="footer-access"><h3>Gestión de tienda</h3><Link className="footer-admin" to={user?.role==='admin'?'/admin':'/login/admin'}>Panel Admin <ArrowUpRight size={15}/></Link>{user?.role==='admin'&&<Link to="/admin/operaciones">Control maestro</Link>}{user?.role==='agent'&&<Link to="/agent">Portal de agente</Link>}<p>Acceso para cuentas autorizadas.</p></div>
      </div>
      <details className="footer-conditions"><summary>Información de compra y seguimiento</summary><p>Consulta en la ficha de cada unidad su estado, accesorios y garantía aplicable. La entrega y la instalación dependen de la zona y las opciones disponibles al confirmar el pedido. Para dar seguimiento a una compra, entra en Mi cuenta y posventa.</p></details>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} Samsung Store MX.</p><span>Diseñado para descubrir. Hecho para elegir.</span><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>Volver arriba ↑</button></div>
    </div>
  </footer>;
}
