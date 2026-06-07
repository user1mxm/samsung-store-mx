// Samsung Store MX — Seed con productos 2025/2026 reales
// Precios basados en samsung.com/mx, Costco MX, Xataka MX (junio 2026)
import { getDb } from "../api/queries/connection";
import { products, categories, users, agents } from "./schema";

async function seed() {
  const db = getDb();

  /* ── Categorías ── */
  const cats = [
    { name: "OLED 2025",        slug: "oled"       },
    { name: "Neo QLED 4K",      slug: "neo-qled"   },
    { name: "Neo QLED 8K",      slug: "neo-qled-8k"},
    { name: "The Frame Pro",    slug: "frame"       },
    { name: "Odyssey Gaming",   slug: "gaming"      },
    { name: "Crystal UHD",      slug: "crystal"     },
  ];
  for (const c of cats) {
    await db.insert(categories).values(c).onDuplicateKeyUpdate({ set: c });
  }

  /* ── Productos Samsung 2025-2026 con precios reales MXN ── */
  const prods = [

    /* ════ OLED S95F — Línea flagship OLED 2025 ════ */
    {
      name: 'Samsung S95F OLED 65" 2025',
      model: "QN65S95FAFXZX",
      category: "oled",
      price: "59999",
      imageUrl: "https://images.samsung.com/mx/tvs/oled-tv/s95f-65-inch-oled-4k-vision-ai-smart-tv-qn65s95fafxzx/QN65S95FAFXZX_001_Front_Titan-Black.jpg",
      description: "El OLED más brillante y con mejor contraste de Samsung. QD-OLED con Glare Free, procesador NQ4 AI Gen3 con 128 redes neuronales, Motion Xcelerator 165Hz exclusivo. Ideal para cine, gaming y salas iluminadas.",
      features: JSON.stringify(["4K QD-OLED","Glare Free antirreflejos","NQ4 AI Gen3 — 128 redes neuronales","Motion Xcelerator 165Hz","OLED HDR Pro","FreeSync Premium Pro + G-Sync","Dolby Atmos 4.2.2ch 70W","One UI Tizen 10 — 7 años actualizaciones","Wi-Fi 6E · Bluetooth 5.2","AI Auto Game Mode"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "QD-OLED (Quantum Dot OLED)",
        "Procesador":       "NQ4 AI Gen3 (128 redes neuronales)",
        "Tasa de refresco": "165Hz (VRR 1–165Hz)",
        "HDR":              "OLED HDR Pro, HDR10+, HLG",
        "Antirreflejos":    "Glare Free",
        "Audio":            "Dolby Atmos, OTS+, 4.2.2ch 70W",
        "Gaming":           "FreeSync Premium Pro, G-Sync, VRR, ALLM, 0.1ms",
        "Smart TV":         "One UI / Tizen 10, Samsung TV Plus, Gaming Hub",
        "Conectividad":     "4× HDMI 2.1, USB 3.0×2, Wi-Fi 6E, BT 5.2",
        "Diseño":           "Infinity One, 10.9mm profundidad",
        "Dimensiones":      "144.4 × 83.0 × 2.6 cm (sin base)",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.9",
      stock: 8,
      featured: "yes" as const,
    },
    {
      name: 'Samsung S95F OLED 55" 2025',
      model: "QN55S95FAFXZX",
      category: "oled",
      price: "44999",
      imageUrl: "https://images.samsung.com/mx/tvs/oled-tv/s95f-55-inch-oled-4k-vision-ai-smart-tv-qn55s95fafxzx/QN55S95FAFXZX_001_Front_Titan-Black.jpg",
      description: "La S95F en 55 pulgadas: misma potencia OLED QD, Glare Free y 165Hz en un formato perfecto para recámaras y estudios. Procesador NQ4 AI Gen3 con escalado 4K AI Pro.",
      features: JSON.stringify(["4K QD-OLED","Glare Free","NQ4 AI Gen3","165Hz VRR","OLED HDR Pro","FreeSync Pro + G-Sync","Dolby Atmos 4.2.2ch 60W","One UI Tizen 10"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "QD-OLED",
        "Procesador":       "NQ4 AI Gen3",
        "Tasa de refresco": "165Hz",
        "HDR":              "OLED HDR Pro, HDR10+",
        "Audio":            "Dolby Atmos, 4.2.2ch 60W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6E, BT 5.2",
        "Dimensiones":      "122.5 × 70.9 × 2.6 cm (sin base)",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.8",
      stock: 12,
      featured: "yes" as const,
    },
    {
      name: 'Samsung S95F OLED 83" 2025',
      model: "QN83S95FAEXZX",
      category: "oled",
      price: "109999",
      imageUrl: "https://images.samsung.com/mx/tvs/oled-tv/s95f-83-inch-oled-4k-vision-ai-smart-tv-qn83s95faexzx/QN83S95FAEXZX_001_Front_Titan-Black.jpg",
      description: "El OLED más grande de Samsung en 83 pulgadas. Experiencia cinematográfica total con QD-OLED, Glare Free, 165Hz y OLED HDR Pro. Para salas de cine en casa de alto nivel.",
      features: JSON.stringify(["4K QD-OLED 83\"","Glare Free","NQ4 AI Gen3","165Hz","OLED HDR Pro","Dolby Atmos 4.2.2ch 80W","One UI Tizen 10"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "QD-OLED",
        "Procesador":       "NQ4 AI Gen3",
        "Tasa de refresco": "165Hz",
        "HDR":              "OLED HDR Pro, HDR10+",
        "Audio":            "Dolby Atmos, 4.2.2ch 80W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6E, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.9",
      stock: 4,
      featured: "yes" as const,
    },

    /* ════ S90F — OLED mid-range 2025 ════ */
    {
      name: 'Samsung S90F OLED 65" 2025',
      model: "QN65S90FAFXZX",
      category: "oled",
      price: "39999",
      imageUrl: "https://images.samsung.com/mx/tvs/oled-tv/s90f-65-inch-oled-4k-smart-tv-qn65s90fafxzx/QN65S90FAFXZX_001_Front_Graphite-Black.jpg",
      description: "OLED 4K con procesador NQ4 AI Gen3, 144Hz y OLED HDR+. La mejor relación precio-desempeño en OLED Samsung 2025. Ideal para quienes quieren calidad OLED sin llegar al flagship.",
      features: JSON.stringify(["4K OLED","NQ4 AI Gen3","Motion Xcelerator 144Hz","OLED HDR+","FreeSync Premium Pro","Dolby Atmos 2.2.2ch 60W","One UI Tizen 10","AI Upscaling Pro"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "OLED",
        "Procesador":       "NQ4 AI Gen3",
        "Tasa de refresco": "144Hz (VRR)",
        "HDR":              "OLED HDR+, HDR10+",
        "Audio":            "Dolby Atmos, 2.2.2ch 60W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.7",
      stock: 15,
      featured: "yes" as const,
    },
    {
      name: 'Samsung S90F OLED 55" 2025',
      model: "QN55S90FAFXZX",
      category: "oled",
      price: "29999",
      imageUrl: "https://images.samsung.com/mx/tvs/oled-tv/s90f-55-inch-oled-4k-smart-tv-qn55s90fafxzx/QN55S90FAFXZX_001_Front_Graphite-Black.jpg",
      description: "OLED 4K 55 pulgadas con NQ4 AI Gen3 y 144Hz. Perfecta para recámaras y espacios medianos. Negros profundos y colores vibrantes OLED a precio accesible.",
      features: JSON.stringify(["4K OLED","NQ4 AI Gen3","144Hz","OLED HDR+","FreeSync Premium Pro","Dolby Atmos 60W","One UI Tizen 10"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "OLED",
        "Procesador":       "NQ4 AI Gen3",
        "Tasa de refresco": "144Hz",
        "HDR":              "OLED HDR+, HDR10+",
        "Audio":            "Dolby Atmos, 2.2.2ch 60W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.7",
      stock: 18,
      featured: "no" as const,
    },

    /* ════ Neo QLED QN90F — Premium Mini LED 2025 ════ */
    {
      name: 'Samsung QN90F Neo QLED 75" 2025',
      model: "QN75QN90FAFXZX",
      category: "neo-qled",
      price: "34999",
      imageUrl: "https://images.samsung.com/mx/tvs/qled-tv/qn90f-75-inch-neo-qled-4k-vision-ai-smart-tv-qn75qn90fafxzx/QN75QN90FAFXZX_001_Front_Titan-Black.jpg",
      description: "Neo QLED 4K con Quantum Mini LED Pro, procesador NQ4 AI Gen3, 165Hz nativos y Glare Free. El mejor Mini LED Samsung para gaming y deportes en 75 pulgadas. Precio especial Costco MX.",
      features: JSON.stringify(["4K Neo QLED — Mini LED Pro","Glare Free","NQ4 AI Gen3","165Hz nativos","Neo Quantum HDR+","FreeSync Premium Pro","Dolby Atmos OTS+","Vision AI","One UI Tizen 10","Smart Calibration"]),
      specs: JSON.stringify({
        "Resolución":           "3,840 × 2,160 (4K UHD)",
        "Retroiluminación":     "Quantum Mini LED Pro",
        "Procesador":           "NQ4 AI Gen3",
        "Tasa de refresco":     "165Hz (VRR 48–165Hz)",
        "HDR":                  "Neo Quantum HDR+, HDR10+ Adaptive",
        "Antirreflejos":        "Glare Free",
        "Audio":                "Dolby Atmos, OTS+, Q-Symphony, 4.2.2ch 70W",
        "Gaming":               "FreeSync Premium Pro, VRR, ALLM, 1ms",
        "Smart TV":             "One UI / Tizen 10, Gaming Hub, Samsung TV Plus",
        "Conectividad":         "4× HDMI 2.1, USB 3.0×2, Wi-Fi 6, BT 5.2",
        "Garantía":             "1 año oficial Samsung México",
      }),
      rating: "4.8",
      stock: 20,
      featured: "yes" as const,
    },
    {
      name: 'Samsung QN90F Neo QLED 65" 2025',
      model: "QN65QN90FAFXZX",
      category: "neo-qled",
      price: "27999",
      imageUrl: "https://images.samsung.com/mx/tvs/qled-tv/qn90f-65-inch-neo-qled-4k-vision-ai-smart-tv-qn65qn90fafxzx/QN65QN90FAFXZX_001_Front_Titan-Black.jpg",
      description: "Neo QLED 65\" con Mini LED Pro, 165Hz, Glare Free y NQ4 AI Gen3. La opción Neo QLED premium más popular para sala de TV.",
      features: JSON.stringify(["Mini LED Pro","Glare Free","NQ4 AI Gen3","165Hz","Neo Quantum HDR+","FreeSync Pro","Dolby Atmos 70W"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160",
        "Retroiluminación": "Quantum Mini LED Pro",
        "Procesador":       "NQ4 AI Gen3",
        "Refresco":         "165Hz VRR",
        "HDR":              "Neo Quantum HDR+",
        "Audio":            "Dolby Atmos 4.2.2ch 70W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.7",
      stock: 25,
      featured: "yes" as const,
    },

    /* ════ Neo QLED QN85F — 2025 ════ */
    {
      name: 'Samsung QN85F Neo QLED 65" 2025',
      model: "QN65QN85FAFXZX",
      category: "neo-qled",
      price: "22999",
      imageUrl: "https://images.samsung.com/mx/tvs/qled-tv/q85f-65-inch-neo-qled-4k-vision-ai-smart-tv-qn65qn85fafxzx/QN65QN85FAFXZX_001_Front_Titan-Black.jpg",
      description: "Neo QLED 4K 65\" con Quantum Mini LED Pro, 144Hz y HDR10+ Adaptive. La entrada al ecosistema Neo QLED premium con Vision AI. Excelente relación precio-calidad 2025.",
      features: JSON.stringify(["Mini LED Pro","NQ4 AI Gen3","144Hz","Neo Quantum HDR+","FreeSync Premium","Dolby Atmos 60W","One UI Tizen 10","Samsung Vision AI"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160",
        "Retroiluminación": "Quantum Mini LED Pro",
        "Procesador":       "NQ4 AI Gen3",
        "Refresco":         "144Hz VRR",
        "HDR":              "Neo Quantum HDR+, HDR10+ Adaptive",
        "Audio":            "Dolby Atmos, 2.2.2ch 60W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.6",
      stock: 22,
      featured: "no" as const,
    },
    {
      name: 'Samsung QN85F Neo QLED 55" 2025',
      model: "QN55QN85FAFXZX",
      category: "neo-qled",
      price: "17999",
      imageUrl: "https://images.samsung.com/mx/tvs/qled-tv/q85f-65-inch-neo-qled-4k-vision-ai-smart-tv-qn65qn85fafxzx/QN65QN85FAFXZX_001_Front_Titan-Black.jpg",
      description: "Neo QLED 55\" con Mini LED Pro. Desde $17,999 MXN — el precio de entrada más accesible a la tecnología Mini LED de Samsung con procesador NQ4 AI Gen3.",
      features: JSON.stringify(["Mini LED Pro","NQ4 AI Gen3","144Hz","Neo Quantum HDR+","FreeSync Premium","Dolby Atmos","Samsung Vision AI"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160",
        "Retroiluminación": "Quantum Mini LED Pro",
        "Procesador":       "NQ4 AI Gen3",
        "Refresco":         "144Hz",
        "HDR":              "Neo Quantum HDR+",
        "Audio":            "Dolby Atmos, 2ch 40W",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 5, BT 5.0",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.5",
      stock: 30,
      featured: "no" as const,
    },

    /* ════ Neo QLED 8K QN990F 2025 ════ */
    {
      name: 'Samsung QN990F Neo QLED 8K 65" 2025',
      model: "QN65QN990FAFXZX",
      category: "neo-qled-8k",
      price: "79999",
      imageUrl: "https://images.samsung.com/mx/tvs/neo-qled-tv/qn990f-65-inch-neo-qled-8k-smart-tv-qn65qn990fafxzx/QN65QN990FAFXZX_001_Front_Titan-Black.jpg",
      description: "La cúspide de la tecnología Samsung: Neo QLED 8K con procesador NQ8 AI Gen3, 240Hz y Dolby Atmos 6.2.4ch 90W. Para quienes exigen lo mejor en imagen y sonido.",
      features: JSON.stringify(["8K Neo QLED","NQ8 AI Gen3 — 512 redes neuronales","240Hz","Neo Quantum HDR 8K","Dolby Atmos 6.2.4ch 90W","Wireless One Connect Box","One UI Tizen 10"]),
      specs: JSON.stringify({
        "Resolución":       "7,680 × 4,320 (8K UHD)",
        "Retroiluminación": "Quantum Mini LED (Neo QLED)",
        "Procesador":       "NQ8 AI Gen3 (512 redes neuronales)",
        "Refresco":         "240Hz",
        "HDR":              "Neo Quantum HDR 8K, HDR10+",
        "Audio":            "Dolby Atmos, 6.2.4ch 90W, Q-Symphony Pro",
        "Conectividad":     "4× HDMI 2.1, Wi-Fi 6E, BT 5.2",
        "One Connect":      "Wireless One Connect Box incluido",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.9",
      stock: 5,
      featured: "yes" as const,
    },

    /* ════ The Frame Pro LS03FW 2025 ════ */
    {
      name: 'Samsung The Frame Pro 65" LS03FW 2025',
      model: "QN65LS03FWFXZX",
      category: "frame",
      price: "29999",
      imageUrl: "https://images.samsung.com/mx/lifestyle-tvs/the-frame/ls03fw-65-inch-black-qn65ls03fwfxzx/QN65LS03FWFXZX_001_Front_Black.jpg",
      description: "The Frame Pro 2025: Neo QLED 4K con modo Arte, conexión inalámbrica One Connect a 30 pies, pantalla mate anti-reflejo, marcos personalizables y Samsung Vision AI. Arte y tecnología en perfecta armonía.",
      features: JSON.stringify(["Neo QLED 4K","Art Mode — 2,000+ obras Art Store","Pantalla mate anti-reflejo","Wireless One Connect (hasta 9m)","Marcos personalizables (6 colores)","NQ4 AI Gen3","Samsung Vision AI","One UI Tizen 10","Sensor de movimiento"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "Neo QLED (Mini LED)",
        "Procesador":       "NQ4 AI Gen3",
        "Refresco":         "120Hz",
        "HDR":              "Neo Quantum HDR+, HDR10+",
        "Pantalla":         "Mate anti-reflejo",
        "Audio":            "Dolby Atmos, 2.2.2ch 60W",
        "One Connect":      "Wireless a 9 metros incluido",
        "Art Store":        "2,000+ obras de arte disponibles",
        "Conectividad":     "3× HDMI 2.0, Wi-Fi 6, BT 5.2",
        "Profundidad":      "24.9mm con base plana (cuelga como cuadro)",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.8",
      stock: 10,
      featured: "yes" as const,
    },
    {
      name: 'Samsung The Frame Pro 75" LS03FW 2025',
      model: "QN75LS03FWFXZX",
      category: "frame",
      price: "44999",
      imageUrl: "https://images.samsung.com/mx/lifestyle-tvs/the-frame/ls03fw-75-inch-black-qn75ls03fwfxzx/QN75LS03FWFXZX_001_Front_Black.jpg",
      description: "The Frame Pro 75 pulgadas: la galería de arte más grande de tu hogar. Neo QLED, conexión inalámbrica y marcos personalizables en el formato ideal para salas amplias.",
      features: JSON.stringify(["Neo QLED 4K 75\"","Art Mode","Wireless One Connect 9m","Marcos personalizables","NQ4 AI Gen3","Samsung Vision AI","Pantalla mate"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160",
        "Panel":            "Neo QLED Mini LED",
        "Procesador":       "NQ4 AI Gen3",
        "Refresco":         "120Hz",
        "HDR":              "Neo Quantum HDR+",
        "Audio":            "Dolby Atmos, 60W",
        "Conectividad":     "3× HDMI 2.0, Wi-Fi 6, BT 5.2",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.8",
      stock: 7,
      featured: "no" as const,
    },

    /* ════ Odyssey OLED G8 — Monitor gaming 2025 ════ */
    {
      name: 'Samsung Odyssey OLED G8 32" 240Hz 2025',
      model: "LS32FG810SLXZX",
      category: "gaming",
      price: "24999",
      imageUrl: "https://images.samsung.com/mx/monitors/gaming/odyssey-oled-g8-g81sf-32-inch-240hz-oled-uhd-ls32fg810slxzx/LS32FG810SLXZX_001_Front_Black.jpg",
      description: "Monitor gaming OLED 4K 32 pulgadas con 240Hz de refresco, tiempo de respuesta 0.03ms y DisplayHDR True Black 400. Para gaming profesional y diseño gráfico de alto nivel.",
      features: JSON.stringify(["4K OLED 32\"","240Hz","0.03ms GTG","DisplayHDR True Black 400","FreeSync Premium Pro","G-Sync compatible","USB-C 90W Power Delivery","Smart Monitor — Tizen OS","Samsung Gaming Hub"]),
      specs: JSON.stringify({
        "Resolución":       "3,840 × 2,160 (4K UHD)",
        "Panel":            "QD-OLED",
        "Refresco":         "240Hz (VRR 48–240Hz)",
        "Respuesta":        "0.03ms (GtG)",
        "HDR":              "DisplayHDR True Black 400, HDR10+",
        "Conectividad":     "HDMI 2.1, DisplayPort 1.4, USB-C 90W, USB Hub",
        "Smart":            "Tizen OS, Gaming Hub, Samsung TV Plus",
        "Ergonomía":        "Pivote, inclinación, giro, altura ajustable",
        "Garantía":         "1 año oficial Samsung México",
      }),
      rating: "4.9",
      stock: 8,
      featured: "yes" as const,
    },

    /* ════ Crystal UHD DU8000 — Entrada 4K 2025 ════ */
    {
      name: 'Samsung DU8000 Crystal UHD 65" 2025',
      model: "UN65DU8000FXZX",
      category: "crystal",
      price: "13999",
      imageUrl: "https://images.samsung.com/mx/tvs/crystal-uhd/du8000-65-inch-crystal-uhd-4k-smart-tizen-tv-un65du8000fxzx/UN65DU8000FXZX_001_Front_Titan-Gray.jpg",
      description: "La puerta de entrada al 4K Samsung. Crystal UHD con procesador Crystal 4K, PurColor y Motion Xcelerator. Tizen OS completo con Samsung TV Plus y SmartThings.",
      features: JSON.stringify(["4K Crystal UHD","Crystal Processor 4K","PurColor","Motion Xcelerator 120","HDR10+","Samsung TV Plus — 2,700+ canales gratis","SmartThings","Tizen 8","AirPlay 2"]),
      specs: JSON.stringify({
        "Resolución":   "3,840 × 2,160 (4K UHD)",
        "Procesador":   "Crystal Processor 4K",
        "Refresco":     "120Hz (Motion Xcelerator)",
        "HDR":          "HDR10+, HLG",
        "Audio":        "Dolby Digital Plus, 2ch 20W",
        "Smart TV":     "Tizen 8, Samsung TV Plus, SmartThings",
        "Conectividad": "3× HDMI, 2× USB, Wi-Fi 5, BT 4.2",
        "Garantía":     "1 año oficial Samsung México",
      }),
      rating: "4.4",
      stock: 35,
      featured: "no" as const,
    },
    {
      name: 'Samsung DU8000 Crystal UHD 75" 2025',
      model: "UN75DU8000FXZX",
      category: "crystal",
      price: "19999",
      imageUrl: "https://images.samsung.com/mx/tvs/crystal-uhd/du8000-65-inch-crystal-uhd-4k-smart-tizen-tv-un65du8000fxzx/UN65DU8000FXZX_001_Front_Titan-Gray.jpg",
      description: "Crystal UHD 75 pulgadas — la opción más económica para pantallas grandes Samsung. 4K, Tizen OS y Samsung TV Plus con más de 2,700 canales gratis.",
      features: JSON.stringify(["4K Crystal UHD 75\"","Crystal Processor 4K","PurColor","Motion Xcelerator","HDR10+","Samsung TV Plus","SmartThings"]),
      specs: JSON.stringify({
        "Resolución":   "3,840 × 2,160",
        "Procesador":   "Crystal Processor 4K",
        "Refresco":     "120Hz",
        "HDR":          "HDR10+",
        "Audio":        "2ch 20W",
        "Conectividad": "3× HDMI, Wi-Fi 5",
        "Garantía":     "1 año oficial Samsung México",
      }),
      rating: "4.3",
      stock: 28,
      featured: "no" as const,
    },
  ];

  console.log(`\nInsertando ${prods.length} productos Samsung 2025-2026...\n`);
  for (const p of prods) {
    process.stdout.write(`  → ${p.name}...`);
    await db.insert(products).values(p).onDuplicateKeyUpdate({ set: p });
    console.log(" ✓");
  }

  /* ── Admin ── */
  await db.insert(users).values({
    name: "Administrador Samsung Store",
    email: "admin@samsungstore.com.mx",
    role: "admin",
    password: "e459669155814fc0d0a3e58806aef641ae3c2ac4723838af1cb6ea8b1a1b43ef", // Samsung2026!
  }).onDuplicateKeyUpdate({ set: { name: "Administrador Samsung Store", role: "admin" } });

  /* ── Agentes ── */
  for (const a of [
    { name:"Carlos Mendez",    email:"carlos.mendez@samsungstore.mx",    code:"AGENT-001", specialty:"OLED y Neo QLED Premium", phone:"+52 55 1234 5678" },
    { name:"Ana Laura García", email:"ana.garcia@samsungstore.mx",        code:"AGENT-002", specialty:"Gaming y The Frame Pro",  phone:"+52 33 9876 5432" },
    { name:"Roberto Sánchez",  email:"roberto.sanchez@samsungstore.mx",   code:"AGENT-003", specialty:"Neo QLED 8K y Crystal",   phone:"+52 81 5555 1234" },
  ]) {
    const res = await db.insert(users).values({ name:a.name, email:a.email, role:"agent", password:null })
      .onDuplicateKeyUpdate({ set:{ name:a.name } });
    const id = Number((res as any).insertId);
    if (id) {
      await db.insert(agents).values({ userId:id, code:a.code, specialty:a.specialty, phone:a.phone, status:"online" })
        .onDuplicateKeyUpdate({ set:{ status:"online" } });
    }
  }

  console.log(`\n✅ Seed completado:`);
  console.log(`   ${cats.length} categorías`);
  console.log(`   ${prods.length} productos Samsung 2025-2026 con precios reales MXN`);
  console.log(`   admin@samsungstore.com.mx`);
  console.log(`   3 agentes`);
  console.log(`\n   Abre https://samsungstore.com.mx\n`);
}

seed().catch(e => { console.error("❌", e.message); process.exit(1); });
