"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThemeConfig } from "@/lib/themes";
import type { ShopPublicData } from "./page";
import BookingClient from "./BookingClient";

export default function LandingClient({
  shop,
  theme,
}: {
  shop: ShopPublicData;
  theme: ThemeConfig;
}) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Fecha o modal de agendamento (usado no botão Voltar do BookingClient)
  const closeBooking = () => setIsBookingOpen(false);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} relative overflow-x-hidden`}>
      
      {/* 1. HERO SECTION */}
      <section className={`relative pt-20 pb-24 px-6 flex flex-col items-center text-center bg-gradient-to-b ${theme.bgGradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className={`relative z-10 w-24 h-24 rounded-3xl mb-6 flex items-center justify-center text-4xl shadow-2xl shadow-black/30 border ${theme.surface} ${theme.border}`}>
          {shop.logoUrl ? (
             <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover rounded-3xl" />
          ) : "💈"}
        </div>
        
        <h1 className="relative z-10 text-3xl font-extrabold tracking-tight mb-2">
          {shop.name}
        </h1>
        
        {shop.address && (
          <p className={`relative z-10 text-sm mb-10 max-w-xs ${theme.textMuted}`}>
            {shop.address}
          </p>
        )}

        <div className="relative z-10 w-full max-w-sm space-y-4">
          <button
            onClick={() => setIsBookingOpen(true)}
            className={`w-full py-4 rounded-2xl font-extrabold text-base transition-all shadow-xl active:scale-[0.98] ${theme.primary} ${theme.primaryHover} ${theme.primaryText}`}
          >
            AGENDAR HORÁRIO
          </button>
          
          <button
            onClick={() => {
              document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all border ${theme.surface} ${theme.border} hover:bg-white/5`}
          >
            Ver nossos serviços ↓
          </button>
        </div>
      </section>

      {/* 2. PROFISSIONAIS (NOSSA EQUIPE) */}
      <section className="py-12 px-6 max-w-md mx-auto">
        <h2 className={`text-xs font-bold tracking-widest uppercase mb-6 ${theme.textMuted}`}>Nossa Equipe</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {shop.professionals.map((pro) => (
            <div key={pro.id} className={`p-4 rounded-3xl border flex flex-col items-center text-center ${theme.surface} ${theme.border}`}>
              <div className={`w-16 h-16 rounded-full mb-3 overflow-hidden flex items-center justify-center text-xl font-bold border-2 ${theme.border} ${theme.bg}`}>
                {pro.image ? (
                  <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" />
                ) : (
                  pro.name[0]
                )}
              </div>
              <p className="text-sm font-semibold">{pro.name}</p>
              <p className={`text-[10px] uppercase tracking-wider mt-1 ${theme.primaryText} opacity-70`}>Barbeiro</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SERVIÇOS */}
      <section id="services-section" className="py-12 px-6 max-w-md mx-auto">
        <h2 className={`text-xs font-bold tracking-widest uppercase mb-6 ${theme.textMuted}`}>Serviços</h2>
        
        <div className="space-y-3">
          {shop.services.map((svc) => (
            <div key={svc.id} className={`p-5 rounded-3xl border flex items-center justify-between ${theme.surface} ${theme.border}`}>
              <div>
                <p className="font-bold text-sm">{svc.name}</p>
                <p className={`text-xs mt-1 ${theme.textMuted}`}>{svc.durationMinutes} min</p>
              </div>
              <div className="text-right">
                <p className={`font-extrabold text-lg ${theme.accent}`}>
                  <span className="text-xs font-medium opacity-70 mr-1">R$</span>
                  {svc.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LOCALIZAÇÃO E CONTATO */}
      <section className="py-12 px-6 pb-32 max-w-md mx-auto">
        <h2 className={`text-xs font-bold tracking-widest uppercase mb-6 ${theme.textMuted}`}>Localização</h2>
        
        <div className={`p-6 rounded-3xl border ${theme.surface} ${theme.border}`}>
          <div className="text-3xl mb-4">📍</div>
          <p className="font-semibold text-sm mb-1">Endereço</p>
          <p className={`text-sm mb-6 ${theme.textMuted}`}>{shop.address || "Endereço não informado"}</p>
          
          {shop.address && (
             <a
               href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " " + shop.address)}`}
               target="_blank"
               rel="noopener noreferrer"
               className={`block w-full text-center py-3 rounded-xl text-sm font-bold border transition-colors ${theme.border} hover:bg-white/5`}
             >
               Abrir no Google Maps ↗
             </a>
          )}
        </div>
      </section>

      {/* APP-LIKE BOTTOM SHEET (Booking Flow) */}
      <AnimatePresence>
        {isBookingOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-50 overflow-y-auto ${theme.bg}`}
          >
            <BookingClient 
              shop={shop} 
              theme={theme} 
              onClose={closeBooking} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
