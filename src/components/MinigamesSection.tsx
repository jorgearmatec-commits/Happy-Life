import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dices,
  Trophy,
  Sparkles,
  RotateCcw,
  Bot,
  Users,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThreeDice3D } from './ThreeDice3D';
import { playTone } from './AudioSynthesizer';

// =========================================================================
// 1. TIPOS Y UTILIDADES PARA LA BARAJA ESPAÑOLA (LA ESCOBA DEL 15)
// =========================================================================
export type SpanishSuit = 'oros' | 'copas' | 'espadas' | 'bastos';

export interface SpanishCard {
  id: string;
  suit: SpanishSuit;
  rank: number; // 1, 2, 3, 4, 5, 6, 7, 10, 11, 12
  value: number; // 1, 2, 3, 4, 5, 6, 7, Sota(10)=8, Caballo(11)=9, Rey(12)=10
}

const SUIT_ICONS: Record<SpanishSuit, { emoji: string; name: string; color: string; border: string }> = {
  oros: { emoji: '🟡', name: 'Oros', color: 'text-amber-400', border: 'border-amber-400' },
  copas: { emoji: '🏆', name: 'Copas', color: 'text-rose-400', border: 'border-rose-400' },
  espadas: { emoji: '⚔️', name: 'Espadas', color: 'text-sky-400', border: 'border-sky-400' },
  bastos: { emoji: '🪵', name: 'Bastos', color: 'text-emerald-400', border: 'border-emerald-400' },
};

const RANK_NAMES: Record<number, string> = {
  1: 'As',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'Sota (8)',
  11: 'Caballo (9)',
  12: 'Rey (10)',
};

// Generar baraja española tradicional de 40 cartas
export const createSpanishDeck = (): SpanishCard[] => {
  const suits: SpanishSuit[] = ['oros', 'copas', 'espadas', 'bastos'];
  const ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck: SpanishCard[] = [];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      let value = rank;
      if (rank === 10) value = 8;
      else if (rank === 11) value = 9;
      else if (rank === 12) value = 10;

      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        value,
      });
    });
  });

  // Mezclar Baraja (Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// =========================================================================
// 2. TIPOS Y UTILIDADES PARA JUEGO "UNO EN PAREJA"
// =========================================================================
export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';

export interface UnoCard {
  id: string;
  color: UnoColor;
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
  value?: number; // 0-9
}

const UNO_COLOR_STYLES: Record<UnoColor, { bg: string; border: string; text: string; name: string }> = {
  red: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-300', name: 'Rojo' },
  yellow: { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-200', name: 'Amarillo' },
  green: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-200', name: 'Verde' },
  blue: { bg: 'bg-sky-600', border: 'border-sky-400', text: 'text-sky-200', name: 'Azul' },
  wild: { bg: 'bg-gradient-to-br from-rose-500 via-amber-500 via-emerald-500 to-sky-500', border: 'border-white', text: 'text-white', name: 'Comodín' },
};

export const createUnoDeck = (): UnoCard[] => {
  const colors: (UnoColor)[] = ['red', 'yellow', 'green', 'blue'];
  const deck: UnoCard[] = [];
  let idCounter = 0;

  colors.forEach((color) => {
    // Un 0 por color
    deck.push({ id: `uno_${idCounter++}`, color, type: 'number', value: 0 });
    // Dos de 1-9
    for (let num = 1; num <= 9; num++) {
      deck.push({ id: `uno_${idCounter++}`, color, type: 'number', value: num });
      deck.push({ id: `uno_${idCounter++}`, color, type: 'number', value: num });
    }
    // Cartas de acción (2 de cada una)
    for (let k = 0; k < 2; k++) {
      deck.push({ id: `uno_${idCounter++}`, color, type: 'skip' });
      deck.push({ id: `uno_${idCounter++}`, color, type: 'reverse' });
      deck.push({ id: `uno_${idCounter++}`, color, type: 'draw2' });
    }
  });

  // Comodines especiales
  for (let w = 0; w < 4; w++) {
    deck.push({ id: `uno_${idCounter++}`, color: 'wild', type: 'wild' });
    deck.push({ id: `uno_${idCounter++}`, color: 'wild', type: 'wild4' });
  }

  // Mezclar
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// =========================================================================
// COMPONENTE PRINCIPAL MINIJUEGOS (3 EN TOTAL)
// =========================================================================
export const MinigamesSection: React.FC = () => {
  const { me, partner, activeRole, settings, sendMessage, trigger3DConfetti, updateMyStatus } = useApp();

  const [activeGame, setActiveGame] = useState<'dice' | 'escoba' | 'uno'>('dice');

  // Nombres de display
  const currentDisplayMe = activeRole === 'me' ? me : partner;
  const currentDisplayPartner = activeRole === 'me' ? partner : me;

  // -----------------------------------------------------------------------
  // JUEGO 1: DADO DE LA VERDAD (3+3 50/50 - 10s Expectación)
  // -----------------------------------------------------------------------
  const [myNumbers, setMyNumbers] = useState<number[]>([1, 3, 5]);
  const [partnerNumbers, setPartnerNumbers] = useState<number[]>([2, 4, 6]);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceWinnerNotice, setDiceWinnerNotice] = useState<string | null>(null);
  const [diceValidationNotice, setDiceValidationNotice] = useState<string | null>(null);

  const toggleMyNumber = (num: number) => {
    if (isRollingDice) return;
    setDiceValidationNotice(null);
    setMyNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 3) return [...prev.slice(1), num];
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const togglePartnerNumber = (num: number) => {
    if (isRollingDice) return;
    setDiceValidationNotice(null);
    setPartnerNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 3) return [...prev.slice(1), num];
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const handleStartDiceRoll = () => {
    if (isRollingDice) return;
    if (myNumbers.length !== 3 || partnerNumbers.length !== 3) {
      setDiceValidationNotice('Ambos deben elegir exactamente 3 números cada uno para tener 50% de probabilidad.');
      return;
    }
    setDiceValidationNotice(null);
    setDiceWinnerNotice(null);

    playTone('digital_pulse');

    const finalNumber = Math.floor(Math.random() * 6) + 1;
    setDiceRollResult(finalNumber);
    setIsRollingDice(true);
  };

  const handleDiceAnimationComplete = (finalNumber: number) => {
    setIsRollingDice(false);

    const meName = currentDisplayMe.name || 'Yo';
    const partnerName = currentDisplayPartner.name || 'Mi Pareja';
    const myMatches = myNumbers.includes(finalNumber);
    const partnerMatches = partnerNumbers.includes(finalNumber);

    let winnerText = '';
    if (myMatches && partnerMatches) {
      winnerText = `¡Empate milagroso con el número ${finalNumber}! Ambos tenían este número seleccionado 🎉✨`;
    } else if (myMatches) {
      winnerText = `¡Gana ${meName} con el número ${finalNumber}! 🎯 (${meName}: [${myNumbers.join(', ')}] vs ${partnerName}: [${partnerNumbers.join(', ')}])`;
    } else if (partnerMatches) {
      winnerText = `¡Gana ${partnerName} con el número ${finalNumber}! 💘 (${partnerName}: [${partnerNumbers.join(', ')}] vs ${meName}: [${myNumbers.join(', ')}])`;
    } else {
      winnerText = `¡Número neutral ${finalNumber}! Ni ${meName} ni ${partnerName} tenían el ${finalNumber}. ¡Vuelvan a tirar con amor! 🎲`;
    }

    setDiceWinnerNotice(winnerText);
    try {
      trigger3DConfetti();
      playTone('peaceful_chime');
      sendMessage(`🎲 [Dado de la Verdad 50/50]: ${winnerText}`);
      updateMyStatus({ lastAction: `🎲 Tiró dado de la verdad: Salió ${finalNumber}` });
    } catch {}

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🎲 Dado de la Verdad 50/50', {
          body: winnerText,
          icon: '/icon.svg',
        });
      } catch {}
    }
  };

  // -----------------------------------------------------------------------
  // JUEGO 2: LA ESCOBA DEL 15 (Baraja Española)
  // -----------------------------------------------------------------------
  const [escobaMode, setEscobaMode] = useState<'solo' | 'couple'>('solo');
  const [escobaDeck, setEscobaDeck] = useState<SpanishCard[]>([]);
  const [escobaTable, setEscobaTable] = useState<SpanishCard[]>([]);
  const [escobaHandP1, setEscobaHandP1] = useState<SpanishCard[]>([]);
  const [escobaHandP2, setEscobaHandP2] = useState<SpanishCard[]>([]);
  const [escobaPileP1, setEscobaPileP1] = useState<SpanishCard[]>([]);
  const [escobaPileP2, setEscobaPileP2] = useState<SpanishCard[]>([]);
  const [escobaCountP1, setEscobaCountP1] = useState<number>(0);
  const [escobaCountP2, setEscobaCountP2] = useState<number>(0);
  const [escobaTurn, setEscobaTurn] = useState<'p1' | 'p2'>('p1');
  const [escobaLastTaker, setEscobaLastTaker] = useState<'p1' | 'p2' | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<SpanishCard | null>(null);
  const [selectedTableCards, setSelectedTableCards] = useState<SpanishCard[]>([]);
  const [escobaMessage, setEscobaMessage] = useState<string>('Selecciona una carta de tu mano y las cartas de la mesa que sumen 15.');
  const [escobaGameOver, setEscobaGameOver] = useState<boolean>(false);

  // Iniciar partida de Escoba
  const startNewEscobaGame = () => {
    const freshDeck = createSpanishDeck();
    const tableCards = freshDeck.slice(0, 4);
    const p1Cards = freshDeck.slice(4, 7);
    const p2Cards = freshDeck.slice(7, 10);
    const remainingDeck = freshDeck.slice(10);

    setEscobaDeck(remainingDeck);
    setEscobaTable(tableCards);
    setEscobaHandP1(p1Cards);
    setEscobaHandP2(p2Cards);
    setEscobaPileP1([]);
    setEscobaPileP2([]);
    setEscobaCountP1(0);
    setEscobaCountP2(0);
    setEscobaTurn('p1');
    setEscobaLastTaker(null);
    setSelectedHandCard(null);
    setSelectedTableCards([]);
    setEscobaGameOver(false);
    setEscobaMessage('¡Partida iniciada! Es el turno de ' + (currentDisplayMe.name || 'Jugador 1'));
    playTone('water');
  };

  useEffect(() => {
    if (activeGame === 'escoba' && escobaDeck.length === 0 && escobaTable.length === 0 && !escobaGameOver) {
      startNewEscobaGame();
    }
  }, [activeGame]);

  // Selección de cartas de la mesa en Escoba
  const toggleSelectTableCard = (card: SpanishCard) => {
    setSelectedTableCards((prev) =>
      prev.some((c) => c.id === card.id) ? prev.filter((c) => c.id !== card.id) : [...prev, card]
    );
  };

  // Suma actual de cartas seleccionadas
  const currentEscobaSum = (selectedHandCard ? selectedHandCard.value : 0) +
    selectedTableCards.reduce((acc, c) => acc + c.value, 0);

  // Ejecutar jugada de Escoba
  const handlePlayEscobaCard = () => {
    if (!selectedHandCard) return;

    const isP1 = escobaTurn === 'p1';
    const currentHand = isP1 ? escobaHandP1 : escobaHandP2;
    const currentName = isP1 ? (currentDisplayMe.name || 'Jugador 1') : (escobaMode === 'solo' ? 'Pareja Virtual 🤖' : (currentDisplayPartner.name || 'Jugador 2'));

    // Caso A: Se captura sumando 15
    if (currentEscobaSum === 15 && selectedTableCards.length > 0) {
      const remainingTable = escobaTable.filter(
        (tc) => !selectedTableCards.some((sc) => sc.id === tc.id)
      );
      const isEscobaSweep = remainingTable.length === 0;

      const capturedCards = [selectedHandCard, ...selectedTableCards];

      if (isP1) {
        setEscobaPileP1((prev) => [...prev, ...capturedCards]);
        setEscobaHandP1((prev) => prev.filter((c) => c.id !== selectedHandCard.id));
        if (isEscobaSweep) {
          setEscobaCountP1((prev) => prev + 1);
          trigger3DConfetti();
          playTone('peaceful_chime');
        } else {
          playTone('zen_bowl');
        }
      } else {
        setEscobaPileP2((prev) => [...prev, ...capturedCards]);
        setEscobaHandP2((prev) => prev.filter((c) => c.id !== selectedHandCard.id));
        if (isEscobaSweep) {
          setEscobaCountP2((prev) => prev + 1);
          trigger3DConfetti();
          playTone('peaceful_chime');
        } else {
          playTone('zen_bowl');
        }
      }

      setEscobaTable(remainingTable);
      setEscobaLastTaker(isP1 ? 'p1' : 'p2');

      const notice = isEscobaSweep
        ? `🧹 ¡¡ESCOBA de ${currentName}!! Limpia la mesa (+1 Punto) 🎉`
        : `✅ ${currentName} suma 15 y captura ${capturedCards.length} cartas`;
      setEscobaMessage(notice);

      advanceEscobaTurn(isP1, remainingTable);
    } else {
      // Caso B: Descartar a la mesa
      const newTable = [...escobaTable, selectedHandCard];
      if (isP1) {
        setEscobaHandP1((prev) => prev.filter((c) => c.id !== selectedHandCard.id));
      } else {
        setEscobaHandP2((prev) => prev.filter((c) => c.id !== selectedHandCard.id));
      }
      setEscobaTable(newTable);
      setEscobaMessage(`🃏 ${currentName} no suma 15 y deja el ${RANK_NAMES[selectedHandCard.rank]} de ${SUIT_ICONS[selectedHandCard.suit].name} en la mesa`);
      playTone('harpa');

      advanceEscobaTurn(isP1, newTable);
    }

    setSelectedHandCard(null);
    setSelectedTableCards([]);
  };

  // Avanzar turno y repartir nuevas manos si se acaban las 3 cartas
  const advanceEscobaTurn = (wasP1: boolean, currentTableState: SpanishCard[]) => {
    const nextTurn = wasP1 ? 'p2' : 'p1';

    // Verificar si ambos jugadores se quedan sin cartas
    const remainingP1Count = wasP1 ? escobaHandP1.length - 1 : escobaHandP1.length;
    const remainingP2Count = !wasP1 ? escobaHandP2.length - 1 : escobaHandP2.length;

    if (remainingP1Count === 0 && remainingP2Count === 0) {
      if (escobaDeck.length >= 6) {
        // Repartir 3 más a cada uno
        const newP1 = escobaDeck.slice(0, 3);
        const newP2 = escobaDeck.slice(3, 6);
        const nextDeck = escobaDeck.slice(6);

        setTimeout(() => {
          setEscobaHandP1(newP1);
          setEscobaHandP2(newP2);
          setEscobaDeck(nextDeck);
          setEscobaMessage(`🎴 Se reparten 3 nuevas cartas a cada uno. Quedan ${nextDeck.length} en el mazo.`);
        }, 1000);
      } else {
        // Fin de la partida
        setTimeout(() => {
          finalizeEscobaRound(currentTableState);
        }, 1200);
        return;
      }
    }

    setEscobaTurn(nextTurn);

    // Si es modo solitario y le toca a la máquina/pareja virtual
    if (escobaMode === 'solo' && nextTurn === 'p2') {
      setTimeout(() => {
        executeBotEscobaMove(currentTableState);
      }, 1500);
    }
  };

  // Bot inteligente para Escoba en Solitario
  const executeBotEscobaMove = (tableCards: SpanishCard[]) => {
    setEscobaHandP2((currentHandP2) => {
      if (currentHandP2.length === 0) return currentHandP2;

      // Buscar si alguna carta suma 15
      let bestPlay: { handCard: SpanishCard; tableSelection: SpanishCard[] } | null = null;

      for (const hCard of currentHandP2) {
        // Probar combinaciones de mesa (1, 2, 3 o 4 cartas)
        const target = 15 - hCard.value;
        if (target <= 0) continue;

        // Combinación individual
        const singleMatch = tableCards.find((tc) => tc.value === target);
        if (singleMatch) {
          bestPlay = { handCard: hCard, tableSelection: [singleMatch] };
          break;
        }

        // Combinación de 2 cartas
        for (let i = 0; i < tableCards.length; i++) {
          for (let j = i + 1; j < tableCards.length; j++) {
            if (tableCards[i].value + tableCards[j].value === target) {
              bestPlay = { handCard: hCard, tableSelection: [tableCards[i], tableCards[j]] };
              break;
            }
          }
          if (bestPlay) break;
        }
        if (bestPlay) break;
      }

      if (bestPlay) {
        const remainingTable = tableCards.filter(
          (tc) => !bestPlay!.tableSelection.some((sc) => sc.id === tc.id)
        );
        const isSweep = remainingTable.length === 0;
        const captured = [bestPlay.handCard, ...bestPlay.tableSelection];

        setEscobaPileP2((prev) => [...prev, ...captured]);
        setEscobaTable(remainingTable);
        setEscobaLastTaker('p2');

        if (isSweep) {
          setEscobaCountP2((c) => c + 1);
          setEscobaMessage(`🧹 ¡La Pareja Virtual hace ESCOBA! (+1 Punto)`);
          playTone('zen_bowl');
        } else {
          setEscobaMessage(`🤖 Tu Pareja suma 15 con el ${RANK_NAMES[bestPlay.handCard.rank]} y captura cartas`);
          playTone('water');
        }

        advanceEscobaTurn(false, remainingTable);
        return currentHandP2.filter((c) => c.id !== bestPlay!.handCard.id);
      } else {
        // Descartar la carta de menor valor
        const discard = [...currentHandP2].sort((a, b) => a.value - b.value)[0];
        const newTable = [...tableCards, discard];
        setEscobaTable(newTable);
        setEscobaMessage(`🤖 Tu Pareja deja el ${RANK_NAMES[discard.rank]} de ${SUIT_ICONS[discard.suit].name} en la mesa`);
        playTone('harpa');

        advanceEscobaTurn(false, newTable);
        return currentHandP2.filter((c) => c.id !== discard.id);
      }
    });
  };

  // Finalizar partida y contar puntos de Escoba
  const finalizeEscobaRound = (remainingTable: SpanishCard[]) => {
    setEscobaGameOver(true);

    // Las cartas sobrantes van al último que capturó
    let finalP1Pile = [...escobaPileP1];
    let finalP2Pile = [...escobaPileP2];
    if (escobaLastTaker === 'p1') {
      finalP1Pile = [...finalP1Pile, ...remainingTable];
      setEscobaPileP1(finalP1Pile);
    } else if (escobaLastTaker === 'p2') {
      finalP2Pile = [...finalP2Pile, ...remainingTable];
      setEscobaPileP2(finalP2Pile);
    }
    setEscobaTable([]);

    // Cálculo tradicional de puntos de Escoba:
    // 1. Escobas limpias
    let scoreP1 = escobaCountP1;
    let scoreP2 = escobaCountP2;

    // 2. Mayoría de cartas (1 punto)
    if (finalP1Pile.length > finalP2Pile.length) scoreP1 += 1;
    else if (finalP2Pile.length > finalP1Pile.length) scoreP2 += 1;

    // 3. Mayoría de oros (1 punto)
    const orosP1 = finalP1Pile.filter((c) => c.suit === 'oros').length;
    const orosP2 = finalP2Pile.filter((c) => c.suit === 'oros').length;
    if (orosP1 > orosP2) scoreP1 += 1;
    else if (orosP2 > orosP1) scoreP2 += 1;

    // 4. El Siete de Oros / Velos (1 punto)
    const hasSieteOrosP1 = finalP1Pile.some((c) => c.suit === 'oros' && c.rank === 7);
    const hasSieteOrosP2 = finalP2Pile.some((c) => c.suit === 'oros' && c.rank === 7);
    if (hasSieteOrosP1) scoreP1 += 1;
    if (hasSieteOrosP2) scoreP2 += 1;

    // 5. Mayoría de sietes (1 punto)
    const sietesP1 = finalP1Pile.filter((c) => c.rank === 7).length;
    const sietesP2 = finalP2Pile.filter((c) => c.rank === 7).length;
    if (sietesP1 > sietesP2) scoreP1 += 1;
    else if (sietesP2 > sietesP1) scoreP2 += 1;

    trigger3DConfetti();
    playTone('cathedral_bells');

    const winnerName = scoreP1 > scoreP2
      ? (currentDisplayMe.name || 'Jugador 1')
      : scoreP2 > scoreP1
      ? (escobaMode === 'solo' ? 'Pareja Virtual' : (currentDisplayPartner.name || 'Jugador 2'))
      : '¡Empate!';

    setEscobaMessage(
      `🏆 ¡Fin de la partida! Ganador: ${winnerName} (${scoreP1} pts vs ${scoreP2} pts). Cartas: ${finalP1Pile.length} vs ${finalP2Pile.length}, Oros: ${orosP1} vs ${orosP2}.`
    );
  };

  // -----------------------------------------------------------------------
  // JUEGO 3: UNO EN PAREJA
  // -----------------------------------------------------------------------
  const [unoMode, setUnoMode] = useState<'solo' | 'couple'>('solo');
  const [unoDeck, setUnoDeck] = useState<UnoCard[]>([]);
  const [unoDiscard, setUnoDiscard] = useState<UnoCard[]>([]);
  const [unoHandP1, setUnoHandP1] = useState<UnoCard[]>([]);
  const [unoHandP2, setUnoHandP2] = useState<UnoCard[]>([]);
  const [unoTurn, setUnoTurn] = useState<'p1' | 'p2'>('p1');
  const [unoActiveColor, setUnoActiveColor] = useState<UnoColor>('red');
  const [unoSaidP1, setUnoSaidP1] = useState<boolean>(false);
  const [unoSaidP2, setUnoSaidP2] = useState<boolean>(false);
  const [unoMessage, setUnoMessage] = useState<string>('¡Bienvenido a UNO en Pareja! Tira una carta del mismo color o número.');
  const [isChoosingWildColor, setIsChoosingWildColor] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [unoGameOver, setUnoGameOver] = useState<boolean>(false);

  const startNewUnoGame = () => {
    const freshDeck = createUnoDeck();
    // Primera carta de descarte (que no sea comodín especial)
    let startCardIdx = freshDeck.findIndex((c) => c.color !== 'wild');
    if (startCardIdx === -1) startCardIdx = 0;
    const startCard = freshDeck[startCardIdx];
    const deckWithoutStart = freshDeck.filter((_, idx) => idx !== startCardIdx);

    const p1Hand = deckWithoutStart.slice(0, 7);
    const p2Hand = deckWithoutStart.slice(7, 14);
    const drawDeck = deckWithoutStart.slice(14);

    setUnoDeck(drawDeck);
    setUnoDiscard([startCard]);
    setUnoActiveColor(startCard.color);
    setUnoHandP1(p1Hand);
    setUnoHandP2(p2Hand);
    setUnoTurn('p1');
    setUnoSaidP1(false);
    setUnoSaidP2(false);
    setUnoGameOver(false);
    setIsChoosingWildColor(false);
    setPendingWildCard(null);
    setUnoMessage('¡Partida de UNO lista! Carta inicial: ' + (startCard.value !== undefined ? startCard.value : startCard.type) + ' (' + UNO_COLOR_STYLES[startCard.color].name + ')');
    playTone('water');
  };

  useEffect(() => {
    if (activeGame === 'uno' && unoDiscard.length === 0 && !unoGameOver) {
      startNewUnoGame();
    }
  }, [activeGame]);

  const topDiscard = unoDiscard[unoDiscard.length - 1];

  // Comprobar si una carta se puede tirar
  const canPlayUnoCard = (card: UnoCard) => {
    if (card.color === 'wild') return true;
    if (card.color === unoActiveColor) return true;
    if (topDiscard && card.type === topDiscard.type && card.type !== 'number') return true;
    if (topDiscard && card.type === 'number' && topDiscard.type === 'number' && card.value === topDiscard.value) return true;
    return false;
  };

  // Jugar carta de UNO
  const handlePlayUnoCard = (card: UnoCard) => {
    if (unoTurn !== 'p1') return;
    if (!canPlayUnoCard(card)) {
      setUnoMessage('⚠️ Esa carta no coincide con el color (' + UNO_COLOR_STYLES[unoActiveColor].name + ') ni con el número.');
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setIsChoosingWildColor(true);
      return;
    }

    executeUnoCardPlacement(card, card.color, 'p1');
  };

  const handleSelectWildColor = (chosenColor: UnoColor) => {
    if (!pendingWildCard) return;
    setIsChoosingWildColor(false);
    executeUnoCardPlacement(pendingWildCard, chosenColor, 'p1');
    setPendingWildCard(null);
  };

  const executeUnoCardPlacement = (card: UnoCard, resolvedColor: UnoColor, player: 'p1' | 'p2') => {
    const isP1 = player === 'p1';
    const playerName = isP1 ? (currentDisplayMe.name || 'Yo') : (unoMode === 'solo' ? 'Pareja Bot 🤖' : (currentDisplayPartner.name || 'Pareja'));

    // Quitar de la mano
    if (isP1) {
      setUnoHandP1((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setUnoHandP2((prev) => prev.filter((c) => c.id !== card.id));
    }

    // Agregar al pozo de descarte
    setUnoDiscard((prev) => [...prev, card]);
    setUnoActiveColor(resolvedColor);

    playTone('water');

    // Comprobar victoria
    const remainingCount = isP1 ? unoHandP1.length - 1 : unoHandP2.length - 1;
    if (remainingCount === 0) {
      setUnoGameOver(true);
      trigger3DConfetti();
      playTone('cathedral_bells');
      setUnoMessage(`🎉 ¡¡${playerName} SE QUEDA SIN CARTAS Y GANA LA PARTIDA DE UNO!! 🏆✨`);
      sendMessage(`🌈 [UNO en Pareja]: ¡${playerName} ha ganado la partida! 💖`);
      updateMyStatus({ lastAction: `🌈 Ganó partida de UNO en pareja` });
      return;
    }

    // Aplicar efectos de cartas especiales en 2 jugadores
    let nextTurn: 'p1' | 'p2' = isP1 ? 'p2' : 'p1';

    if (card.type === 'skip' || card.type === 'reverse') {
      // En juego de 2 jugadores, Salto y Reversa le devuelven el turno a quien la tiró
      nextTurn = player;
      setUnoMessage(`🚫 ${playerName} tira ${card.type === 'skip' ? 'Salto' : 'Reversa'} y repite turno.`);
    } else if (card.type === 'draw2') {
      // Roba 2 y salta turno
      drawCardsForPlayer(isP1 ? 'p2' : 'p1', 2);
      nextTurn = player;
      setUnoMessage(`➕2 ${playerName} obliga a robar 2 cartas a su rival y vuelve a jugar.`);
    } else if (card.type === 'wild4') {
      // Roba 4 y salta turno
      drawCardsForPlayer(isP1 ? 'p2' : 'p1', 4);
      nextTurn = player;
      setUnoMessage(`💥 Comodín +4: Cambio a ${UNO_COLOR_STYLES[resolvedColor].name}, rival roba 4 y ${playerName} repite.`);
    } else {
      setUnoMessage(`🃏 ${playerName} juega ${card.value !== undefined ? card.value : card.type} (${UNO_COLOR_STYLES[resolvedColor].name}).`);
    }

    setUnoTurn(nextTurn);

    // Si le toca a la máquina en solitario
    if (unoMode === 'solo' && nextTurn === 'p2') {
      setTimeout(() => {
        executeBotUnoTurn(resolvedColor);
      }, 1400);
    }
  };

  // Robar cartas
  const drawCardsForPlayer = (targetPlayer: 'p1' | 'p2', count: number) => {
    setUnoDeck((currentDeck) => {
      let availableDeck = [...currentDeck];
      // Si el mazo se acaba, rebarajar el descarte
      if (availableDeck.length < count) {
        const recycled = unoDiscard.slice(0, -1);
        availableDeck = [...availableDeck, ...recycled];
      }

      const drawn = availableDeck.slice(0, count);
      const remaining = availableDeck.slice(count);

      if (targetPlayer === 'p1') {
        setUnoHandP1((prev) => [...prev, ...drawn]);
      } else {
        setUnoHandP2((prev) => [...prev, ...drawn]);
      }

      return remaining;
    });
  };

  // Jugador presiona "Robar"
  const handlePlayerDraw = () => {
    if (unoTurn !== 'p1') return;
    drawCardsForPlayer('p1', 1);
    setUnoMessage('Has robado 1 carta del mazo.');
    playTone('digital_pulse');

    // Cambiar turno al rival
    setUnoTurn('p2');
    if (unoMode === 'solo') {
      setTimeout(() => {
        executeBotUnoTurn(unoActiveColor);
      }, 1400);
    }
  };

  // Bot inteligente para UNO en Solitario
  const executeBotUnoTurn = (currentColor: UnoColor) => {
    setUnoHandP2((botHand) => {
      // Buscar cartas jugables
      const playable = botHand.filter((c) => {
        if (c.color === 'wild') return true;
        if (c.color === currentColor) return true;
        if (topDiscard && c.type === topDiscard.type && c.type !== 'number') return true;
        if (topDiscard && c.type === 'number' && topDiscard.type === 'number' && c.value === topDiscard.value) return true;
        return false;
      });

      if (playable.length > 0) {
        // Elegir la mejor carta
        const cardToPlay = playable[0];
        let chosenColor: UnoColor = cardToPlay.color;
        if (cardToPlay.color === 'wild') {
          // Elegir color más frecuente en mano del bot
          const colorCounts: Record<UnoColor, number> = { red: 0, yellow: 0, green: 0, blue: 0, wild: 0 };
          botHand.forEach((c) => {
            if (c.color !== 'wild') colorCounts[c.color]++;
          });
          const sorted = (['red', 'yellow', 'green', 'blue'] as UnoColor[]).sort(
            (a, b) => colorCounts[b] - colorCounts[a]
          );
          chosenColor = sorted[0];
        }

        // Si le queda 1 carta, canta ¡UNO!
        if (botHand.length === 2) {
          setUnoSaidP2(true);
          playTone('morning_birds');
        }

        setTimeout(() => {
          executeUnoCardPlacement(cardToPlay, chosenColor, 'p2');
        }, 100);

        return botHand;
      } else {
        // Roba 1 carta
        drawCardsForPlayer('p2', 1);
        setUnoMessage('🤖 Tu Pareja no tenía carta jugable y robó 1 del mazo.');
        setUnoTurn('p1');
        return botHand;
      }
    });
  };

  return (
    <section className="w-full space-y-6 select-none pb-8">
      {/* HEADER DE MINIJUEGOS CON SELECTOR DE 3 JUEGOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 via-rose-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-2xl shadow-lg">
            🎲
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight flex items-center gap-2">
              <span>Zona de Minijuegos en Pareja</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                3 Juegos
              </span>
            </h3>
            <p className="text-xs text-white/60">
              Conexión, risas y toma de decisiones sin discusiones: Dado 3D, Escoba de 15 y UNO
            </p>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS DE JUEGOS */}
        <div className="flex p-1 rounded-2xl bg-white/10 border border-white/15">
          <button
            type="button"
            onClick={() => setActiveGame('dice')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'dice'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-102'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Dado 3D 🎲</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('escoba')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'escoba'
                ? 'bg-rose-500 text-white shadow-md font-black scale-102'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <span>🃏</span>
            <span>La Escoba (15)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('uno')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeGame === 'uno'
                ? 'bg-gradient-to-r from-red-500 via-amber-500 to-sky-500 text-white shadow-md font-black scale-102'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <span>🌈</span>
            <span>UNO en Pareja</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DADO DE LA VERDAD 3D (3+3 50/50 CON EXPECTACIÓN DE 10 SEGUNDOS)         */}
      {/* ========================================================================= */}
      {activeGame === 'dice' && (
        <div className="glass-card p-5 sm:p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-black/50 to-slate-900/50 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shadow-md">
                🎲
              </div>
              <div>
                <h4 className="text-base font-black text-amber-200 uppercase tracking-wide font-heading">
                  Dado de la Verdad 3D 🎲 (50% / 50%)
                </h4>
                <p className="text-xs text-white/60">
                  Evita desacuerdos: cada uno elige exactamente 3 números y el dado físico decide con animación realista
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-center">
              10s de Suspenso Físico
            </span>
          </div>

          {/* DADO 3D FÍSICO CON THREE.JS */}
          <div className="flex flex-col items-center justify-center pt-1">
            <ThreeDice3D
              isRolling={isRollingDice}
              resultNumber={diceRollResult}
              onRollComplete={handleDiceAnimationComplete}
              width={290}
              height={250}
            />
          </div>

          {/* SELECCIÓN 3+3 (OPCIÓN UNO Y OPCIÓN DOS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Opción uno: Mis 3 números */}
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-lime-300 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Mis 3 números ({currentDisplayMe.name}):</span>
                </span>
                <span className="text-[11px] font-bold text-white/50">
                  {myNumbers.length}/3 elegidos
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isSelected = myNumbers.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isRollingDice}
                      onClick={() => toggleMyNumber(num)}
                      className={`h-12 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[#556b2f] border-lime-400 text-white shadow-[0_0_15px_rgba(85,107,47,0.8)] scale-105 ring-2 ring-lime-400/50'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/50">
                Selecciona tus 3 números para tener exactamente el 50% de margen.
              </p>
            </div>

            {/* Opción dos: Números de mi Pareja */}
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <span>💘</span>
                  <span>Números de mi Pareja ({currentDisplayPartner.name}):</span>
                </span>
                <span className="text-[11px] font-bold text-white/50">
                  {partnerNumbers.length}/3 elegidos
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isSelected = partnerNumbers.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isRollingDice}
                      onClick={() => togglePartnerNumber(num)}
                      className={`h-12 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center border ${
                        isSelected
                          ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-105 ring-2 ring-rose-400/50'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/50">
                Tu pareja escoge sus 3 números (se permite overlap y marcará empate si sale).
              </p>
            </div>
          </div>

          {/* MENSAJE DE VALIDACIÓN */}
          {diceValidationNotice && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
              <span>{diceValidationNotice}</span>
            </div>
          )}

          {/* BOTÓN TIRAR DADO */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isRollingDice}
              onClick={handleStartDiceRoll}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-98 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_25px_rgba(245,158,11,0.45)] border border-amber-300/40 transition-all"
            >
              <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
              <span>{isRollingDice ? 'Tirando Dado de la Verdad (10 segundos)...' : '¡TIRAR DADO! 🎲'}</span>
            </button>
          </div>

          {/* RESULTADO FINAL */}
          {diceWinnerNotice && !isRollingDice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-purple-500/25 border-2 border-amber-400/50 text-xs sm:text-sm font-bold text-white flex items-center gap-3 shadow-lg"
            >
              <Trophy className="w-6 h-6 text-amber-300 shrink-0 animate-bounce" />
              <div className="flex-1">
                <span className="block font-black text-amber-200 text-[11px] uppercase tracking-wider">
                  Veredicto del Dado:
                </span>
                <span className="font-semibold text-white/95">{diceWinnerNotice}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. JUEGO DE CARTAS: LA ESCOBA DEL 15 (Baraja Española Auténtica)         */}
      {/* ========================================================================= */}
      {activeGame === 'escoba' && (
        <div className="glass-card p-5 sm:p-6 border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-black/50 to-slate-900/60 space-y-5 animate-fadeIn">
          {/* Header del juego Escoba */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-xl shadow-md">
                🃏
              </div>
              <div>
                <h4 className="text-base font-black text-rose-200 uppercase tracking-wide font-heading">
                  La Escoba del 15 (Baraja Española)
                </h4>
                <p className="text-xs text-white/60">
                  Suma exactamente 15 con una carta de tu mano y las de la mesa. ¡Limpia la mesa para hacer ESCOBA!
                </p>
              </div>
            </div>

            {/* Selector de modo Solitario vs Pareja por Turnos */}
            <div className="flex items-center gap-2">
              <div className="flex p-1 rounded-xl bg-white/10 border border-white/15">
                <button
                  type="button"
                  onClick={() => {
                    setEscobaMode('solo');
                    startNewEscobaGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    escobaMode === 'solo' ? 'bg-rose-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>En Solitario</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEscobaMode('couple');
                    startNewEscobaGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    escobaMode === 'couple' ? 'bg-rose-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Vs Pareja (Turnos)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={startNewEscobaGame}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Nueva partida"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Marcador de Escobas y Cartas Capturadas */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-3xl bg-black/40 border border-white/10 text-center">
            <div className={`p-2.5 rounded-2xl border transition-all ${escobaTurn === 'p1' ? 'border-lime-400 bg-lime-950/30' : 'border-white/5'}`}>
              <div className="text-xs font-black text-lime-300 flex items-center justify-center gap-1.5">
                <span>{currentDisplayMe.name || 'Jugador 1'}</span>
                {escobaTurn === 'p1' && <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />}
              </div>
              <div className="text-lg font-black text-white mt-1">
                🧹 Escobas: {escobaCountP1} | 🎴 Cartas: {escobaPileP1.length}
              </div>
            </div>

            <div className={`p-2.5 rounded-2xl border transition-all ${escobaTurn === 'p2' ? 'border-rose-400 bg-rose-950/30' : 'border-white/5'}`}>
              <div className="text-xs font-black text-rose-300 flex items-center justify-center gap-1.5">
                <span>{escobaMode === 'solo' ? 'Pareja Virtual 🤖' : (currentDisplayPartner.name || 'Jugador 2')}</span>
                {escobaTurn === 'p2' && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />}
              </div>
              <div className="text-lg font-black text-white mt-1">
                🧹 Escobas: {escobaCountP2} | 🎴 Cartas: {escobaPileP2.length}
              </div>
            </div>
          </div>

          {/* Cartas de la Pareja / Jugador 2 (Boca abajo en solitario o activas en modo pareja) */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white/70">
              Mano de {escobaMode === 'solo' ? 'Pareja Virtual 🤖' : (currentDisplayPartner.name || 'Jugador 2')}:
            </span>
            <div className="flex gap-2">
              {escobaHandP2.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="w-12 h-18 rounded-xl bg-gradient-to-br from-red-950 via-slate-900 to-black border border-white/20 shadow-md flex items-center justify-center text-xs font-bold text-white/40"
                >
                  {escobaMode === 'couple' && escobaTurn === 'p2' ? (
                    <div className="text-center">
                      <span className="text-base">{SUIT_ICONS[card.suit].emoji}</span>
                      <div className="text-[10px] text-white font-bold">{RANK_NAMES[card.rank]}</div>
                    </div>
                  ) : (
                    <span>🎴</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LA MESA (CARTAS EN JUEGO) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-black/60 to-emerald-950/40 border-2 border-emerald-500/30 text-center space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-black text-emerald-300 uppercase tracking-wider">
              <span>Cartas en la Mesa ({escobaTable.length}):</span>
              <span>Suma seleccionada: <strong className={currentEscobaSum === 15 ? 'text-lime-400 text-sm' : 'text-amber-300 text-sm'}>{currentEscobaSum} / 15</strong></span>
            </div>

            {escobaTable.length === 0 ? (
              <div className="py-6 text-white/40 text-xs italic">
                La mesa está vacía (¡Se hizo Escoba!). Tira una carta de tu mano para iniciar.
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
                {escobaTable.map((card) => {
                  const isSelected = selectedTableCards.some((sc) => sc.id === card.id);
                  const suitInfo = SUIT_ICONS[card.suit];
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSelectTableCard(card)}
                      className={`w-18 h-26 rounded-2xl border-2 flex flex-col justify-between p-2 shadow-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 text-slate-950 border-amber-400 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-2 ring-amber-300'
                          : 'bg-[#faf8f5] text-slate-900 border-slate-300 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-black">
                        <span>{card.rank}</span>
                        <span>{suitInfo.emoji}</span>
                      </div>
                      <div className="text-xl my-auto text-center font-black">
                        {suitInfo.emoji}
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 truncate text-center">
                        Val: {card.value}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* TU MANO (JUGADOR 1) */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>Tu Mano ({currentDisplayMe.name || 'Yo'}):</span>
                {escobaTurn === 'p1' && <span className="text-[10px] text-lime-400 font-bold animate-pulse">¡Tu Turno!</span>}
              </span>
              <span className="text-xs text-white/50">Mazo restante: {escobaDeck.length} cartas</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {escobaHandP1.map((card) => {
                const isSelected = selectedHandCard?.id === card.id;
                const suitInfo = SUIT_ICONS[card.suit];
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={escobaTurn !== 'p1' || escobaGameOver}
                    onClick={() => setSelectedHandCard(isSelected ? null : card)}
                    className={`w-20 h-28 rounded-2xl border-2 flex flex-col justify-between p-2 shadow-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-200 text-slate-950 border-amber-500 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.8)] ring-4 ring-amber-400/60'
                        : 'bg-[#faf8f5] text-slate-900 border-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-black">
                      <span>{card.rank}</span>
                      <span>{suitInfo.emoji}</span>
                    </div>
                    <div className="text-2xl text-center my-auto">
                      {suitInfo.emoji}
                    </div>
                    <div className="text-[10px] font-black text-slate-800 text-center">
                      {RANK_NAMES[card.rank]}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN Y MENSAJE DE ESCOBA */}
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{escobaMessage}</span>
            </div>

            {selectedHandCard && escobaTurn === 'p1' && !escobaGameOver && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handlePlayEscobaCard}
                className={`w-full py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                  currentEscobaSum === 15 && selectedTableCards.length > 0
                    ? 'bg-gradient-to-r from-lime-500 to-emerald-600 text-slate-950 shadow-lime-500/40 ring-2 ring-lime-300'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {currentEscobaSum === 15 && selectedTableCards.length > 0 ? (
                  <>
                    <span>✅</span>
                    <span>¡Suma 15! Capturar Cartas {selectedTableCards.length === escobaTable.length ? '(¡ESCOBA!)' : ''}</span>
                  </>
                ) : (
                  <>
                    <span>🃏</span>
                    <span>Descartar {RANK_NAMES[selectedHandCard.rank]} a la Mesa</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. JUEGO DE CARTAS: UNO EN PAREJA                                        */}
      {/* ========================================================================= */}
      {activeGame === 'uno' && (
        <div className="glass-card p-5 sm:p-6 border-sky-500/30 bg-gradient-to-br from-sky-950/30 via-black/50 to-indigo-950/60 space-y-5 animate-fadeIn">
          {/* Header de UNO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 via-amber-500 to-sky-500 border border-white/30 flex items-center justify-center text-xl shadow-md">
                🌈
              </div>
              <div>
                <h4 className="text-base font-black text-sky-200 uppercase tracking-wide font-heading">
                  UNO en Pareja
                </h4>
                <p className="text-xs text-white/60">
                  Deshazte de todas tus cartas emparejando por color, número o usando comodines
                </p>
              </div>
            </div>

            {/* Modo Solitario / Pareja */}
            <div className="flex items-center gap-2">
              <div className="flex p-1 rounded-xl bg-white/10 border border-white/15">
                <button
                  type="button"
                  onClick={() => {
                    setUnoMode('solo');
                    startNewUnoGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    unoMode === 'solo' ? 'bg-sky-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>En Solitario</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUnoMode('couple');
                    startNewUnoGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    unoMode === 'couple' ? 'bg-sky-500 text-white shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Vs Pareja</span>
                </button>
              </div>

              <button
                type="button"
                onClick={startNewUnoGame}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Nueva partida de UNO"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mano de la Pareja / Bot (Arriba) */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="text-xs font-bold text-white/80 flex items-center gap-2">
              <span>Mano de {unoMode === 'solo' ? 'Pareja Virtual 🤖' : (currentDisplayPartner.name || 'Jugador 2')}:</span>
              {unoSaidP2 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-bounce">¡CANTÓ UNO! 🗣️</span>}
            </div>
            <div className="flex gap-1.5 overflow-x-auto max-w-[60%]">
              {unoHandP2.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="w-10 h-16 rounded-xl bg-slate-900 border-2 border-white/20 shadow-md flex items-center justify-center shrink-0"
                >
                  <span className="text-xs font-black text-rose-500 font-heading">UNO</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRO: MAZO DE ROBO Y POZO DE DESCARTE */}
          <div className="flex items-center justify-center gap-8 py-4">
            {/* Mazo de Robo */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={unoTurn !== 'p1' || unoGameOver}
              onClick={handlePlayerDraw}
              className="w-24 h-36 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black border-2 border-white/30 shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center cursor-pointer relative group"
            >
              <div className="w-14 h-22 rounded-2xl border-2 border-white/20 flex items-center justify-center bg-black/40 rotate-6">
                <span className="text-sm font-black text-rose-500 font-heading">UNO</span>
              </div>
              <span className="text-[10px] font-bold text-white/70 mt-1">Robar Carta 🎴</span>
              <span className="text-[9px] text-white/40">({unoDeck.length})</span>
            </motion.button>

            {/* Pozo de Descarte Activo */}
            <div className="flex flex-col items-center">
              {topDiscard ? (
                <motion.div
                  key={topDiscard.id}
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className={`w-24 h-36 rounded-3xl ${UNO_COLOR_STYLES[unoActiveColor].bg} border-4 border-white shadow-[0_20px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between p-2.5 text-white select-none relative`}
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span>{topDiscard.value !== undefined ? topDiscard.value : topDiscard.type}</span>
                    <span>🌈</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 mx-auto flex items-center justify-center text-2xl font-black font-heading shadow-inner">
                    {topDiscard.type === 'number'
                      ? topDiscard.value
                      : topDiscard.type === 'draw2'
                      ? '+2'
                      : topDiscard.type === 'skip'
                      ? '🚫'
                      : topDiscard.type === 'reverse'
                      ? '🔄'
                      : topDiscard.type === 'wild4'
                      ? '+4'
                      : '🌈'}
                  </div>
                  <div className="text-[10px] font-black text-center tracking-wider uppercase">
                    {UNO_COLOR_STYLES[unoActiveColor].name}
                  </div>
                </motion.div>
              ) : (
                <div className="w-24 h-36 rounded-3xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center text-xs text-white/50">
                  Vacío
                </div>
              )}
              <span className="text-[11px] font-black text-white/90 mt-2 px-3 py-1 rounded-full bg-black/50 border border-white/20">
                Color: <strong className={UNO_COLOR_STYLES[unoActiveColor].text}>{UNO_COLOR_STYLES[unoActiveColor].name}</strong>
              </span>
            </div>
          </div>

          {/* SELECTOR DE COLOR CUANDO JUEGAS COMODÍN */}
          {isChoosingWildColor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-3xl bg-black/80 border-2 border-white/40 space-y-2 text-center"
            >
              <h5 className="text-xs font-black text-white uppercase tracking-wider">
                ¡Elige el nuevo color para continuar la partida!
              </h5>
              <div className="grid grid-cols-4 gap-2">
                {(['red', 'yellow', 'green', 'blue'] as UnoColor[]).map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => handleSelectWildColor(clr)}
                    className={`py-3 rounded-2xl ${UNO_COLOR_STYLES[clr].bg} text-white font-black text-xs shadow-md border-2 border-white/40 cursor-pointer active:scale-95`}
                  >
                    {UNO_COLOR_STYLES[clr].name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* MANO DEL JUGADOR 1 */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Tu Mano ({currentDisplayMe.name || 'Yo'}):</span>
                {unoTurn === 'p1' && <span className="text-[10px] text-sky-400 font-bold animate-pulse">¡Te toca!</span>}
              </span>

              {/* Botón cantar UNO si te queda 1 o 2 cartas */}
              {unoHandP1.length <= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setUnoSaidP1(true);
                    trigger3DConfetti();
                    playTone('cathedral_bells');
                    sendMessage(`🗣️ ¡¡${currentDisplayMe.name || 'Yo'} cantó UNO en pareja!! 💖`);
                  }}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:scale-105 active:scale-95 text-white font-black text-xs shadow-lg cursor-pointer animate-bounce"
                >
                  ¡¡CANTAR UNO!! 🗣️
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {unoHandP1.map((card) => {
                const playable = canPlayUnoCard(card) && unoTurn === 'p1';
                const style = UNO_COLOR_STYLES[card.color];
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!playable || unoGameOver}
                    onClick={() => handlePlayUnoCard(card)}
                    className={`w-18 h-28 rounded-2xl ${style.bg} border-2 ${
                      playable ? 'border-white ring-2 ring-white/50 cursor-pointer' : 'border-white/20 opacity-50 cursor-not-allowed'
                    } shadow-xl flex flex-col justify-between p-1.5 text-white select-none transition-all`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black">
                      <span>{card.value !== undefined ? card.value : card.type}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 mx-auto flex items-center justify-center text-base font-black font-heading shadow-inner">
                      {card.type === 'number'
                        ? card.value
                        : card.type === 'draw2'
                        ? '+2'
                        : card.type === 'skip'
                        ? '🚫'
                        : card.type === 'reverse'
                        ? '🔄'
                        : card.type === 'wild4'
                        ? '+4'
                        : '🌈'}
                    </div>
                    <div className="text-[9px] font-black text-center truncate">
                      {style.name}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* MENSAJE DE ESTADO DEL JUEGO UNO */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
            <span>{unoMessage}</span>
          </div>
        </div>
      )}
    </section>
  );
};
