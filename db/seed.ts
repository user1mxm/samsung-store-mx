import { getDb } from "../api/queries/connection";
import { products, categories, users, agents } from "./schema";

async function seed() {
  const db = getDb();

  const cats = [
    { name: "OLED 2024", slug: "oled" },
    { name: "Neo QLED 4K", slug: "neo-qled" },
    { name: "The Frame", slug: "frame" },
    { name: "Odyssey Gaming", slug: "gaming" },
    { name: "Crystal UHD", slug: "crystal" },
  ];
  for (const c of cats) {
    await db.insert(categories).values(c).onDuplicateKeyUpdate({ set: c });
  }

  const prods = [
    {
      name: "Samsung S95D OLED 65\"",
      model: "QN65S95DAFXZA",
      category: "oled",
      price: "47999",
      imageUrl: "/tv-s95d-real.jpg",
      description: "OLED 4K con tecnologia Glare Free. Procesador NQ4 AI Gen2 con AI Upscaling. Pantalla anti-reflejo que elimina el deslumbramiento. Negros perfectos con brillo OLED HDR Pro. Motion Xcelerator 144Hz para gaming.",
      features: JSON.stringify(["4K OLED", "Glare Free", "NQ4 AI Gen2", "OLED HDR Pro", "Motion Xcelerator 144Hz", "Dolby Atmos", "OTS+", "Tizen OS"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Tasa Refresco": "144Hz (VRR, ALLM)",
        "HDR": "OLED HDR Pro, HDR10+, HLG",
        "Audio": "Dolby Atmos, Object Tracking Sound+",
        "Smart TV": "Tizen OS 2024, SmartThings",
        "Conectividad": "4x HDMI 2.1, WiFi 6E, Bluetooth 5.2",
        "Gaming": "FreeSync Premium Pro, HGiG, 1ms",
        "Diseno": "Infinity One Design, 11mm profundidad",
        "Peso": "18.6 kg con base"
      }),
      rating: "4.9",
      stock: 8,
      featured: "yes" as const,
    },
    {
      name: "Samsung S90D OLED 55\"",
      model: "QN55S90DAFXZA",
      category: "oled",
      price: "29999",
      imageUrl: "/tv-s95d-real.jpg",
      description: "OLED 4K con brillo impresionante y colores vibrantes. Procesador NQ4 AI Gen2. Pantalla OLED con negros perfectos. Motion Xcelerator 144Hz. Perfecto para cine y gaming en espacios medianos.",
      features: JSON.stringify(["4K OLED", "NQ4 AI Gen2", "Motion Xcelerator 144Hz", "OLED HDR+", "Dolby Atmos", "OTS Lite", "Tizen OS"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Tasa Refresco": "144Hz (VRR 48-144Hz)",
        "HDR": "OLED HDR+, HDR10+, HLG",
        "Audio": "Dolby Atmos, OTS Lite 2.0ch 40W",
        "Smart TV": "Tizen OS 2024, AI Vision",
        "Conectividad": "4x HDMI 2.1, WiFi 6E",
        "Gaming": "FreeSync Premium Pro, ALLM, 1ms",
        "Diseno": "LaserSlim Design, bezel metalico",
        "Peso": "15.4 kg con base"
      }),
      rating: "4.8",
      stock: 12,
      featured: "yes" as const,
    },
    {
      name: "Samsung QN90D Neo QLED 75\"",
      model: "QN75QN90DAFXZA",
      category: "neo-qled",
      price: "54999",
      imageUrl: "/tv-neo-real.jpg",
      description: "Neo QLED 4K con Mini LED y tecnologia Quantum Matrix. NQ4 AI Gen2 con upscaling automatico. Pantalla anti-reflejo para cualquier ambiente. Motion Xcelerator 144Hz para gaming.",
      features: JSON.stringify(["4K Neo QLED", "Mini LED", "Quantum Matrix", "NQ4 AI Gen2", "Motion Xcelerator 144Hz", "Quantum HDR+", "OTS+"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Retroiluminacion": "Mini LED Quantum Matrix",
        "HDR": "Quantum HDR+, HDR10+ Adaptive",
        "Audio": "OTS+, Dolby Atmos, Q-Symphony",
        "Smart TV": "Tizen OS 2024, SmartThings Hub",
        "Conectividad": "4x HDMI 2.1, WiFi 6, BT 5.2",
        "Gaming": "Motion Xcelerator 144Hz, VRR, ALLM",
        "Diseno": "Infinity Air Design, cable-free",
        "Peso": "32.1 kg con base"
      }),
      rating: "4.7",
      stock: 15,
      featured: "yes" as const,
    },
    {
      name: "Samsung The Frame 65\" 2024",
      model: "QN65LS03DAFXZA",
      category: "frame",
      price: "39999",
      imageUrl: "/tv-frame-real.jpg",
      description: "El TV que se convierte en arte. Pantalla mate anti-reflejo con Art Store de 2,000+ obras. Bezel personalizable. One Connect Box para cableado limpio. Modo Arte cuando no lo usas.",
      features: JSON.stringify(["4K QLED Art TV", "Pantalla mate anti-reflejo", "Art Store 2000+", "One Connect Box", "Bezel personalizable", "Modo Arte"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Tasa Refresco": "120Hz",
        "HDR": "Quantum HDR, HDR10+",
        "Audio": "OTS Lite, Dolby Atmos",
        "Smart TV": "Tizen OS, Art Store, Ambient Mode+",
        "Conectividad": "One Connect Box, WiFi 6E",
        "Diseno": "Customizable bezels, 24.9mm depth",
        "Incluye": "Bezel blanco + One Connect cable",
        "Peso": "19.8 kg con base"
      }),
      rating: "4.8",
      stock: 10,
      featured: "yes" as const,
    },
    {
      name: "Odyssey OLED G9 49\"",
      model: "LS49CG954SNXGO",
      category: "gaming",
      price: "34999",
      imageUrl: "/tv-odyssey-real.jpg",
      description: "Monitor gaming super-ultrawide 49\" con Dual QHD 5120x1440. QD-OLED con 240Hz y 0.03ms. Curvatura 1800R inmersiva. DisplayHDR True Black 400. Tizen OS con Gaming Hub integrado.",
      features: JSON.stringify(["Dual QHD OLED", "240Hz", "0.03ms GTG", "DisplayHDR True Black 400", "1800R Curved", "Tizen Smart", "Gaming Hub"]),
      specs: JSON.stringify({
        "Resolucion": "5,120 x 1,440 (Dual QHD)",
        "Panel": "QD-OLED 32:9 Super-Ultrawide",
        "Tasa Refresco": "240Hz (VRR 48-240Hz)",
        "Tiempo Respuesta": "0.03ms (GtG)",
        "HDR": "DisplayHDR True Black 400, HDR10+ Gaming",
        "Curvatura": "1800R",
        "Conectividad": "DisplayPort 1.4, HDMI 2.1, USB-C",
        "Gaming": "FreeSync Premium Pro, G-SYNC Compatible",
        "Smart": "Tizen OS, Gaming Hub, Smart TV apps",
        "Peso": "11.5 kg con base"
      }),
      rating: "4.9",
      stock: 5,
      featured: "yes" as const,
    },
    {
      name: "Samsung QN85D Neo QLED 65\"",
      model: "QN65QN85DAFXZA",
      category: "neo-qled",
      price: "24999",
      imageUrl: "/tv-neo-real.jpg",
      description: "Neo QLED 4K con Mini LED para salas luminosas. NQ4 AI Gen2 con deep learning. Motion Xcelerator 120Hz. Gaming Hub integrado. Excelente relacion precio-calidad.",
      features: JSON.stringify(["4K Neo QLED", "Mini LED", "120Hz", "NQ4 AI Gen2", "Quantum HDR", "Gaming Hub", "OTS Lite"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Retroiluminacion": "Mini LED Edge",
        "HDR": "Quantum HDR, HDR10+",
        "Audio": "OTS Lite, Dolby Atmos",
        "Smart TV": "Tizen OS 2024, SmartThings",
        "Conectividad": "3x HDMI 2.0, WiFi 5, BT 5.0",
        "Gaming": "Motion Xcelerator 120Hz, Gaming Hub",
        "Diseno": "AirSlim Design, 25.7mm depth",
        "Peso": "19.3 kg con base"
      }),
      rating: "4.6",
      stock: 22,
      featured: "no" as const,
    },
    {
      name: "Samsung S85D OLED 55\"",
      model: "QN55S85DAFXZA",
      category: "oled",
      price: "22999",
      imageUrl: "/tv-s95d-real.jpg",
      description: "OLED 4K accesible con calidad excepcional. 120Hz, NQ4 AI Gen2, Dolby Atmos. Compatible con soundbars Q-Series. Perfecto para quienes buscan OLED a precio competitivo.",
      features: JSON.stringify(["4K OLED", "120Hz", "NQ4 AI Gen2", "Dolby Atmos", "Q-Symphony", "OLED HDR"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "NQ4 AI Gen2 Processor",
        "Tasa Refresco": "120Hz (VRR, ALLM)",
        "HDR": "OLED HDR, HDR10+, HLG",
        "Audio": "Dolby Atmos, 2ch 20W",
        "Smart TV": "Tizen OS 2024, AI Vision",
        "Conectividad": "4x HDMI 2.1, WiFi 6",
        "Gaming": "FreeSync, 1ms response",
        "Diseno": "Slim Design, bezel metalico",
        "Peso": "14.8 kg con base"
      }),
      rating: "4.5",
      stock: 18,
      featured: "no" as const,
    },
    {
      name: "Samsung DU8000 Crystal UHD 65\"",
      model: "UN65DU8000FXZA",
      category: "crystal",
      price: "13999",
      imageUrl: "/tv-neo-real.jpg",
      description: "Crystal UHD 4K con procesador Crystal 4K. PurColor para colores vividos. Motion Xcelerator para contenido fluido. Tizen OS completo con Samsung TV Plus. Excelente entrada a 4K.",
      features: JSON.stringify(["4K Crystal UHD", "Crystal Processor 4K", "PurColor", "Motion Xcelerator", "Tizen OS", "Samsung TV Plus"]),
      specs: JSON.stringify({
        "Resolucion": "3,840 x 2,160 (4K UHD)",
        "Procesador": "Crystal Processor 4K",
        "Tasa Refresco": "60Hz (Motion Xcelerator)",
        "HDR": "HDR10+, HLG",
        "Audio": "OTS Lite, Dolby Digital Plus",
        "Smart TV": "Tizen OS 2024, Samsung TV Plus",
        "Conectividad": "3x HDMI, WiFi 5, BT 5.0",
        "Diseno": "AirSlim Design",
        "Peso": "17.1 kg con base"
      }),
      rating: "4.4",
      stock: 28,
      featured: "no" as const,
    },
  ];

  for (const p of prods) {
    await db.insert(products).values(p).onDuplicateKeyUpdate({ set: p });
  }

  // Hardcoded admin
  await db.insert(users).values({
    name: "Administrador Samsung",
    email: "admin@samsung.mx",
    role: "admin",
    password: "80b03348e33d101ce207a01f5446171b399a8ede9d68520664831405dc3f811d",
  }).onDuplicateKeyUpdate({
    set: {
      name: "Administrador Samsung",
      role: "admin",
      password: "80b03348e33d101ce207a01f5446171b399a8ede9d68520664831405dc3f811d",
    }
  });

  // Agent 1
  const agent1 = await db.insert(users).values({
    name: "Carlos Mendez",
    email: "agente@samsungstore.mx",
    role: "agent",
    password: null,
  }).onDuplicateKeyUpdate({ set: { name: "Carlos Mendez" } });

  const agent1Id = Number((agent1 as any).insertId);
  if (agent1Id) {
    await db.insert(agents).values({
      userId: agent1Id,
      code: "AGENT-001",
      specialty: "OLED y Neo QLED 2024",
      phone: "+52 55 1234 5678",
      status: "online",
    }).onDuplicateKeyUpdate({ set: { status: "online" } });
  }

  // Agent 2
  const agent2 = await db.insert(users).values({
    name: "Ana Laura Garcia",
    email: "ana.garcia@samsungstore.mx",
    role: "agent",
    password: null,
  }).onDuplicateKeyUpdate({ set: { name: "Ana Laura Garcia" } });

  const agent2Id = Number((agent2 as any).insertId);
  if (agent2Id) {
    await db.insert(agents).values({
      userId: agent2Id,
      code: "AGENT-002",
      specialty: "Gaming Odyssey y The Frame",
      phone: "+52 33 9876 5432",
      status: "online",
    }).onDuplicateKeyUpdate({ set: { status: "online" } });
  }

  console.log("Seed completed! 8 real Samsung 2024-2025 products with MXN market prices.");
}

seed().catch(console.error);
