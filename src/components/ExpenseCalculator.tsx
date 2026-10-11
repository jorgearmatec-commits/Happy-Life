import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Plus,
  Calendar,
  Tag,
  PieChart,
  Trash2,
  Edit3,
  Lock,
  User,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  ChevronDown,
  X,
  Check,
  Filter,
  BarChart3,
  Receipt,
  Scale,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExpenseItem, ExpenseCurrency } from '../types';
import { playTone } from './AudioSynthesizer';

const DEFAULT_CATEGORIES = [
  'Comida de perro',
  'Feria',
  'Supermercado',
  'Servicios y cuentas',
  'Farmacia y salud',
  'Salidas y ocio',
  'Transporte',
  'Hogar',
  'Regalos',
  'Otro gasto',
];

const CURRENCY_CONFIG: Record<
  ExpenseCurrency,
  { label: string; symbol: string; flag: string; locale: string }
> = {
  CLP: { label: 'Pesos Chilenos', symbol: '$', flag: '🇨🇱', locale: 'es-CL' },
  ARS: { label: 'Pesos Argentinos', symbol: '$', flag: '🇦🇷', locale: 'es-AR' },
  USD: { label: 'Dólares USD', symbol: 'US$', flag: '🇺🇸', locale: 'en-US' },
};

// Conversión aproximada para cálculos combinados limpios si se requiere
const parseCleanAmount = (val: string): number => {
  if (!val) return 0;
  // Limpia formatos como "25.000" o "25,000" o "25000"
  const cleaned = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Parser seguro de fecha para evitar desfases de zona horaria
const parseMiddayDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0);
  }
  return new Date(dateStr);
};

export const ExpenseCalculator: React.FC = () => {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    activeRole,
    me,
    partner,
    trigger3DConfetti,
  } = useApp();

  const [selectedCurrency, setSelectedCurrency] = useState<ExpenseCurrency>('CLP');

  // Control de vista: 'calculator' (formulario + preview) | 'balance' (resumen de balance generado)
  const [activeView, setActiveView] = useState<'both' | 'balance'>('both');
  const [balancePeriodFilter, setBalancePeriodFilter] = useState<'all' | 'monthly' | 'weekly'>('all');

  // Form states para nuevas entradas
  const [amountInput, setAmountInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [categoryInput, setCategoryInput] = useState<string>('Comida de perro');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [currencyInput, setCurrencyInput] = useState<ExpenseCurrency>('CLP');

  // Editing state
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  // Filtros de la lista
  const [filterOwner, setFilterOwner] = useState<'all' | 'me' | 'partner'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const balanceSectionRef = useRef<HTMLDivElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Categorías dinámicas: todas las usadas más las default
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    expenses.forEach((e) => {
      if (e.category && e.category.trim()) {
        set.add(e.category.trim());
      }
    });
    return Array.from(set);
  }, [expenses]);

  const showQuickNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const formatMoney = (amount: number, curr: ExpenseCurrency = selectedCurrency) => {
    const cfg = CURRENCY_CONFIG[curr] || CURRENCY_CONFIG.CLP;
    return `${cfg.symbol} ${Math.round(amount).toLocaleString(cfg.locale, {
      maximumFractionDigits: curr === 'USD' ? 2 : 0,
    })}`;
  };

  // CÁLCULO EN TIEMPO REAL DEL BALANCE (TOTAL, SEMANAL, MENSUAL Y POR TIPO DE GASTO)
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let total = 0;
    let weekly = 0;
    let monthly = 0;
    let totalMe = 0;
    let totalPartner = 0;

    // Mapas para sumar por tipo de gasto
    const totalByCategory: Record<string, number> = {};
    const weeklyByCategory: Record<string, number> = {};
    const monthlyByCategory: Record<string, number> = {};

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      total += amt;

      const expDate = parseMiddayDate(e.date);
      const isThisWeek = expDate >= oneWeekAgo;
      const isThisMonth =
        expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;

      if (isThisWeek) {
        weekly += amt;
        weeklyByCategory[e.category] = (weeklyByCategory[e.category] || 0) + amt;
      }

      if (isThisMonth) {
        monthly += amt;
        monthlyByCategory[e.category] = (monthlyByCategory[e.category] || 0) + amt;
      }

      if (e.creator === 'me') {
        totalMe += amt;
      } else {
        totalPartner += amt;
      }

      totalByCategory[e.category] = (totalByCategory[e.category] || 0) + amt;
    });

    // Desglose por tipo de gasto
    const categoryBreakdown = Object.entries(totalByCategory).map(([cat, totalSum]) => {
      const monthSum = monthlyByCategory[cat] || 0;
      const weekSum = weeklyByCategory[cat] || 0;
      return {
        category: cat,
        totalAmount: totalSum,
        monthlyAmount: monthSum,
        weeklyAmount: weekSum,
        percentageTotal: total > 0 ? (totalSum / total) * 100 : 0,
        percentageMonthly: monthly > 0 ? (monthSum / monthly) * 100 : 0,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      total,
      weekly,
      monthly,
      totalMe,
      totalPartner,
      categoryBreakdown,
    };
  }, [expenses]);

  // FUNCIÓN PRINCIPAL DEL BOTÓN "SOY UN COMPRADOR CTM"
  const handleSoyUnCompradorCTM = (
    overrideAmount?: number,
    overrideCat?: string,
    overrideDesc?: string
  ) => {
    let finalAmount = overrideAmount !== undefined ? overrideAmount : parseCleanAmount(amountInput);

    // Si el usuario apretó el botón sin escribir monto, le asignamos un valor sugerido predeterminado
    if (!finalAmount || finalAmount <= 0) {
      finalAmount = 25000;
      setAmountInput('25000');
    }

    const finalCat = (
      overrideCat ||
      customCategoryInput.trim() ||
      categoryInput ||
      'Comida de perro'
    ).trim();

    const finalDesc = (
      overrideDesc ||
      descriptionInput.trim() ||
      `Gasto en ${finalCat}`
    ).trim();

    const finalDate = dateInput || new Date().toISOString().slice(0, 10);
    const finalCurrency = currencyInput || selectedCurrency;

    // Añadir entrada directamente
    addExpense({
      date: finalDate,
      category: finalCat,
      description: finalDesc,
      amount: finalAmount,
      currency: finalCurrency,
    });

    // Limpiar formulario para la siguiente entrada
    setAmountInput('');
    setDescriptionInput('');
    setCustomCategoryInput('');

    try {
      playTone('water');
    } catch {}

    try {
      trigger3DConfetti();
    } catch {}

    showQuickNotice(
      `✓ ¡Gasto de ${formatMoney(finalAmount, finalCurrency)} en "${finalCat}" añadido exitosamente!`
    );

    // Scroll suave a la vista previa de gastos añadidos
    if (previewSectionRef.current) {
      previewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // FUNCIÓN PRINCIPAL DEL BOTÓN "GENERAR BALANCE"
  const handleGenerarBalance = () => {
    setActiveView('both');
    try {
      playTone('cathedral_bells');
    } catch {}
    try {
      trigger3DConfetti();
    } catch {}
    showQuickNotice('📊 ¡Balance generado con éxito! Consulta el desglose total, semanal y mensual abajo.');

    // Scroll inmediato hacia el panel de balance
    setTimeout(() => {
      if (balanceSectionRef.current) {
        balanceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Edición de gastos existentes
  const handleStartEdit = (exp: ExpenseItem) => {
    if (exp.creator !== activeRole) {
      showQuickNotice('🔒 No puedes editar gastos de tu pareja. Solo tus propios gastos.');
      return;
    }
    setEditingExpenseId(exp.id);
    setEditAmount(String(exp.amount));
    setEditCategory(exp.category);
    setEditDescription(exp.description);
    setEditDate(exp.date);
  };

  const handleSaveEdit = (id: string) => {
    const num = parseCleanAmount(editAmount);
    if (!num || num <= 0) {
      showQuickNotice('Ingresa un monto válido mayor a 0');
      return;
    }
    const ok = updateExpense(id, {
      amount: num,
      category: editCategory.trim() || 'Otro gasto',
      description: editDescription.trim() || editCategory.trim(),
      date: editDate,
    });

    if (ok) {
      setEditingExpenseId(null);
      showQuickNotice('✓ Gasto actualizado correctamente.');
    } else {
      showQuickNotice('🔒 Permiso denegado.');
    }
  };

  const handleDelete = (exp: ExpenseItem) => {
    if (exp.creator !== activeRole) {
      showQuickNotice('🔒 Solo puedes eliminar tus propios gastos.');
      return;
    }
    deleteExpense(exp.id);
    showQuickNotice('✓ Gasto eliminado del registro.');
  };

  // Filtrado de gastos para vista previa
  const previewExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterOwner === 'me' && e.creator !== 'me') return false;
      if (filterOwner === 'partner' && e.creator !== 'partner') return false;
      return true;
    });
  }, [expenses, filterOwner]);

  return (
    <div className="w-full space-y-6 select-none pb-12">
      {/* Banner de aviso rápido */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 text-white font-black text-xs sm:text-sm shadow-xl text-center border border-white/20"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA PRINCIPAL CON SELECTOR DE DIVISA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-600/15 border border-amber-400/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-md shrink-0">
            💰
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight flex items-center gap-2">
              <span>Calculadora de Gastos de Pareja</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold">
                Dúo Balance
              </span>
            </h3>
            <p className="text-xs text-white/70">
              Registren sus gastos, vean la vista previa en vivo y generen el balance automático mensual y semanal.
            </p>
          </div>
        </div>

        {/* Selector de 3 Divisas Solicitadas: CLP, ARS, USD */}
        <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto">
          {(['CLP', 'ARS', 'USD'] as ExpenseCurrency[]).map((cur) => (
            <button
              key={cur}
              type="button"
              onClick={() => {
                setSelectedCurrency(cur);
                setCurrencyInput(cur);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCurrency === cur
                  ? 'bg-amber-400 text-black shadow-md ring-2 ring-amber-300 scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{CURRENCY_CONFIG[cur].flag}</span>
              <span>{cur}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN 1: FORMULARIO DIRECTO Y BOTÓN "SOY UN COMPRADOR CTM" */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1b1226] via-[#141220] to-[#121626] border-2 border-amber-400/50 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h4 className="text-base sm:text-lg font-black text-amber-200 font-heading">
              Ingresar Nuevo Gasto
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Suma Automática
          </span>
        </div>

        {/* Atajos Rápidos de un toque con los ejemplos pedidos por el usuario */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-white/80 block">
            Atajos de 1 toque (Ejemplos solicitados):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setAmountInput('25000');
                setCategoryInput('Comida de perro');
                setDescriptionInput('Comida de perro');
                handleSoyUnCompradorCTM(25000, 'Comida de perro', 'Comida de perro 15kg');
              }}
              className="p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm group"
            >
              <span className="text-base block mb-0.5">🐕</span>
              <span className="text-xs font-black text-amber-200 block truncate">25.000 Comida Perro</span>
              <span className="text-[10px] text-amber-300/70 block">Añadir al toque ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAmountInput('45000');
                setCategoryInput('Feria');
                setDescriptionInput('Feria de frutas y verduras');
                handleSoyUnCompradorCTM(45000, 'Feria', 'Feria frutas y verduras');
              }}
              className="p-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm group"
            >
              <span className="text-base block mb-0.5">🥬</span>
              <span className="text-xs font-black text-emerald-200 block truncate">45.000 en la Feria</span>
              <span className="text-[10px] text-emerald-300/70 block">Añadir al toque ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAmountInput('60000');
                setCategoryInput('Supermercado');
                setDescriptionInput('Supermercado mensual');
                handleSoyUnCompradorCTM(60000, 'Supermercado', 'Supermercado mensual');
              }}
              className="p-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm group"
            >
              <span className="text-base block mb-0.5">🛒</span>
              <span className="text-xs font-black text-blue-200 block truncate">60.000 Supermercado</span>
              <span className="text-[10px] text-blue-300/70 block">Añadir al toque ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAmountInput('15000');
                setCategoryInput('Farmacia y salud');
                setDescriptionInput('Farmacia y remedios');
                handleSoyUnCompradorCTM(15000, 'Farmacia y salud', 'Farmacia y salud');
              }}
              className="p-2.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm group"
            >
              <span className="text-base block mb-0.5">💊</span>
              <span className="text-xs font-black text-purple-200 block truncate">15.000 Farmacia</span>
              <span className="text-[10px] text-purple-300/70 block">Añadir al toque ⚡</span>
            </button>
          </div>
        </div>

        {/* Campos de Entrada Personalizados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Valor / Monto */}
          <div>
            <label className="text-xs font-bold text-amber-300 block mb-1">
              ¿Cuánto gastaste? (Monto total): *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-black text-amber-400 font-mono">
                {CURRENCY_CONFIG[currencyInput].symbol}
              </span>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Ej. 25.000 o 45000"
                className="w-full pl-10 pr-3 py-3 rounded-2xl bg-black/60 border border-amber-400/50 text-white font-mono font-black text-base sm:text-lg focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 shadow-inner"
              />
            </div>
          </div>

          {/* Fecha del Gasto */}
          <div>
            <label className="text-xs font-bold text-white/80 block mb-1">
              Fecha del gasto (ej. Día 10 de octubre):
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl bg-black/50 border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setDateInput(new Date().toISOString().slice(0, 10))}
                className="px-3 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition-colors"
                title="Usar fecha de hoy"
              >
                Hoy
              </button>
            </div>
          </div>
        </div>

        {/* Categoría / Tipo de Gasto */}
        <div>
          <label className="text-xs font-bold text-white/80 block mb-1.5">
            Tipo de Gasto (Toca una categoría o escribe una nueva):
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-black/40 rounded-2xl border border-white/10">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryInput(cat);
                  setCustomCategoryInput('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  categoryInput === cat && !customCategoryInput
                    ? 'bg-amber-400 text-black font-black shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customCategoryInput}
            onChange={(e) => setCustomCategoryInput(e.target.value)}
            placeholder="O escribe una categoría nueva que se sumará al balance (ej. Veterinaria, Bencina, Cine...)"
            className="w-full mt-2 px-3 py-2.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Detalle o Descripción */}
        <div>
          <label className="text-xs font-bold text-white/80 block mb-1">
            Detalle / ¿En qué lo gastaste?:
          </label>
          <input
            type="text"
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            placeholder="Ej. Saco comida de perro 15kg, feria del sábado de frutas y verduras..."
            className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* BOTÓN SOLICITADO EXACTO: "SOY UN COMPRADOR CTM" */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleSoyUnCompradorCTM()}
            className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-base sm:text-lg uppercase tracking-wide flex items-center justify-center gap-3 shadow-[0_12px_28px_rgba(225,29,72,0.45)] border-2 border-amber-300/40 cursor-pointer active:scale-95 transition-all"
          >
            <ShoppingBag className="w-6 h-6 text-amber-200 animate-bounce" />
            <span className="font-heading">
              Soy Un Comprador CTM 🛍️ (Añadir Gasto)
            </span>
          </button>
        </div>
      </div>

      {/* ACCIÓN: BOTÓN "GENERAR BALANCE" DESTACADO */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border-2 border-cyan-400/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-cyan-200 font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Generar y Ver Balance de Gastos</span>
          </h4>
          <p className="text-xs text-white/70">
            Suma automáticamente todos tus gastos en un total conjunto y los desglosa semanal y mensualmente según cada tipo de gasto.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerarBalance}
          className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all shrink-0"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Generar Balance 📊</span>
        </button>
      </div>

      {/* SECCIÓN 2: BALANCE GENERADO (SE MUESTRA DE FORMA DIRECTA Y TRANSPARENTE EN PANTALLA) */}
      <div
        ref={balanceSectionRef}
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#101528] via-[#141228] to-[#1c1224] border-2 border-cyan-400/50 shadow-2xl space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl shadow-md">
              📊
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-heading">
                Balance Generado: Total y Desglose por Tipo de Gasto
              </h3>
              <p className="text-xs text-cyan-200/80">
                Gastos sumados automáticamente en tiempo real
              </p>
            </div>
          </div>

          {/* Filtro de período para el desglose: Total vs Mensual vs Semanal */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-2xl border border-white/10 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBalancePeriodFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                balancePeriodFilter === 'all'
                  ? 'bg-cyan-500 text-black font-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Total
            </button>
            <button
              type="button"
              onClick={() => setBalancePeriodFilter('monthly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                balancePeriodFilter === 'monthly'
                  ? 'bg-emerald-500 text-black font-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Este Mes 📅
            </button>
            <button
              type="button"
              onClick={() => setBalancePeriodFilter('weekly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                balancePeriodFilter === 'weekly'
                  ? 'bg-purple-500 text-white font-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Esta Semana ⏱️
            </button>
          </div>
        </div>

        {/* 1. TARJETAS DEL TOTAL SUMADO: TOTAL GENERAL, MENSUAL Y SEMANAL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-amber-300 block">
              💰 Gasto Total Acumulado:
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {formatMoney(stats.total)}
            </div>
            <p className="text-[10px] text-white/50">Todos los gastos sumados</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 block">
              📅 Balance Mensual (Mes Actual):
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-200 font-mono">
              {formatMoney(stats.monthly)}
            </div>
            <p className="text-[10px] text-emerald-300/60">Gastos de este mes</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-1">
            <span className="text-[11px] font-bold text-purple-300 block">
              ⏱️ Balance Semanal (Últimos 7 días):
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-200 font-mono">
              {formatMoney(stats.weekly)}
            </div>
            <p className="text-[10px] text-purple-300/60">Gastos últimos 7 días</p>
          </div>
        </div>

        {/* 2. REPARTO EQUITATIVO DE LA PAREJA (QUIÉN PAGÓ QUÉ) */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-rose-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-rose-400" />
              {me.name || 'Lucas'}: {formatMoney(stats.totalMe)}
            </span>
            <span className="text-purple-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-400" />
              {partner.name || 'Sofía'}: {formatMoney(stats.totalPartner)}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all"
              style={{
                width: `${stats.total > 0 ? (stats.totalMe / stats.total) * 100 : 50}%`,
              }}
            />
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
              style={{
                width: `${stats.total > 0 ? (stats.totalPartner / stats.total) * 100 : 50}%`,
              }}
            />
          </div>

          {/* Análisis de equilibrio */}
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {stats.totalMe === stats.totalPartner
                ? '✨ ¡Están exactamente 50/50! Ambos han aportado equitativamente.'
                : stats.totalMe > stats.totalPartner
                ? `${me.name || 'Lucas'} ha pagado ${formatMoney(stats.totalMe - stats.totalPartner)} más. Para compensar 50/50, ${partner.name || 'Sofía'} debería aportar ${formatMoney((stats.totalMe - stats.totalPartner) / 2)}.`
                : `${partner.name || 'Sofía'} ha pagado ${formatMoney(stats.totalPartner - stats.totalMe)} más. Para compensar 50/50, ${me.name || 'Lucas'} debería aportar ${formatMoney((stats.totalPartner - stats.totalMe) / 2)}.`}
            </span>
          </div>
        </div>

        {/* 3. GASTOS SUMADOS POR CADA TIPO DE GASTO (CATEGORÍA) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>
                Gastos Sumados por Tipo de Gasto{' '}
                {balancePeriodFilter === 'monthly'
                  ? '(Mes en curso)'
                  : balancePeriodFilter === 'weekly'
                  ? '(Esta semana)'
                  : '(Total)'}:
              </span>
            </h4>
            <span className="text-[11px] text-white/50 font-bold">
              {stats.categoryBreakdown.length} categorías activas
            </span>
          </div>

          {stats.categoryBreakdown.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-white/50">
              No hay gastos registrados todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.categoryBreakdown.map((item) => {
                const displayAmt =
                  balancePeriodFilter === 'monthly'
                    ? item.monthlyAmount
                    : balancePeriodFilter === 'weekly'
                    ? item.weeklyAmount
                    : item.totalAmount;

                const baseTotal =
                  balancePeriodFilter === 'monthly'
                    ? stats.monthly
                    : balancePeriodFilter === 'weekly'
                    ? stats.weekly
                    : stats.total;

                const pct = baseTotal > 0 ? (displayAmt / baseTotal) * 100 : 0;

                return (
                  <div
                    key={item.category}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-cyan-400/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white flex items-center gap-1.5 truncate">
                        <span>🏷️</span>
                        <span className="truncate">{item.category}</span>
                      </span>
                      <span className="text-amber-300 font-mono font-black shrink-0">
                        {formatMoney(displayAmt)} ({pct.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    {/* Detalle complementario mensual y semanal */}
                    <div className="flex justify-between text-[10px] text-white/50 font-mono pt-0.5">
                      <span>Semanal: {formatMoney(item.weeklyAmount)}</span>
                      <span>Mensual: {formatMoney(item.monthlyAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: VISTA PREVIA DE LOS GASTOS AÑADIDOS EN VIVO */}
      <div
        ref={previewSectionRef}
        className="space-y-3.5 pt-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-black text-white font-heading">
              Vista Previa de Gastos Añadidos ({previewExpenses.length})
            </h4>
          </div>

          {/* Filtros de autor */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setFilterOwner('all')}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                filterOwner === 'all'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterOwner('me')}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                filterOwner === 'me'
                  ? 'bg-rose-500/40 text-rose-200 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Mis Gastos
            </button>
            <button
              type="button"
              onClick={() => setFilterOwner('partner')}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                filterOwner === 'partner'
                  ? 'bg-purple-500/40 text-purple-200 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Mi Pareja
            </button>
          </div>
        </div>

        {previewExpenses.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
            <div className="text-3xl">🛒</div>
            <p className="text-sm font-bold text-white/80">No hay gastos en esta vista.</p>
            <p className="text-xs text-white/50">
              Presiona el botón <span className="text-amber-300 font-bold">"Soy Un Comprador CTM"</span> arriba para registrar el primero.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {previewExpenses.map((exp) => {
              const isMine = exp.creator === activeRole;
              const isEditingThis = editingExpenseId === exp.id;
              const formattedDate = parseMiddayDate(exp.date).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              if (isEditingThis) {
                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-3xl bg-neutral-900 border-2 border-amber-400 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>Editar mi gasto:</span>
                      <button
                        type="button"
                        onClick={() => setEditingExpenseId(null)}
                        className="text-white/60 hover:text-white"
                      >
                        ✕ Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Monto"
                        className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono font-bold text-sm"
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="Categoría"
                        className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                      />
                    </div>

                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descripción"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingExpenseId(null)}
                        className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(exp.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-md"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 sm:p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 shadow-md ${
                    isMine
                      ? 'bg-gradient-to-r from-rose-950/30 to-black/40 border-rose-500/30 hover:border-rose-400/50'
                      : 'bg-gradient-to-r from-purple-950/30 to-black/40 border-purple-500/30 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 border ${
                        isMine
                          ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                          : 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                      }`}
                    >
                      {exp.category.includes('perro')
                        ? '🐕'
                        : exp.category.includes('Feria')
                        ? '🥬'
                        : exp.category.includes('Super')
                        ? '🛒'
                        : exp.category.includes('Farmacia')
                        ? '💊'
                        : exp.category.includes('Salidas')
                        ? '🍷'
                        : exp.category.includes('Servicios')
                        ? '💡'
                        : '🧾'}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {exp.description}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isMine
                              ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                              : 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                          }`}
                        >
                          {exp.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-semibold text-white/70">
                          {isMine
                            ? `👤 Registrado por ti (${me.name || 'Yo'})`
                            : `🐼 Registrado por ${exp.creatorName || partner.name || 'tu pareja'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LADO DERECHO: MONTO Y BOTONES SEGÚN REGLA DE PERMISOS */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-amber-300 font-mono">
                        {formatMoney(exp.amount, exp.currency)}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase font-bold">
                        {exp.currency}
                      </div>
                    </div>

                    {isMine ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(exp)}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Editar mi gasto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exp)}
                          className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-90 text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                          title="Eliminar mi gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold flex items-center gap-1"
                        title="Este gasto fue creado por tu pareja. Solo lectura."
                      >
                        <Lock className="w-3 h-3 text-white/40" />
                        <span className="hidden sm:inline">Solo lectura</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
