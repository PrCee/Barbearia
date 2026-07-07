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

  const closeBooking = () => setIsBookingOpen(false);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} relative overflow-x-hidden font-sans selection:bg-neutral-300/30`}>
      
      {/* 1. HERO SECTION (Minimalist, Apple-like) */}
      <section className="relative pt-24 pb-20 px-6 flex flex-col items-center text-center">
        {/* Subtle blur accent in background */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] max-w-2xl bg-gradient-to-b ${theme.bgGradient} opacity-50 blur-[100px] pointer-events-none rounded-full`} />
        
        <div className={`relative z-10 w-28 h-28 mb-8 flex items-center justify-center text-5xl rounded-[32px] shadow-sm border ${theme.surface} ${theme.border} overflow-hidden bg-white/5 backdrop-blur-xl`}>
          {shop.logoUrl ? (
             <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : "💈"}
        </div>
        
        <h1 className="relative z-10 text-4xl md:text-5xl font-semibold tracking-tight mb-4 leading-tight">
          {shop.name}
        </h1>
        
        {shop.address && (
          <p className={`relative z-10 text-[15px] font-medium mb-12 max-w-sm mx-auto ${theme.textMuted}`}>
            {shop.address}
          </p>
        )}

        <div className="relative z-10 w-full max-w-sm space-y-4">
          <button
            onClick={() => setIsBookingOpen(true)}
            className={`w-full py-4 rounded-[20px] font-semibold text-[17px] transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${theme.primary} ${theme.primaryText}`}
          >
            Agendar Horário
          </button>
          
          <button
            onClick={() => {
              document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`w-full py-4 rounded-[20px] font-medium text-[15px] transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5 ${theme.textSecondary}`}
          >
            Ver Serviços ↓
          </button>
        </div>
      </section>

      {/* CLUBE DE ASSINATURA (Frosted Glass / Titanium Style) */}
      {shop.clubEnabled && (
        <section className="px-6 mb-16 relative z-20 max-w-md mx-auto">
          <div className={`relative overflow-hidden rounded-[28px] p-8 border ${theme.border} backdrop-blur-2xl shadow-sm ${theme.surfaceAlt}`}>
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl mb-5 border ${theme.border} ${theme.surface}`}>
              👑
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Clube Premium</h2>
            <p className={`text-[15px] leading-relaxed mb-6 ${theme.textSecondary}`}>
              Cortes ilimitados por uma mensalidade fixa. Mantenha seu visual sempre impecável.
            </p>
            <button 
              onClick={() => alert("O Clube VIP está sendo implementado! Em breve você poderá assinar diretamente pelo app.")}
              className={`w-full py-3.5 rounded-[16px] font-semibold text-[15px] transition-all border ${theme.border} ${theme.surface} hover:bg-black/5 dark:hover:bg-white/5`}
            >
              Conhecer o Clube
            </button>
          </div>
        </section>
      )}

      {/* 2. PROFISSIONAIS (NOSSA EQUIPE) */}
      <section className="py-12 px-6 max-w-md mx-auto">
        <h2 className={`text-[13px] font-semibold tracking-widest uppercase mb-8 text-center ${theme.textMuted}`}>A Equipe</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {shop.professionals.map((pro) => (
            <div key={pro.id} className="flex flex-col items-center group">
              <div className={`w-20 h-20 rounded-full mb-4 overflow-hidden flex items-center justify-center text-2xl font-semibold border ${theme.border} ${theme.surface} transition-transform duration-300 group-hover:scale-105 shadow-sm`}>
                {pro.image ? (
                  <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" />
                ) : (
                  pro.name[0]
                )}
              </div>
              <p className="text-[15px] font-medium">{pro.name}</p>
              <p className={`text-[13px] mt-0.5 ${theme.textMuted}`}>Especialista</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SERVIÇOS */}
      <section id="services-section" className="py-12 px-6 max-w-md mx-auto">
        <h2 className={`text-[13px] font-semibold tracking-widest uppercase mb-8 text-center ${theme.textMuted}`}>Serviços</h2>
        
        <div className={`rounded-[28px] overflow-hidden border ${theme.border} ${theme.surface}`}>
          {shop.services.map((svc, index) => (
            <div 
              key={svc.id} 
              className={`p-6 flex items-center justify-between transition-colors ${
                index !== shop.services.length - 1 ? `border-b ${theme.border}` : ''
              } hover:bg-black/5 dark:hover:bg-white/5`}
            >
              <div>
                <p className="font-semibold text-[16px]">{svc.name}</p>
                <p className={`text-[14px] mt-1 ${theme.textMuted}`}>{svc.durationMinutes} min</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-[17px] ${theme.text}`}>
                  <span className={`text-[13px] mr-1 ${theme.textMuted}`}>R$</span>
                  {svc.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LOCALIZAÇÃO E HORÁRIOS */}
      <section className="py-12 px-6 pb-32 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10 text-center">Minha localização & Horários</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Horário de Funcionamento */}
          <div className={`p-8 rounded-[28px] border ${theme.surface} ${theme.border} shadow-sm`}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">🕒</span>
              <h3 className="font-semibold text-[15px]">Horário de Funcionamento</h3>
            </div>
            
            <div className="space-y-4 text-[14px]">
              <div className={`flex justify-between items-center border-b pb-2 ${theme.border}`}>
                <span className={theme.textMuted}>Domingo</span>
                <span className="italic opacity-70">Fechado</span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 ${theme.border}`}>
                <span className={theme.textMuted}>Segunda-feira</span>
                <span className="font-medium">18:30 - 21:30</span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 font-bold ${theme.text} ${theme.border}`}>
                <span>Terça-feira</span>
                <span>18:30 - 21:30</span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 ${theme.border}`}>
                <span className={theme.textMuted}>Quarta-feira</span>
                <span className="font-medium">18:30 - 21:30</span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 ${theme.border}`}>
                <span className={theme.textMuted}>Quinta-feira</span>
                <span className="font-medium">18:30 - 21:30</span>
              </div>
              <div className={`flex justify-between items-center border-b pb-2 ${theme.border}`}>
                <span className={theme.textMuted}>Sexta-feira</span>
                <span className="font-medium">18:30 - 21:30</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className={theme.textMuted}>Sábado</span>
                <span className="font-medium">10:00 - 12:00 &nbsp; 12:30 - 20:00</span>
              </div>
            </div>
          </div>

          {/* Localização no Mapa */}
          <div className="flex flex-col items-center text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 bg-black/5 dark:bg-white/5`}>📍</div>
            <p className={`text-[15px] leading-relaxed mb-8 max-w-sm mx-auto ${theme.textSecondary}`}>
              {shop.address || "Av. Ataliba Leonel, 182 - Vila Cantizani, Águas de Santa Bárbara - SP - 18770-000 (Proximo ao Mercado Rodrigues)"}
            </p>
            
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " " + (shop.address || "Av. Ataliba Leonel, 182 - Vila Cantizani"))}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block px-8 py-3.5 rounded-[20px] text-[14px] font-semibold transition-all duration-200 border hover:scale-[1.02] active:scale-[0.98] ${theme.surface} ${theme.text} ${theme.border}`}
            >
              VER NO MAPA
            </a>
          </div>
        </div>
      </section>

      {/* APP-LIKE BOTTOM SHEET (Booking Flow) */}
      <AnimatePresence>
        {isBookingOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
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
