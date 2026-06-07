import Marquee from 'react-fast-marquee'
import { useMemo } from 'react'

const brands = [
  { name: 'Samsung', color: '#1428A0' },
  { name: 'LG', color: '#A50034' },
  { name: 'Sony', color: '#000000' },
  { name: 'Huawei', color: '#CF0A2C' },
  { name: 'Xiaomi', color: '#FF6900' },
  { name: 'Panasonic', color: '#006AB0' },
  { name: 'TCL', color: '#002B5C' },
  { name: 'Hisense', color: '#00A0E9' },
  { name: 'Philips', color: '#0A4B91' },
  { name: 'Sharp', color: '#E60012' },
]

export function BrandLogoMarquee({ darkMode = false }: { darkMode?: boolean }) {
  const bgColor = useMemo(() => (darkMode ? '#0a0a0f' : '#f9fafb'), [darkMode])

  return (
    <section className={`py-6 border-y transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center">
          Marcas Lideres en Tecnologia
        </p>
      </div>
      <Marquee speed={30} gradient={true} gradientWidth={80} gradientColor={bgColor}>
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="mx-8 flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity duration-300 cursor-default"
          >
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: brand.color }}
            />
            <span className={`text-sm font-black tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {brand.name}
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  )
}
