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
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExpenseItem, ExpenseCurrency, ExpenseSuggestion } from '../types';
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

export const CATEGORY_COLORS: Record<string, string> = {
  // Requisitos específicos de usuario
  'Comida de perro': '#f97316', // naranja (orange-500)
  'Feria': '#10b981', // verde (emerald-500)
  'Supermercado': '#2563eb', // azul (blue-600)
  'Farmacia y salud': '#ec4899', // rosa (pink-500)
  'Transporte': '#06b6d4', // celeste / cyan (cyan-500)
  'Hogar': '#8b5cf6', // violeta (purple-500)
  'Servicios y cuentas': '#eab308', // amarillo (yellow-500)
  'Salidas y ocio': '#ef4444', // rojo (red-500)
  'Ropa y calzado': '#14b8a6', // turquesa / teal (teal-500)
  'Regalos': '#a855f7', // morado (violet-500)
  // Categorías complementarias conocidas
  'Mascotas': '#fb923c', // naranja claro (orange-400)
  'Educación': '#3b82f6', // azul índigo (indigo-500)
  'Ahorro': '#84cc16', // lima brillante (lime-500)
  'Otro gasto': '#64748b', // pizarra neutro (slate-500)
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Comida de perro': '🐕',
  'Feria': '🥬',
  'Supermercado': '🛒',
  'Farmacia y salud': '💊',
  'Salidas y ocio': '🍷',
  'Servicios y cuentas': '💡',
  'Transporte': '🚗',
  'Mascotas': '🐾',
  'Regalos': '🎁',
  'Educación': '📚',
  'Ropa y calzado': '👕',
  'Ahorro': '💰',
  'Hogar': '🏠',
  'Otro gasto': '🧾',
};

// Paleta armónica, contrastada y visualmente separada sobre fondo oscuro
export const FALLBACK_PALETTE = [
  '#f97316', // naranja vibrante
  '#10b981', // verde esmeralda
  '#2563eb', // azul real
  '#ec4899', // rosa intenso
  '#06b6d4', // celeste / cyan
  '#8b5cf6', // violeta
  '#eab308', // amarillo dorado
  '#ef4444', // rojo vivo
  '#14b8a6', // turquesa / teal
  '#a855f7', // morado
  '#84cc16', // lima
  '#f43f5e', // coral / rose
  '#0284c7', // azul cielo oscuro
  '#d946ef', // fucsia
  '#38bdf8', // celeste claro
  '#f59e0b', // ámbar
  '#6366f1', // índigo
  '#4ade80', // verde menta
];

/**
 * Asigna deterministamente un color estable para cualquier categoría.
 * No depende de la posición ni del orden en el array:
 * 1. Categorías conocidas -> color oficial fijado.
 * 2. Categorías personalizadas -> hash determinista del nombre sobre la paleta armónica.
 */
export const getCategoryColor = (category: string, _index?: number): string => {
  const trimmed = (category || '').trim();
  if (CATEGORY_COLORS[trimmed]) {
    return CATEGORY_COLORS[trimmed];
  }

  // Comprobar coincidencia sin mayúsculas/minúsculas para nombres equivalentes
  const lower = trimmed.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.toLowerCase() === lower) {
      return color;
    }
  }

  // Hash determinista del nombre de la categoría (función hash DJB2 modificada)
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0; // Convertir a entero de 32 bits
  }

  const paletteIndex = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[paletteIndex];
};

const getCategoryIcon = (category: string): string => {
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('perro') || catLower.includes('can')) return '🐕';
  if (catLower.includes('gato') || catLower.includes('felino')) return '🐈';
  if (catLower.includes('feria') || catLower.includes('fruta') || catLower.includes('verdura'))
    return '🥬';
  if (catLower.includes('super') || catLower.includes('mercado')) return '🛒';
  if (catLower.includes('farmacia') || catLower.includes('medic') || catLower.includes('salud'))
    return '💊';
  if (catLower.includes('salida') || catLower.includes('cita') || catLower.includes('cena'))
    return '🍷';
  if (
    catLower.includes('servicio') ||
    catLower.includes('luz') ||
    catLower.includes('agua') ||
    catLower.includes('gas') ||
    catLower.includes('cuenta')
  )
    return '💡';
  if (
    catLower.includes('auto') ||
    catLower.includes('bencina') ||
    catLower.includes('uber') ||
    catLower.includes('transporte')
  )
    return '🚗';
  if (catLower.includes('ropa')) return '👕';
  return '🏷️';
};

const parseCleanAmount = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

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

// COMPONENTE: GRÁFICO DE TORTA DE GASTOS POR CATEGORÍA
interface CategoryPieChartProps {
  items: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }>;
  totalAmount: number;
  currency: ExpenseCurrency;
  periodLabel: string;
  formatMoney: (amount: number, curr?: ExpenseCurrency) => string;
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  items,
  totalAmount,
  currency,
  periodLabel,
  formatMoney,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  if (items.length === 0 || totalAmount <= 0) {
    return (
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2 mt-4">
        <div className="text-2xl">🥧</div>
        <h4 className="text-sm font-black text-cyan-200">
          Distribución de tus gastos por categoría
        </h4>
        <p className="text-xs text-white/70">
          No hay gastos registrados en {currency} para {periodLabel}.
        </p>
        <p className="text-[10px] text-white/50">
          Registra un gasto o cambia el filtro de divisa/período para ver la distribución.
        </p>
      </div>
    );
  }

  // Pre-calcular porciones radiales para el gráfico SVG
  let currentAngle = -Math.PI / 2; // Inicia a las 12 en punto
  const slices = items.map((item) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return {
      ...item,
      startAngle,
      endAngle,
    };
  });

  const activeSlice = hoveredCategory ? items.find((i) => i.category === hoveredCategory) : null;

  return (
    <div className="space-y-4 pt-4 border-t border-white/10 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-lg shadow-sm">
            🥧
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-white font-heading">
              Distribución de tus gastos por categoría
            </h4>
            <p className="text-[11px] text-cyan-200/80">
              Gráfico de torta agrupado por tipo de gasto en {currency} ({periodLabel})
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 self-start sm:self-auto">
          {items.length} {items.length === 1 ? 'categoría con gastos' : 'categorías con gastos'}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 p-4 sm:p-6 rounded-3xl bg-black/40 border border-white/10">
        {/* SVG Gráfico de Torta / Donut Responsive */}
        <div className="relative w-60 h-60 sm:w-68 sm:h-68 shrink-0 flex items-center justify-center select-none">
          <svg
            viewBox="0 0 320 320"
            className="w-full h-full transform transition-all duration-300 overflow-visible"
          >
            {slices.length === 1 ? (
              // Caso de 1 sola porción (100%)
              <circle
                cx="160"
                cy="160"
                r="92"
                fill="none"
                stroke={slices[0].color}
                strokeWidth="56"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(slices[0].category)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            ) : (
              // Múltiples porciones en arco
              slices.map((slice) => {
                const cx = 160;
                const cy = 160;
                const r = 120;
                const innerR = 62;

                const x1 = cx + r * Math.cos(slice.startAngle);
                const y1 = cy + r * Math.sin(slice.startAngle);
                const x2 = cx + r * Math.cos(slice.endAngle);
                const y2 = cy + r * Math.sin(slice.endAngle);
                const x3 = cx + innerR * Math.cos(slice.endAngle);
                const y3 = cy + innerR * Math.sin(slice.endAngle);
                const x4 = cx + innerR * Math.cos(slice.startAngle);
                const y4 = cy + innerR * Math.sin(slice.startAngle);

                const largeArc = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;
                const isHovered = hoveredCategory === slice.category;

                const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                return (
                  <path
                    key={slice.category}
                    d={pathData}
                    fill={slice.color}
                    stroke="#101528"
                    strokeWidth="2.5"
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: hoveredCategory && !isHovered ? 0.4 : 1,
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: '160px 160px',
                      filter: isHovered ? `drop-shadow(0 0 10px ${slice.color}90)` : 'none',
                    }}
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() =>
                      setHoveredCategory(
                        hoveredCategory === slice.category ? null : slice.category
                      )
                    }
                  />
                );
              })
            )}
          </svg>

          {/* Centro del Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            {activeSlice ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-0.5"
              >
                <span className="text-xl block">{activeSlice.icon}</span>
                <span className="text-xs font-black text-white block max-w-[120px] truncate">
                  {activeSlice.category}
                </span>
                <span className="text-sm font-black text-amber-300 font-mono block">
                  {formatMoney(activeSlice.amount, currency)}
                </span>
                <span className="text-[11px] font-bold text-cyan-300 block">
                  {activeSlice.percentage.toFixed(1)}%
                </span>
              </motion.div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-xl block">💰</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
                  Total {periodLabel}
                </span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-mono block">
                  {formatMoney(totalAmount, currency)}
                </span>
                <span className="text-[10px] text-cyan-200/70 block">{currency}</span>
              </div>
            )}
          </div>
        </div>

        {/* Leyenda Detallada con porcentaje e importe */}
        <div className="w-full flex-1 space-y-2">
          <span className="text-[11px] font-bold text-white/70 block">
            Leyenda por categoría ({currency}):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => {
              const isHovered = hoveredCategory === item.category;
              return (
                <div
                  key={item.category}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() =>
                    setHoveredCategory(hoveredCategory === item.category ? null : item.category)
                  }
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isHovered
                      ? 'bg-white/15 border-cyan-400 ring-1 ring-cyan-300/40 shadow-md scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.category}</span>
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-300 font-mono block">
                      {formatMoney(item.amount, currency)}
                    </span>
                    <span className="text-[10px] font-bold text-cyan-300 block">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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

  const myName = me.name || 'Yorsh';
  const partnerName = partner.name || 'Anita';

  const [selectedCurrency, setSelectedCurrency] = useState<ExpenseCurrency>('CLP');

  // Alcance de gastos: 'me' (Por defecto: Mis Gastos separados) | 'partner' (Gastos de pareja solicitados) | 'shared' (Balance conjunto 50/50)
  const [expenseScope, setExpenseScope] = useState<'me' | 'partner' | 'shared'>('me');
  // Privacidad explícita: Solo si uno lo solicita puede ver los gastos de la pareja
  const [hasRequestedPartnerExpenses, setHasRequestedPartnerExpenses] = useState<boolean>(false);
  // Visibilidad del balance: Por defecto oculto hasta que el usuario pulse "Generar balance 📊"
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(false);

  // Filtro temporal para el desglose: Total vs Mensual vs Semanal
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

  const [notice, setNotice] = useState<string | null>(null);

  const balanceSectionRef = useRef<HTMLDivElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Categorías dinámicas
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

  // Helper para computar estadísticas de cualquier subconjunto de gastos filtrado estrictamente por la divisa activa
  const computeStatsFor = (items: ExpenseItem[], currency: ExpenseCurrency) => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let total = 0;
    let weekly = 0;
    let monthly = 0;

    const totalByCategory: Record<string, number> = {};
    const weeklyByCategory: Record<string, number> = {};
    const monthlyByCategory: Record<string, number> = {};

    // Filtrar estrictamente por la moneda seleccionada para no sumar monedas distintas
    const filteredItems = items.filter((e) => (e.currency || 'CLP') === currency);

    filteredItems.forEach((e) => {
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

      totalByCategory[e.category] = (totalByCategory[e.category] || 0) + amt;
    });

    const categoryBreakdown = Object.entries(totalByCategory)
      .map(([cat, totalSum]) => {
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
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return { total, weekly, monthly, categoryBreakdown, currency, itemCount: filteredItems.length };
  };

  // Estadísticas separadas para Mí (Yorsh), Pareja (Anita) y Combinado en la divisa seleccionada
  const myExpenses = useMemo(() => expenses.filter((e) => e.creator === 'me'), [expenses]);
  const partnerExpenses = useMemo(() => expenses.filter((e) => e.creator === 'partner'), [expenses]);

  const statsMe = useMemo(() => computeStatsFor(myExpenses, selectedCurrency), [myExpenses, selectedCurrency]);
  const statsPartner = useMemo(() => computeStatsFor(partnerExpenses, selectedCurrency), [partnerExpenses, selectedCurrency]);
  const statsShared = useMemo(() => computeStatsFor(expenses, selectedCurrency), [expenses, selectedCurrency]);

  // Selección de estadísticas activas según el alcance seleccionado
  const activeStats =
    expenseScope === 'me'
      ? statsMe
      : expenseScope === 'partner'
      ? statsPartner
      : statsShared;

  // Gastos a mostrar en la vista previa
  const previewExpenses =
    expenseScope === 'me'
      ? myExpenses
      : expenseScope === 'partner'
      ? partnerExpenses
      : expenses;

  // SUGERENCIAS INTELIGENTES DERIVADAS EXCLUSIVAMENTE DEL HISTORIAL REAL GUARDADO
  const smartSuggestions = useMemo<ExpenseSuggestion[]>(() => {
    if (!expenses || expenses.length === 0) return [];

    const validExpenses = expenses.filter((e) => Number(e.amount) > 0);
    if (validExpenses.length === 0) return [];

    // Agrupar por categoría + moneda
    const groups = new Map<string, ExpenseItem[]>();
    validExpenses.forEach((exp) => {
      const cat = (exp.category || 'Varios').trim();
      const curr = exp.currency || 'CLP';
      const key = `${cat}___${curr}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(exp);
    });

    const list: ExpenseSuggestion[] = [];

    groups.forEach((items, key) => {
      const [cat, curr] = key.split('___');
      const currency = (curr as ExpenseCurrency) || 'CLP';
      const frequency = items.length;

      // Calcular importe habitual: la moda (el valor más repetido) o promedio redondeado
      const amountCounts = new Map<number, number>();
      let sum = 0;
      items.forEach((it) => {
        const amt = Number(it.amount) || 0;
        sum += amt;
        amountCounts.set(amt, (amountCounts.get(amt) || 0) + 1);
      });

      let habitualAmount = Math.round(sum / items.length);
      let highestAmtFreq = 0;
      amountCounts.forEach((count, val) => {
        if (count > highestAmtFreq) {
          highestAmtFreq = count;
          habitualAmount = val;
        }
      });

      // Concepto o descripción habitual
      const descCounts = new Map<string, number>();
      items.forEach((it) => {
        const d = (it.description || '').trim();
        if (d && d.toLowerCase() !== cat.toLowerCase()) {
          descCounts.set(d, (descCounts.get(d) || 0) + 1);
        }
      });

      let habitualDesc = '';
      let highestDescFreq = 0;
      descCounts.forEach((count, d) => {
        if (count > highestDescFreq) {
          highestDescFreq = count;
          habitualDesc = d;
        }
      });

      if (!habitualDesc) {
        const withDesc = items.filter((it) => it.description && it.description.trim());
        if (withDesc.length > 0) {
          habitualDesc = withDesc[withDesc.length - 1].description.trim();
        }
      }

      const sortedByDate = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      list.push({
        category: cat,
        amount: habitualAmount,
        currency,
        description: habitualDesc,
        frequency,
        lastUsedDate: sortedByDate[0]?.date,
      });
    });

    // Ordenar priorizando la moneda actual y mayor frecuencia
    return list
      .sort((a, b) => {
        const aMatch = a.currency === selectedCurrency ? 1 : 0;
        const bMatch = b.currency === selectedCurrency ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return b.frequency - a.frequency;
      })
      .slice(0, 6);
  }, [expenses, selectedCurrency]);

  // Rellenar formulario con sugerencia (sin registrar automáticamente ningún gasto)
  const handleSelectSuggestion = (sugg: ExpenseSuggestion) => {
    setAmountInput(String(sugg.amount));
    setCategoryInput(sugg.category);
    setCustomCategoryInput('');
    setDescriptionInput(sugg.description || '');
    setCurrencyInput(sugg.currency);
    setSelectedCurrency(sugg.currency);
    showQuickNotice(
      `✓ Formulario rellenado con sugerencia de "${sugg.category}". Revisa o edita los campos y presiona Añadir Gasto.`
    );
    try {
      playTone('water');
    } catch {}
  };

  // DATOS DERIVADOS PARA EL GRÁFICO DE TORTA
  const pieChartItems = useMemo(() => {
    return activeStats.categoryBreakdown
      .map((item, idx) => {
        const amt =
          balancePeriodFilter === 'monthly'
            ? item.monthlyAmount
            : balancePeriodFilter === 'weekly'
            ? item.weeklyAmount
            : item.totalAmount;

        const baseTotal =
          balancePeriodFilter === 'monthly'
            ? activeStats.monthly
            : balancePeriodFilter === 'weekly'
            ? activeStats.weekly
            : activeStats.total;

        const pct = baseTotal > 0 ? (amt / baseTotal) * 100 : 0;

        return {
          category: item.category,
          amount: amt,
          percentage: pct,
          color: getCategoryColor(item.category),
          icon: getCategoryIcon(item.category),
        };
      })
      .filter((item) => item.amount > 0);
  }, [
    activeStats.categoryBreakdown,
    activeStats.monthly,
    activeStats.weekly,
    activeStats.total,
    balancePeriodFilter,
  ]);

  const pieChartTotal = useMemo(() => {
    return balancePeriodFilter === 'monthly'
      ? activeStats.monthly
      : balancePeriodFilter === 'weekly'
      ? activeStats.weekly
      : activeStats.total;
  }, [balancePeriodFilter, activeStats.monthly, activeStats.weekly, activeStats.total]);

  // FUNCIÓN PRINCIPAL DEL BOTÓN "SOY UN COMPRADOR CTM" (VALIDACIÓN ESTRICTA)
  const handleSoyUnCompradorCTM = () => {
    const finalAmount = parseCleanAmount(amountInput);

    if (!finalAmount || finalAmount <= 0) {
      showQuickNotice('⚠️ Por favor ingresa un monto válido mayor a 0 para registrar el gasto.');
      try {
        playTone('water');
      } catch {}
      return;
    }

    const finalCat = (
      customCategoryInput.trim() ||
      categoryInput ||
      'Varios'
    ).trim();

    const finalDesc = (
      descriptionInput.trim() ||
      `Gasto en ${finalCat}`
    ).trim();

    const finalDate = dateInput || new Date().toISOString().slice(0, 10);
    const finalCurrency = currencyInput || selectedCurrency;

    addExpense({
      date: finalDate,
      category: finalCat,
      description: finalDesc,
      amount: finalAmount,
      currency: finalCurrency,
    });

    // Asegurar que el usuario esté en su vista de gastos propios para ver la entrada inmediatamente
    setExpenseScope('me');

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

    setTimeout(() => {
      if (previewSectionRef.current) {
        previewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // CONTROL DEL BOTÓN PRINCIPAL "GENERAR BALANCE 📊" / "OCULTAR BALANCE"
  const toggleBalanceVisibility = () => {
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
      showQuickNotice('Balance y gráficos ocultados.');
    } else {
      setIsBalanceVisible(true);
      try {
        playTone('cathedral_bells');
      } catch {}
      try {
        trigger3DConfetti();
      } catch {}
      showQuickNotice(
        '📊 ¡Balance generado con éxito! Consulta los totales y el gráfico de torta abajo.'
      );

      setTimeout(() => {
        if (balanceSectionRef.current) {
          balanceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
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
                {myName} & {partnerName}
              </span>
            </h3>
            <p className="text-xs text-white/70">
              Gastos separados por usuario. Cada uno registra lo suyo y se suman automáticamente en un total, semanal y mensual.
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

      {/* CONTROL DE SEPARACIÓN DE GASTOS EXIGIDO POR EL USUARIO */}
      <div className="p-3 sm:p-4 rounded-3xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-base">🔒</span>
          <div>
            <span className="text-xs font-black text-white block">
              Separación de Gastos:
            </span>
            <span className="text-[11px] text-white/60 block">
              Tus gastos y los de {partnerName} están separados. Solo si lo solicitas puedes ver los de tu pareja.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-2xl border border-white/10 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setExpenseScope('me')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              expenseScope === 'me'
                ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400/50'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mis Gastos ({myName})</span>
          </button>

          <button
            type="button"
            onClick={() => setExpenseScope('partner')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              expenseScope === 'partner'
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            title={`Solicitar ver los gastos de ${partnerName}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver de {partnerName} 👁️</span>
          </button>

          <button
            type="button"
            onClick={() => setExpenseScope('shared')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              expenseScope === 'shared'
                ? 'bg-cyan-500 text-black shadow-md ring-2 ring-cyan-300/50'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            title="Ver balance conjunto de ambos"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dúo 50/50 ⚖️</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: FORMULARIO DIRECTO Y BOTÓN "SOY UN COMPRADOR CTM" */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1b1226] via-[#141220] to-[#121626] border-2 border-amber-400/50 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h4 className="text-base sm:text-lg font-black text-amber-200 font-heading">
              Ingresar Nuevo Gasto de {myName}
            </h4>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Suma Automática
          </span>
        </div>

        {/* SECCIÓN: SUGERENCIAS DE TUS GASTOS ANTERIORES (BASADAS EN EL HISTORIAL REAL) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sugerencias de tus gastos anteriores:</span>
            </label>
            {smartSuggestions.length > 0 && (
              <span className="text-[10px] text-white/50 font-medium">
                Toca una sugerencia para rellenar
              </span>
            )}
          </div>

          {smartSuggestions.length === 0 ? (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-1">
              <p className="text-xs text-white/60">
                Todavía no hay suficientes gastos anteriores para generar sugerencias. Registra tu primer gasto y aquí aparecerán recomendaciones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {smartSuggestions.map((sugg) => (
                <button
                  key={`${sugg.category}-${sugg.currency}-${sugg.amount}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(sugg)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-black text-white truncate flex items-center gap-1.5">
                      <span>{getCategoryIcon(sugg.category)}</span>
                      <span className="truncate">{sugg.category}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                      {sugg.frequency} {sugg.frequency === 1 ? 'vez' : 'veces'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <span className="text-sm font-black text-amber-300 font-mono">
                      {formatMoney(sugg.amount, sugg.currency)}
                    </span>
                    <span className="text-[10px] text-white/50 group-hover:text-amber-200 transition-colors">
                      Usar ✍️
                    </span>
                  </div>

                  {sugg.description && (
                    <span className="text-[10px] text-white/50 truncate block mt-0.5">
                      {sugg.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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

      {/* ACCIÓN PRINCIPAL: BOTÓN "GENERAR BALANCE 📊" / "OCULTAR BALANCE" */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border-2 border-cyan-400/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-cyan-200 font-heading flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Balance Financiero de Gastos</span>
          </h4>
          <p className="text-xs text-white/70 max-w-md">
            {isBalanceVisible
              ? 'Mostrando totales sumados, balance mensual/semanal, desglose por categoría y gráfico de torta en tiempo real.'
              : 'Presiona para calcular y desplegar los balances acumulados, mensual, semanal y el gráfico de torta de tus gastos reales.'}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleBalanceVisibility}
          className={`py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all shrink-0 ${
            isBalanceVisible
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
          }`}
        >
          {isBalanceVisible ? (
            <>
              <EyeOff className="w-5 h-5" />
              <span>Ocultar balance</span>
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              <span>Generar balance 📊</span>
            </>
          )}
        </button>
      </div>

      {/* SECCIÓN 2: BALANCE GENERADO (TOTAL, MENSUAL, SEMANAL, REPARTO Y GRÁFICO DE TORTA) - OCULTO POR DEFECTO */}
      <AnimatePresence>
        {isBalanceVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
                    Balance Generado:{' '}
                    {expenseScope === 'me'
                      ? `Mis Gastos (${myName})`
                      : expenseScope === 'partner'
                      ? `Gastos de Pareja (${partnerName})`
                      : `Balance Compartido Dúo (${myName} & ${partnerName})`}
                  </h3>
                  <p className="text-xs text-cyan-200/80">
                    Gastos en {selectedCurrency} sumados automáticamente en tiempo real
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

            {/* PRIVACIDAD EXPLÍCITA DE PAREJA: Solo si uno lo solicita puede ver los gastos de la pareja */}
            {expenseScope === 'partner' && !hasRequestedPartnerExpenses ? (
              <div className="p-8 rounded-3xl bg-purple-950/40 border-2 border-purple-500/40 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  🔒
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-black text-purple-200 font-heading">
                    Gastos Separados y Privados de {partnerName}
                  </h4>
                  <p className="text-xs text-white/70 max-w-md mx-auto">
                    Los gastos tuyos ({myName}) y los de tu pareja ({partnerName}) están separados de forma independiente. Por privacidad, solo si lo solicitas explícitamente se calcula y muestra el balance de {partnerName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasRequestedPartnerExpenses(true);
                    showQuickNotice(`👁️ Has solicitado ver los gastos de ${partnerName}.`);
                    try {
                      playTone('water');
                    } catch {}
                  }}
                  className="py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Solicitar y Ver Gastos de {partnerName} 👁️</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. TARJETAS DEL TOTAL SUMADO: TOTAL GENERAL, MENSUAL Y SEMANAL */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-amber-300 block">
                      💰 Gasto Total Acumulado ({selectedCurrency}):
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                      {formatMoney(activeStats.total, selectedCurrency)}
                    </div>
                    <p className="text-[10px] text-white/50">Todos los gastos sumados</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-300 block">
                      📅 Balance Mensual ({selectedCurrency}):
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-200 font-mono">
                      {formatMoney(activeStats.monthly, selectedCurrency)}
                    </div>
                    <p className="text-[10px] text-emerald-300/60">Gastos de este mes</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-1">
                    <span className="text-[11px] font-bold text-purple-300 block">
                      ⏱️ Balance Semanal ({selectedCurrency}):
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-purple-200 font-mono">
                      {formatMoney(activeStats.weekly, selectedCurrency)}
                    </div>
                    <p className="text-[10px] text-purple-300/60">Gastos últimos 7 días</p>
                  </div>
                </div>

                {/* 2. SI ESTÁ EN MODO COMPARTIDO DÚO, MOSTRAR REPARTO Y BALANCE 50/50 */}
                {expenseScope === 'shared' && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-rose-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-rose-400" />
                        {myName}: {formatMoney(statsMe.total, selectedCurrency)}
                      </span>
                      <span className="text-purple-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        {partnerName}: {formatMoney(statsPartner.total, selectedCurrency)}
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all"
                        style={{
                          width: `${
                            statsShared.total > 0
                              ? (statsMe.total / statsShared.total) * 100
                              : 50
                          }%`,
                        }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                        style={{
                          width: `${
                            statsShared.total > 0
                              ? (statsPartner.total / statsShared.total) * 100
                              : 50
                          }%`,
                        }}
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        {statsMe.total === statsPartner.total
                          ? '✨ ¡Están exactamente 50/50! Ambos han aportado equitativamente.'
                          : statsMe.total > statsPartner.total
                          ? `${myName} ha pagado ${formatMoney(
                              statsMe.total - statsPartner.total,
                              selectedCurrency
                            )} más. Para compensar 50/50, ${partnerName} debería aportar ${formatMoney(
                              (statsMe.total - statsPartner.total) / 2,
                              selectedCurrency
                            )}.`
                          : `${partnerName} ha pagado ${formatMoney(
                              statsPartner.total - statsMe.total,
                              selectedCurrency
                            )} más. Para compensar 50/50, ${myName} debería aportar ${formatMoney(
                              (statsPartner.total - statsMe.total) / 2,
                              selectedCurrency
                            )}.`}
                      </span>
                    </div>
                  </div>
                )}

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
                      {activeStats.categoryBreakdown.length} categorías registradas
                    </span>
                  </div>

                  {activeStats.categoryBreakdown.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-white/50">
                      No hay gastos registrados en {selectedCurrency} en esta vista todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeStats.categoryBreakdown.map((item) => {
                        const displayAmt =
                          balancePeriodFilter === 'monthly'
                            ? item.monthlyAmount
                            : balancePeriodFilter === 'weekly'
                            ? item.weeklyAmount
                            : item.totalAmount;

                        const baseTotal =
                          balancePeriodFilter === 'monthly'
                            ? activeStats.monthly
                            : balancePeriodFilter === 'weekly'
                            ? activeStats.weekly
                            : activeStats.total;

                        const pct = baseTotal > 0 ? (displayAmt / baseTotal) * 100 : 0;

                        const catColor = getCategoryColor(item.category);

                        return (
                          <div
                            key={item.category}
                            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-cyan-400/40 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-white flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: catColor }}
                                />
                                <span>{getCategoryIcon(item.category)}</span>
                                <span className="truncate">{item.category}</span>
                              </span>
                              <span className="text-amber-300 font-mono font-black shrink-0">
                                {formatMoney(displayAmt, selectedCurrency)} ({pct.toFixed(1)}%)
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: catColor,
                                  boxShadow: `0 0 8px ${catColor}60`,
                                }}
                              />
                            </div>

                            {/* Detalle complementario mensual y semanal */}
                            <div className="flex justify-between text-[10px] text-white/50 font-mono pt-0.5">
                              <span>Semanal: {formatMoney(item.weeklyAmount, selectedCurrency)}</span>
                              <span>Mensual: {formatMoney(item.monthlyAmount, selectedCurrency)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. GRÁFICO DE TORTA EN LA PARTE INFERIOR DEL BALANCE */}
                <CategoryPieChart
                  items={pieChartItems}
                  totalAmount={pieChartTotal}
                  currency={selectedCurrency}
                  periodLabel={
                    balancePeriodFilter === 'monthly'
                      ? 'Este Mes'
                      : balancePeriodFilter === 'weekly'
                      ? 'Esta Semana'
                      : 'Total Acumulado'
                  }
                  formatMoney={formatMoney}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

          <div className="flex items-center gap-2 text-xs font-bold text-white/70">
            {expenseScope === 'me' ? (
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                👤 Mostrando solo tus gastos ({myName})
              </span>
            ) : expenseScope === 'partner' ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {hasRequestedPartnerExpenses
                    ? `👁️ Gastos de ${partnerName} desbloqueados`
                    : `🔒 Gastos de ${partnerName} protegidos`}
                </span>
                {hasRequestedPartnerExpenses && (
                  <button
                    type="button"
                    onClick={() => {
                      setHasRequestedPartnerExpenses(false);
                      showQuickNotice(`🔒 Vista de gastos de ${partnerName} ocultada.`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Ocultar</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ⚖️ Mostrando gastos compartidos
              </span>
            )}
          </div>
        </div>

        {expenseScope === 'partner' && !hasRequestedPartnerExpenses ? (
          <div className="p-8 rounded-3xl bg-purple-950/30 border-2 border-purple-500/30 text-center space-y-3">
            <div className="text-3xl">🔒</div>
            <h4 className="text-base font-black text-purple-200">
              Registros Privados de {partnerName}
            </h4>
            <p className="text-xs text-white/70 max-w-md mx-auto">
              Los gastos de {myName} y {partnerName} están separados. Solo si lo solicitas se desplegarán los gastos individuales de {partnerName}.
            </p>
            <button
              type="button"
              onClick={() => {
                setHasRequestedPartnerExpenses(true);
                showQuickNotice(`👁️ Mostrando registros de ${partnerName}.`);
                try { playTone('water'); } catch {}
              }}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Solicitar Ver Gastos de {partnerName}</span>
            </button>
          </div>
        ) : previewExpenses.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
            <div className="text-3xl">🛒</div>
            <p className="text-sm font-bold text-white/80">No hay gastos en esta vista.</p>
            <p className="text-xs text-white/50">
              Presiona el botón <span className="text-amber-300 font-bold">"Soy Un Comprador CTM"</span> arriba para registrar uno nuevo.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {previewExpenses.map((exp) => {
              const isMine = exp.creator === 'me';
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
                            ? `👤 Registrado por ti (${myName})`
                            : `🐼 Registrado por ${partnerName}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LADO DERECHO: MONTO Y ACCIONES SEGÚN PERMISOS */}
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
                        title={`Este gasto fue creado por ${partnerName}. Modo solo lectura.`}
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
