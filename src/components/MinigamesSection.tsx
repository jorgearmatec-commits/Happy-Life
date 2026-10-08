import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Dices,
  Trophy,
  Sparkles,
  RotateCcw,
  Bot,
  Users,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThreeDice3D } from './ThreeDice3D';
import { playTone } from './AudioSynthesizer';
import { SpanishCardView } from './SpanishCardView';
import { UnoCardView } from './UnoCardView';

// =========================================================================
// 1. TIPOS Y UTILIDADES PARA LA BARAJA ESPAÑOLA (LA ESCOBA DEL 15)
// =========================================================================

export type SpanishSuit = 'oros' | 'copas' | 'espadas' | 'bastos';

export interface SpanishCard {
  id: string;
  suit: SpanishSuit;
  rank: number;
  value: number;
}

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

  // Mezcla Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// =========================================================================
// 2. TIPOS Y UTILIDADES PARA UNO
// =========================================================================

export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';

export interface UnoCard {
  id: string;
  color: UnoColor;
  type: 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
  value?: number;
}

const UNO_COLOR_STYLES: Record<
  UnoColor,
  { bg: string; border: string; text: string; name: string }
> = {
  red: {
    bg: 'bg-rose-600',
    border: 'border-rose-400',
    text: 'text-rose-300',
    name: 'Rojo',
  },
  yellow: {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    text: 'text-amber-200',
    name: 'Amarillo',
  },
  green: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-400',
    text: 'text-emerald-200',
    name: 'Verde',
  },
  blue: {
    bg: 'bg-sky-600',
    border: 'border-sky-400',
    text: 'text-sky-200',
    name: 'Azul',
  },
  wild: {
    bg: 'bg-gradient-to-br from-rose-500 via-amber-500 via-emerald-500 to-sky-500',
    border: 'border-white',
    text: 'text-white',
    name: 'Comodín',
  },
};

export const createUnoDeck = (): UnoCard[] => {
  const colors: UnoColor[] = ['red', 'yellow', 'green', 'blue'];
  const deck: UnoCard[] = [];
  let idCounter = 0;

  colors.forEach((color) => {
    deck.push({
      id: `uno_${idCounter++}`,
      color,
      type: 'number',
      value: 0,
    });

    for (let num = 1; num <= 9; num++) {
      deck.push({
        id: `uno_${idCounter++}`,
        color,
        type: 'number',
        value: num,
      });

      deck.push({
        id: `uno_${idCounter++}`,
        color,
        type: 'number',
        value: num,
      });
    }

    for (let k = 0; k < 2; k++) {
      deck.push({
        id: `uno_${idCounter++}`,
        color,
        type: 'skip',
      });

      deck.push({
        id: `uno_${idCounter++}`,
        color,
        type: 'reverse',
      });

      deck.push({
        id: `uno_${idCounter++}`,
        color,
        type: 'draw2',
      });
    }
  });

  for (let w = 0; w < 4; w++) {
    deck.push({
      id: `uno_${idCounter++}`,
      color: 'wild',
      type: 'wild',
    });

    deck.push({
      id: `uno_${idCounter++}`,
      color: 'wild',
      type: 'wild4',
    });
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================

export const MinigamesSection: React.FC = () => {
  const {
    me,
    partner,
    activeRole,
    sendMessage,
    trigger3DConfetti,
    updateMyStatus,
  } = useApp();

  const [activeGame, setActiveGame] = useState<
    'dice' | 'escoba' | 'uno'
  >('dice');

  const currentDisplayMe = activeRole === 'me' ? me : partner;
  const currentDisplayPartner = activeRole === 'me' ? partner : me;

  // =========================================================================
  // JUEGO 1 - DADO
  // =========================================================================

  const [myNumbers, setMyNumbers] = useState<number[]>([1, 3, 5]);
  const [partnerNumbers, setPartnerNumbers] = useState<number[]>([2, 4, 6]);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceWinnerNotice, setDiceWinnerNotice] = useState<string | null>(null);
  const [diceValidationNotice, setDiceValidationNotice] =
    useState<string | null>(null);

  const toggleMyNumber = (num: number) => {
    if (isRollingDice) return;

    setDiceValidationNotice(null);

    setMyNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }

      if (prev.length >= 3) {
        return [...prev.slice(1), num];
      }

      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const togglePartnerNumber = (num: number) => {
    if (isRollingDice) return;

    setDiceValidationNotice(null);

    setPartnerNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }

      if (prev.length >= 3) {
        return [...prev.slice(1), num];
      }

      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const handleStartDiceRoll = () => {
    if (isRollingDice) return;

    if (myNumbers.length !== 3 || partnerNumbers.length !== 3) {
      setDiceValidationNotice(
        'Ambos deben elegir exactamente 3 números cada uno para tener 50% de probabilidad.'
      );
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

      sendMessage(
        `🎲 [Dado de la Verdad 50/50]: ${winnerText}`
      );

      updateMyStatus({
        lastAction: `🎲 Tiró dado de la verdad: Salió ${finalNumber}`,
      });
    } catch {}
  };

  // =========================================================================
  // JUEGO 2 - ESCOBA
  // =========================================================================

  const [escobaMode, setEscobaMode] = useState<'solo' | 'couple'>('solo');

  const [escobaDeck, setEscobaDeck] = useState<SpanishCard[]>([]);
  const [escobaTable, setEscobaTable] = useState<SpanishCard[]>([]);
  const [escobaHandP1, setEscobaHandP1] = useState<SpanishCard[]>([]);
  const [escobaHandP2, setEscobaHandP2] = useState<SpanishCard[]>([]);

  const [escobaPileP1, setEscobaPileP1] = useState<SpanishCard[]>([]);
  const [escobaPileP2, setEscobaPileP2] = useState<SpanishCard[]>([]);

  const [escobaCountP1, setEscobaCountP1] = useState<number>(0);
  const [escobaCountP2, setEscobaCountP2] = useState<number>(0);

  const [escobaTurn, setEscobaTurn] =
    useState<'p1' | 'p2'>('p1');

  const [escobaLastTaker, setEscobaLastTaker] =
    useState<'p1' | 'p2' | null>(null);

  const [selectedHandCard, setSelectedHandCard] =
    useState<SpanishCard | null>(null);

  const [selectedTableCards, setSelectedTableCards] =
    useState<SpanishCard[]>([]);

  const [availableCombos, setAvailableCombos] = useState<SpanishCard[][]>([]);

  const [escobaMessage, setEscobaMessage] = useState<string>(
    'Selecciona una carta de tu mano. El asistente detectará combinaciones que sumen 15.'
  );

  const [escobaGameOver, setEscobaGameOver] =
    useState<boolean>(false);

  const [escobaScores, setEscobaScores] = useState<{
    scoreP1: number;
    scoreP2: number;
    detailsP1: string[];
    detailsP2: string[];
    winnerName: string;
  } | null>(null);

  // -------------------------------------------------------------------------
  // NUEVA PARTIDA
  // -------------------------------------------------------------------------

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
    setAvailableCombos([]);

    setEscobaGameOver(false);
    setEscobaScores(null);

    setEscobaMessage(
      '¡Partida iniciada con la Baraja Española tradicional! Es tu turno.'
    );

    playTone('water');
  };

  useEffect(() => {
    if (
      activeGame === 'escoba' &&
      escobaDeck.length === 0 &&
      escobaTable.length === 0 &&
      !escobaGameOver
    ) {
      startNewEscobaGame();
    }
  }, [activeGame]);

  // -------------------------------------------------------------------------
  // BUSCAR COMBINACIONES DE 15
  // -------------------------------------------------------------------------

  const findSumsOf15 = (
    handCard: SpanishCard,
    table: SpanishCard[]
  ): SpanishCard[][] => {
    const target = 15 - handCard.value;

    if (target <= 0) return [];

    const results: SpanishCard[][] = [];

    const backtrack = (
      start: number,
      currentSum: number,
      currentComb: SpanishCard[]
    ) => {
      if (currentSum === target) {
        results.push([...currentComb]);
        return;
      }

      if (currentSum > target) return;

      for (let i = start; i < table.length; i++) {
        currentComb.push(table[i]);

        backtrack(
          i + 1,
          currentSum + table[i].value,
          currentComb
        );

        currentComb.pop();
      }
    };

    backtrack(0, 0, []);

    // Prioridad:
    // 1. Limpiar toda la mesa
    // 2. Capturar el 7 de oros
    // 3. Capturar más cartas
    results.sort((a, b) => {
      const isEscobaA =
        a.length === table.length ? 1 : 0;

      const isEscobaB =
        b.length === table.length ? 1 : 0;

      if (isEscobaA !== isEscobaB) {
        return isEscobaB - isEscobaA;
      }

      const has7OrosA = a.some(
        (c) => c.suit === 'oros' && c.rank === 7
      )
        ? 1
        : 0;

      const has7OrosB = b.some(
        (c) => c.suit === 'oros' && c.rank === 7
      )
        ? 1
        : 0;

      if (has7OrosA !== has7OrosB) {
        return has7OrosB - has7OrosA;
      }

      return b.length - a.length;
    });

    return results;
  };

  // -------------------------------------------------------------------------
  // SELECCIONAR CARTA DE LA MANO
  // -------------------------------------------------------------------------

  const handleSelectHandCard = (card: SpanishCard) => {
    if (escobaGameOver) return;
    if (escobaMode === 'solo' && escobaTurn !== 'p1') return;

    if (selectedHandCard?.id === card.id) {
      setSelectedHandCard(null);
      setSelectedTableCards([]);
      setAvailableCombos([]);
      setEscobaMessage('Selección cancelada. Elige una carta para jugar.');
      return;
    }

    setSelectedHandCard(card);

    const validCombs = findSumsOf15(card, escobaTable);
    setAvailableCombos(validCombs);

    if (validCombs.length > 0) {
      setSelectedTableCards(validCombs[0]);
      const isSweep = validCombs[0].length === escobaTable.length;
      setEscobaMessage(
        isSweep
          ? '🧹 ¡¡COMBINACIÓN DE ESCOBA!! Limpias toda la mesa (+1 Pto). Pulsa abajo para capturar.'
          : `✅ ¡Suma 15 encontrada! (${RANK_NAMES[card.rank] || card.rank} con valor ${card.value} + mesa). Pulsa abajo para capturar.`
      );
      playTone('water');
    } else {
      setSelectedTableCards([]);
      setEscobaMessage(
        `No hay combinaciones de 15 con el ${RANK_NAMES[card.rank] || card.rank}. Pulsa abajo para descartarla en la mesa.`
      );
    }
  };

  // =========================================================================
  // CAMBIO IMPORTANTE:
  // SELECCIÓN MANUAL DE CARTAS DE LA MESA
  // =========================================================================

  const toggleSelectTableCard = (card: SpanishCard) => {
    if (!selectedHandCard) {
      setEscobaMessage('Primero pulsa una carta de tu mano para buscar o sumar 15.');
      return;
    }
    if (escobaGameOver) return;
    if (escobaMode === 'solo' && escobaTurn !== 'p1') return;

    const alreadySelected = selectedTableCards.some((c) => c.id === card.id);

    // Si ya estaba seleccionada, quitarla.
    if (alreadySelected) {
      const remaining = selectedTableCards.filter((c) => c.id !== card.id);
      setSelectedTableCards(remaining);
      const newTotal = selectedHandCard.value + remaining.reduce((acc, c) => acc + c.value, 0);
      setEscobaMessage(`Carta desmarcada. Suma actual: ${newTotal} / 15`);
      return;
    }

    // Calcular cuánto sumaríamos.
    const currentTableSum = selectedTableCards.reduce(
      (acc, c) => acc + c.value,
      0
    );

    const newTotal =
      selectedHandCard.value +
      currentTableSum +
      card.value;

    // IMPORTANTE:
    // Nunca permitir pasar de 15.
    if (newTotal > 15) {
      setEscobaMessage(
        `⚠️ No puedes superar 15. Esa carta haría un total de ${newTotal}. Desmarca alguna carta antes de añadir esta.`
      );
      playTone('digital_pulse');
      return;
    }

    // Agregar carta a la selección.
    const nextSelection = [...selectedTableCards, card];
    setSelectedTableCards(nextSelection);

    // Mensaje según la nueva suma.
    if (newTotal === 15) {
      const isSweep = nextSelection.length === escobaTable.length;
      setEscobaMessage(
        isSweep
          ? '🧹 ¡¡ESCOBA COMPLETA!! Limpiarás la mesa (+1 Punto).'
          : '✅ ¡Suma exactamente 15! Pulsa el botón verde para capturar.'
      );
      playTone('water');
    } else {
      setEscobaMessage(
        `Suma actual: ${newTotal} / 15`
      );
    }
  };

  // -------------------------------------------------------------------------
  // SUMA ACTUAL
  // -------------------------------------------------------------------------

  const currentEscobaSum =
    (selectedHandCard
      ? selectedHandCard.value
      : 0) +
    selectedTableCards.reduce(
      (acc, c) => acc + c.value,
      0
    );

  // -------------------------------------------------------------------------
  // EJECUTAR JUGADA
  // -------------------------------------------------------------------------

  const executeEscobaMove = (
    player: 'p1' | 'p2',
    playedCard: SpanishCard,
    capturedTableCards: SpanishCard[],
    currentTable: SpanishCard[],
    currentHandP1: SpanishCard[],
    currentHandP2: SpanishCard[],
    currentDeck: SpanishCard[],
    currentPileP1: SpanishCard[],
    currentPileP2: SpanishCard[],
    currentCountP1: number,
    currentCountP2: number,
    currentLastTaker: 'p1' | 'p2' | null
  ) => {
    const sum =
      playedCard.value +
      capturedTableCards.reduce(
        (acc, c) => acc + c.value,
        0
      );

    const isValid15 =
      sum === 15 &&
      capturedTableCards.length > 0;

    let nextTable = currentTable;

    let nextPileP1 = [...currentPileP1];
    let nextPileP2 = [...currentPileP2];

    let nextCountP1 = currentCountP1;
    let nextCountP2 = currentCountP2;

    let nextLastTaker = currentLastTaker;

    let actionMessage = '';

    const playerName =
      player === 'p1'
        ? currentDisplayMe.name || 'Jugador 1'
        : escobaMode === 'solo'
          ? 'Pareja Virtual 🤖'
          : currentDisplayPartner.name || 'Jugador 2';

    // -----------------------------------------------------------------------
    // CAPTURA
    // -----------------------------------------------------------------------

    if (isValid15) {
      nextTable = currentTable.filter(
        (tc) =>
          !capturedTableCards.some(
            (sc) => sc.id === tc.id
          )
      );

      const isSweep =
        nextTable.length === 0;

      const captured = [
        playedCard,
        ...capturedTableCards,
      ];

      if (player === 'p1') {
        nextPileP1 = [
          ...nextPileP1,
          ...captured,
        ];

        if (isSweep) {
          nextCountP1 += 1;

          trigger3DConfetti();
          playTone('cathedral_bells');

          actionMessage =
            `🧹 ¡¡ESCOBA de ${playerName}!! Limpia la mesa (+1 Punto) 🎉`;
        } else {
          playTone('zen_bowl');

          actionMessage =
            `✅ ${playerName} suma 15 y captura ${captured.length} cartas`;
        }
      } else {
        nextPileP2 = [
          ...nextPileP2,
          ...captured,
        ];

        if (isSweep) {
          nextCountP2 += 1;

          trigger3DConfetti();
          playTone('cathedral_bells');

          actionMessage =
            `🧹 ¡¡ESCOBA de ${playerName}!! Limpia la mesa (+1 Punto) 🎉`;
        } else {
          playTone('zen_bowl');

          actionMessage =
            `🤖 ${playerName} suma 15 y captura ${captured.length} cartas`;
        }
      }

      nextLastTaker = player;
    } else {
      // ---------------------------------------------------------------------
      // DESCARTAR EN LA MESA
      // ---------------------------------------------------------------------

      nextTable = [
        ...currentTable,
        playedCard,
      ];

      actionMessage =
        `🃏 ${playerName} deja el ${RANK_NAMES[playedCard.rank]} en la mesa`;

      playTone('harpa');
    }

    // -----------------------------------------------------------------------
    // QUITAR CARTA DE LA MANO
    // -----------------------------------------------------------------------

    const nextHandP1 =
      player === 'p1'
        ? currentHandP1.filter(
            (c) => c.id !== playedCard.id
          )
        : currentHandP1;

    const nextHandP2 =
      player === 'p2'
        ? currentHandP2.filter(
            (c) => c.id !== playedCard.id
          )
        : currentHandP2;

    // -----------------------------------------------------------------------
    // ACTUALIZAR ESTADOS
    // -----------------------------------------------------------------------

    setEscobaTable(nextTable);

    setEscobaPileP1(nextPileP1);
    setEscobaPileP2(nextPileP2);

    setEscobaCountP1(nextCountP1);
    setEscobaCountP2(nextCountP2);

    setEscobaLastTaker(nextLastTaker);

    setEscobaHandP1(nextHandP1);
    setEscobaHandP2(nextHandP2);

    setEscobaMessage(actionMessage);

    setSelectedHandCard(null);
    setSelectedTableCards([]);
    setAvailableCombos([]);

    // -----------------------------------------------------------------------
    // REPARTIR 3 CARTAS A CADA UNO
    // -----------------------------------------------------------------------

    if (
      nextHandP1.length === 0 &&
      nextHandP2.length === 0
    ) {
      if (currentDeck.length >= 6) {
        const newP1 =
          currentDeck.slice(0, 3);

        const newP2 =
          currentDeck.slice(3, 6);

        const remainingDeck =
          currentDeck.slice(6);

        setTimeout(() => {
          setEscobaHandP1(newP1);
          setEscobaHandP2(newP2);

          setEscobaDeck(remainingDeck);

          setEscobaTurn('p1');

          setEscobaMessage(
            `🎴 ¡Mano finalizada! Se reparten 3 nuevas cartas a cada jugador. Quedan ${remainingDeck.length} en el mazo.`
          );

          playTone('peaceful_chime');
        }, 750);

        return;
      }

      // ---------------------------------------------------------------------
      // FIN DEL JUEGO
      // ---------------------------------------------------------------------

      setTimeout(() => {
        finalizeEscobaRound(
          nextTable,
          nextPileP1,
          nextPileP2,
          nextCountP1,
          nextCountP2,
          nextLastTaker
        );
      }, 900);

      return;
    }

    // -----------------------------------------------------------------------
    // CAMBIAR TURNO
    // -----------------------------------------------------------------------

    const nextTurn =
      player === 'p1'
        ? 'p2'
        : 'p1';

    setEscobaTurn(nextTurn);

    // -----------------------------------------------------------------------
    // BOT
    // -----------------------------------------------------------------------

    if (
      escobaMode === 'solo' &&
      nextTurn === 'p2'
    ) {
      setTimeout(() => {
        botPlayTurn(
          nextTable,
          nextHandP1,
          nextHandP2,
          currentDeck,
          nextPileP1,
          nextPileP2,
          nextCountP1,
          nextCountP2,
          nextLastTaker
        );
      }, 750);
    }
  };

  // =========================================================================
  // BOT DE ESCOBA
  // =========================================================================

  const botPlayTurn = (
    table: SpanishCard[],
    handP1: SpanishCard[],
    handP2: SpanishCard[],
    deck: SpanishCard[],
    pileP1: SpanishCard[],
    pileP2: SpanishCard[],
    countP1: number,
    countP2: number,
    lastTaker: 'p1' | 'p2' | null
  ) => {
    if (handP2.length === 0) return;

    let bestCard = handP2[0];
    let bestSelection: SpanishCard[] = [];
    let found15 = false;

    for (const card of handP2) {
      const combs =
        findSumsOf15(card, table);

      if (combs.length > 0) {
        bestCard = card;
        bestSelection = combs[0];
        found15 = true;
        break;
      }
    }

    if (!found15) {
      // Evitar tirar el 7 de oros.
      const sorted = [...handP2].sort(
        (a, b) => {
          const is7OrosA =
            a.suit === 'oros' &&
            a.rank === 7
              ? 100
              : 0;

          const is7OrosB =
            b.suit === 'oros' &&
            b.rank === 7
              ? 100
              : 0;

          return (
            a.value +
            is7OrosA -
            (b.value + is7OrosB)
          );
        }
      );

      bestCard = sorted[0];
      bestSelection = [];
    }

    executeEscobaMove(
      'p2',
      bestCard,
      bestSelection,
      table,
      handP1,
      handP2,
      deck,
      pileP1,
      pileP2,
      countP1,
      countP2,
      lastTaker
    );
  };

  // =========================================================================
  // JUGADA DE ESCOBA (TURNO ACTIVO P1 O P2)
  // =========================================================================

  const handlePlayEscobaCard = () => {
    if (!selectedHandCard) return;
    if (escobaGameOver) return;

    executeEscobaMove(
      escobaTurn,
      selectedHandCard,
      selectedTableCards,
      escobaTable,
      escobaHandP1,
      escobaHandP2,
      escobaDeck,
      escobaPileP1,
      escobaPileP2,
      escobaCountP1,
      escobaCountP2,
      escobaLastTaker
    );
  };

  // =========================================================================
  // JUGADA P2 EN MODO PAREJA
  // =========================================================================

  const handlePlayEscobaCardP2 = (
    card: SpanishCard
  ) => {
    if (escobaTurn !== 'p2') return;
    if (escobaGameOver) return;

    const combs =
      findSumsOf15(card, escobaTable);

    const selection =
      combs.length > 0
        ? combs[0]
        : [];

    executeEscobaMove(
      'p2',
      card,
      selection,
      escobaTable,
      escobaHandP1,
      escobaHandP2,
      escobaDeck,
      escobaPileP1,
      escobaPileP2,
      escobaCountP1,
      escobaCountP2,
      escobaLastTaker
    );
  };

  // =========================================================================
  // FINALIZAR ESCOBA
  // =========================================================================

  const finalizeEscobaRound = (
    remainingTable: SpanishCard[],
    p1Pile: SpanishCard[],
    p2Pile: SpanishCard[],
    countP1: number,
    countP2: number,
    lastTaker: 'p1' | 'p2' | null
  ) => {
    setEscobaGameOver(true);

    let finalP1Pile = [...p1Pile];
    let finalP2Pile = [...p2Pile];

    // Las cartas sobrantes de la mesa
    // corresponden al último jugador
    // que realizó una captura.
    if (lastTaker === 'p1') {
      finalP1Pile = [
        ...finalP1Pile,
        ...remainingTable,
      ];

      setEscobaPileP1(finalP1Pile);
    } else if (lastTaker === 'p2') {
      finalP2Pile = [
        ...finalP2Pile,
        ...remainingTable,
      ];

      setEscobaPileP2(finalP2Pile);
    }

    setEscobaTable([]);

    let scoreP1 = countP1;
    let scoreP2 = countP2;

    const detailsP1: string[] = [
      `Escobas limpias: ${countP1} pts`,
    ];

    const detailsP2: string[] = [
      `Escobas limpias: ${countP2} pts`,
    ];

    // -----------------------------------------------------------------------
    // MAYORÍA DE CARTAS
    // -----------------------------------------------------------------------

    if (
      finalP1Pile.length >
      finalP2Pile.length
    ) {
      scoreP1 += 1;

      detailsP1.push(
        `Mayoría de cartas (${finalP1Pile.length}): +1 pt`
      );
    } else if (
      finalP2Pile.length >
      finalP1Pile.length
    ) {
      scoreP2 += 1;

      detailsP2.push(
        `Mayoría de cartas (${finalP2Pile.length}): +1 pt`
      );
    }

    // -----------------------------------------------------------------------
    // MAYORÍA DE OROS
    // -----------------------------------------------------------------------

    const orosP1 =
      finalP1Pile.filter(
        (c) => c.suit === 'oros'
      ).length;

    const orosP2 =
      finalP2Pile.filter(
        (c) => c.suit === 'oros'
      ).length;

    if (orosP1 > orosP2) {
      scoreP1 += 1;

      detailsP1.push(
        `Mayoría de oros (${orosP1}): +1 pt`
      );
    } else if (orosP2 > orosP1) {
      scoreP2 += 1;

      detailsP2.push(
        `Mayoría de oros (${orosP2}): +1 pt`
      );
    }

    // -----------------------------------------------------------------------
    // 7 DE OROS
    // -----------------------------------------------------------------------

    const hasSieteOrosP1 =
      finalP1Pile.some(
        (c) =>
          c.suit === 'oros' &&
          c.rank === 7
      );

    const hasSieteOrosP2 =
      finalP2Pile.some(
        (c) =>
          c.suit === 'oros' &&
          c.rank === 7
      );

    if (hasSieteOrosP1) {
      scoreP1 += 1;

      detailsP1.push(
        `El Siete de Oros: +1 pt`
      );
    }

    if (hasSieteOrosP2) {
      scoreP2 += 1;

      detailsP2.push(
        `El Siete de Oros: +1 pt`
      );
    }

    // -----------------------------------------------------------------------
    // MAYORÍA DE SIETES
    // -----------------------------------------------------------------------

    const sietesP1 =
      finalP1Pile.filter(
        (c) => c.rank === 7
      ).length;

    const sietesP2 =
      finalP2Pile.filter(
        (c) => c.rank === 7
      ).length;

    if (sietesP1 > sietesP2) {
      scoreP1 += 1;

      detailsP1.push(
        `Mayoría de sietes (${sietesP1}): +1 pt`
      );
    } else if (sietesP2 > sietesP1) {
      scoreP2 += 1;

      detailsP2.push(
        `Mayoría de sietes (${sietesP2}): +1 pt`
      );
    }

    trigger3DConfetti();
    playTone('cathedral_bells');

    const winner =
      scoreP1 > scoreP2
        ? currentDisplayMe.name || 'Jugador 1'
        : scoreP2 > scoreP1
          ? escobaMode === 'solo'
            ? 'Pareja Virtual 🤖'
            : currentDisplayPartner.name ||
              'Jugador 2'
          : '¡Empate!';

    setEscobaScores({
      scoreP1,
      scoreP2,
      detailsP1,
      detailsP2,
      winnerName: winner,
    });

    setEscobaMessage(
      `🏆 ¡Fin de partida! ${winner} gana con ${Math.max(
        scoreP1,
        scoreP2
      )} puntos.`
    );
  };

  // =========================================================================
  // JUEGO 3 - UNO
  // =========================================================================

  const [unoMode, setUnoMode] =
    useState<'solo' | 'couple'>('solo');

  const [unoDeck, setUnoDeck] =
    useState<UnoCard[]>([]);

  const [unoDiscard, setUnoDiscard] =
    useState<UnoCard[]>([]);

  const [unoHandP1, setUnoHandP1] =
    useState<UnoCard[]>([]);

  const [unoHandP2, setUnoHandP2] =
    useState<UnoCard[]>([]);

  const [unoTurn, setUnoTurn] =
    useState<'p1' | 'p2'>('p1');

  const [unoActiveColor, setUnoActiveColor] =
    useState<UnoColor>('red');

  const [unoSaidP1, setUnoSaidP1] =
    useState<boolean>(false);

  const [unoSaidP2, setUnoSaidP2] =
    useState<boolean>(false);

  const [unoMessage, setUnoMessage] =
    useState<string>(
      '¡Bienvenido a UNO en Pareja! Tira una carta del mismo color o número.'
    );

  const [isChoosingWildColor, setIsChoosingWildColor] =
    useState<boolean>(false);

  const [pendingWildCard, setPendingWildCard] =
    useState<UnoCard | null>(null);

  const [unoGameOver, setUnoGameOver] =
    useState<boolean>(false);

  // -------------------------------------------------------------------------
  // NUEVA PARTIDA UNO
  // -------------------------------------------------------------------------

  const startNewUnoGame = () => {
    const freshDeck = createUnoDeck();

    let startCardIdx =
      freshDeck.findIndex(
        (c) => c.color !== 'wild'
      );

    if (startCardIdx === -1) {
      startCardIdx = 0;
    }

    const startCard =
      freshDeck[startCardIdx];

    const deckWithoutStart =
      freshDeck.filter(
        (_, idx) => idx !== startCardIdx
      );

    const p1Hand =
      deckWithoutStart.slice(0, 7);

    const p2Hand =
      deckWithoutStart.slice(7, 14);

    const drawDeck =
      deckWithoutStart.slice(14);

    setUnoDeck(drawDeck);
    setUnoDiscard([startCard]);

    setUnoActiveColor(
      startCard.color
    );

    setUnoHandP1(p1Hand);
    setUnoHandP2(p2Hand);

    setUnoTurn('p1');

    setUnoSaidP1(false);
    setUnoSaidP2(false);

    setUnoGameOver(false);

    setIsChoosingWildColor(false);
    setPendingWildCard(null);

    setUnoMessage(
      `¡Partida de UNO lista! Carta inicial: ${
        startCard.value !== undefined
          ? startCard.value
          : startCard.type
      } (${UNO_COLOR_STYLES[startCard.color].name})`
    );

    playTone('water');
  };

  useEffect(() => {
    if (
      activeGame === 'uno' &&
      unoDiscard.length === 0 &&
      !unoGameOver
    ) {
      startNewUnoGame();
    }
  }, [activeGame]);

  const topDiscard =
    unoDiscard[unoDiscard.length - 1];

  // -------------------------------------------------------------------------
  // COMPROBAR CARTA UNO
  // -------------------------------------------------------------------------

  const canPlayUnoCard = (
    card: UnoCard
  ) => {
    if (card.color === 'wild') {
      return true;
    }

    if (
      card.color === unoActiveColor
    ) {
      return true;
    }

    if (
      topDiscard &&
      card.type === topDiscard.type &&
      card.type !== 'number'
    ) {
      return true;
    }

    if (
      topDiscard &&
      card.type === 'number' &&
      topDiscard.type === 'number' &&
      card.value === topDiscard.value
    ) {
      return true;
    }

    return false;
  };

  // -------------------------------------------------------------------------
  // JUGAR CARTA UNO
  // -------------------------------------------------------------------------

  const handlePlayUnoCard = (
    card: UnoCard,
    player: 'p1' | 'p2' = 'p1'
  ) => {
    if (unoTurn !== player) return;

    if (!canPlayUnoCard(card)) {
      setUnoMessage(
        '⚠️ Esa carta no coincide con el color ni con el número.'
      );

      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setIsChoosingWildColor(true);
      return;
    }

    executeUnoCardPlacement(
      card,
      card.color,
      player
    );
  };

  const handleSelectWildColor = (
    chosenColor: UnoColor
  ) => {
    if (!pendingWildCard) return;

    setIsChoosingWildColor(false);

    executeUnoCardPlacement(
      pendingWildCard,
      chosenColor,
      'p1'
    );

    setPendingWildCard(null);
  };

  const executeUnoCardPlacement = (
    card: UnoCard,
    resolvedColor: UnoColor,
    player: 'p1' | 'p2'
  ) => {
    const isP1 = player === 'p1';

    const playerName = isP1
      ? currentDisplayMe.name || 'Yo'
      : unoMode === 'solo'
        ? 'Pareja Bot 🤖'
        : currentDisplayPartner.name ||
          'Pareja';

    if (isP1) {
      setUnoHandP1((prev) =>
        prev.filter(
          (c) => c.id !== card.id
        )
      );
    } else {
      setUnoHandP2((prev) =>
        prev.filter(
          (c) => c.id !== card.id
        )
      );
    }

    setUnoDiscard((prev) => [
      ...prev,
      card,
    ]);

    setUnoActiveColor(
      resolvedColor
    );

    playTone('water');

    const remainingCount = isP1
      ? unoHandP1.length - 1
      : unoHandP2.length - 1;

    if (remainingCount === 0) {
      setUnoGameOver(true);

      trigger3DConfetti();
      playTone('cathedral_bells');

      setUnoMessage(
        `🎉 ¡¡${playerName} SE QUEDA SIN CARTAS Y GANA LA PARTIDA DE UNO!! 🏆✨`
      );

      sendMessage(
        `🌈 [UNO en Pareja]: ¡${playerName} ha ganado la partida! 💖`
      );

      updateMyStatus({
        lastAction:
          `🌈 Ganó partida de UNO en pareja`,
      });

      return;
    }

    let nextTurn: 'p1' | 'p2' =
      isP1 ? 'p2' : 'p1';

    if (
      card.type === 'skip' ||
      card.type === 'reverse'
    ) {
      nextTurn = player;

      setUnoMessage(
        `🚫 ${playerName} tira ${
          card.type === 'skip'
            ? 'Salto'
            : 'Reversa'
        } y repite turno.`
      );
    } else if (
      card.type === 'draw2'
    ) {
      drawCardsForPlayer(
        isP1 ? 'p2' : 'p1',
        2
      );

      nextTurn = player;

      setUnoMessage(
        `➕2 ${playerName} obliga a robar 2 cartas a su rival y vuelve a jugar.`
      );
    } else if (
      card.type === 'wild4'
    ) {
      drawCardsForPlayer(
        isP1 ? 'p2' : 'p1',
        4
      );

      nextTurn = player;

      setUnoMessage(
        `💥 Comodín +4: Cambio a ${
          UNO_COLOR_STYLES[resolvedColor].name
        }, rival roba 4 y ${playerName} repite.`
      );
    } else {
      setUnoMessage(
        `🃏 ${playerName} juega ${
          card.value !== undefined
            ? card.value
            : card.type
        } (${UNO_COLOR_STYLES[resolvedColor].name}).`
      );
    }

    setUnoTurn(nextTurn);

    if (
      unoMode === 'solo' &&
      nextTurn === 'p2'
    ) {
      setTimeout(() => {
        executeBotUnoTurn(
          resolvedColor
        );
      }, 1400);
    }
  };

  // -------------------------------------------------------------------------
  // ROBAR CARTAS UNO
  // -------------------------------------------------------------------------

  const drawCardsForPlayer = (
    targetPlayer: 'p1' | 'p2',
    count: number
  ) => {
    setUnoDeck((currentDeck) => {
      let availableDeck = [
        ...currentDeck,
      ];

      if (
        availableDeck.length < count
      ) {
        const recycled =
          unoDiscard.slice(0, -1);

        availableDeck = [
          ...availableDeck,
          ...recycled,
        ];
      }

      const drawn =
        availableDeck.slice(
          0,
          count
        );

      const remaining =
        availableDeck.slice(
          count
        );

      if (targetPlayer === 'p1') {
        setUnoHandP1((prev) => [
          ...prev,
          ...drawn,
        ]);
      } else {
        setUnoHandP2((prev) => [
          ...prev,
          ...drawn,
        ]);
      }

      return remaining;
    });
  };

  // -------------------------------------------------------------------------
  // ROBAR CARTA JUGADOR
  // -------------------------------------------------------------------------

  const handlePlayerDraw = () => {
    if (unoTurn !== 'p1') return;

    drawCardsForPlayer(
      'p1',
      1
    );

    setUnoMessage(
      'Has robado 1 carta del mazo.'
    );

    playTone('digital_pulse');

    setUnoTurn('p2');

    if (
      unoMode === 'solo'
    ) {
      setTimeout(() => {
        executeBotUnoTurn(
          unoActiveColor
        );
      }, 1400);
    }
  };

  // -------------------------------------------------------------------------
  // BOT UNO
  // -------------------------------------------------------------------------

  const executeBotUnoTurn = (
    currentColor: UnoColor
  ) => {
    setUnoHandP2((botHand) => {
      const playable =
        botHand.filter((c) => {
          if (c.color === 'wild') {
            return true;
          }

          if (
            c.color === currentColor
          ) {
            return true;
          }

          if (
            topDiscard &&
            c.type === topDiscard.type &&
            c.type !== 'number'
          ) {
            return true;
          }

          if (
            topDiscard &&
            c.type === 'number' &&
            topDiscard.type === 'number' &&
            c.value ===
              topDiscard.value
          ) {
            return true;
          }

          return false;
        });

      if (playable.length > 0) {
        const cardToPlay =
          playable[0];

        let chosenColor: UnoColor =
          cardToPlay.color;

        if (
          cardToPlay.color === 'wild'
        ) {
          const colorCounts: Record<
            UnoColor,
            number
          > = {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            wild: 0,
          };

          botHand.forEach((c) => {
            if (c.color !== 'wild') {
              colorCounts[c.color]++;
            }
          });

          const sorted = (
            [
              'red',
              'yellow',
              'green',
              'blue',
            ] as UnoColor[]
          ).sort(
            (a, b) =>
              colorCounts[b] -
              colorCounts[a]
          );

          chosenColor =
            sorted[0];
        }

        if (
          botHand.length === 2
        ) {
          setUnoSaidP2(true);
          playTone(
            'morning_birds'
          );
        }

        setTimeout(() => {
          executeUnoCardPlacement(
            cardToPlay,
            chosenColor,
            'p2'
          );
        }, 100);

        return botHand;
      }

      drawCardsForPlayer(
        'p2',
        1
      );

      setUnoMessage(
        '🤖 Tu Pareja no tenía carta jugable y robó 1 del mazo.'
      );

      setUnoTurn('p1');

      return botHand;
    });
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <section className="w-full space-y-6 select-none pb-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 via-rose-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-2xl shadow-lg">
            🎲
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
              Zona de Minijuegos en Pareja
            </h3>

            <p className="text-xs text-white/60">
              Conexión, risas y toma de decisiones:
              Dado 3D, Escoba de 15 y UNO
            </p>
          </div>

        </div>

        {/* SELECTOR DE JUEGOS */}
        <div className="flex p-1 rounded-2xl bg-white/10 border border-white/15">

          <button
            type="button"
            onClick={() =>
              setActiveGame('dice')
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeGame === 'dice'
                ? 'bg-amber-500 text-slate-950'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🎲 Dado 3D
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveGame('escoba')
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeGame === 'escoba'
                ? 'bg-rose-500 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🃏 La Escoba
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveGame('uno')
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeGame === 'uno'
                ? 'bg-gradient-to-r from-red-500 via-amber-500 to-sky-500 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🌈 UNO
          </button>

        </div>
      </div>

      {/* =========================================================================
          DADO
      ========================================================================= */}

      {activeGame === 'dice' && (
        <div className="glass-card p-5 sm:p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-black/50 to-slate-900/50 space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-amber-200 uppercase">
                Dado de la Verdad 3D 🎲
              </h4>

              <p className="text-xs text-white/60">
                Cada uno elige exactamente 3 números.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <ThreeDice3D
              isRolling={isRollingDice}
              resultNumber={diceRollResult}
              onRollComplete={
                handleDiceAnimationComplete
              }
              width={290}
              height={250}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* MIS NUMEROS */}
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10">

              <div className="flex justify-between mb-3">
                <span className="text-xs font-black text-lime-300">
                  Mis números
                </span>

                <span className="text-[11px] text-white/50">
                  {myNumbers.length}/3
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(
                  (num) => {
                    const isSelected =
                      myNumbers.includes(num);

                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={
                          isRollingDice
                        }
                        onClick={() =>
                          toggleMyNumber(
                            num
                          )
                        }
                        className={`h-12 rounded-2xl font-black border ${
                          isSelected
                            ? 'bg-[#556b2f] border-lime-400 text-white'
                            : 'bg-white/5 border-white/10 text-white/70'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* NUMEROS PAREJA */}
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10">

              <div className="flex justify-between mb-3">
                <span className="text-xs font-black text-rose-300">
                  Números de mi Pareja
                </span>

                <span className="text-[11px] text-white/50">
                  {partnerNumbers.length}/3
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(
                  (num) => {
                    const isSelected =
                      partnerNumbers.includes(
                        num
                      );

                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={
                          isRollingDice
                        }
                        onClick={() =>
                          togglePartnerNumber(
                            num
                          )
                        }
                        className={`h-12 rounded-2xl font-black border ${
                          isSelected
                            ? 'bg-rose-600 border-rose-400 text-white'
                            : 'bg-white/5 border-white/10 text-white/70'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

          </div>

          {diceValidationNotice && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex gap-2">
              <AlertCircle className="w-4 h-4" />
              {diceValidationNotice}
            </div>
          )}

          <button
            type="button"
            disabled={isRollingDice}
            onClick={
              handleStartDiceRoll
            }
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-slate-950 font-black cursor-pointer shadow-lg active:scale-98 transition-all"
          >
            {isRollingDice
              ? 'Tirando dado...'
              : '¡TIRAR DADO! 🎲'}
          </button>

          {diceWinnerNotice &&
            !isRollingDice && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="p-4 rounded-3xl bg-black/40 border border-amber-400/40 text-white text-sm"
              >
                <Trophy className="w-6 h-6 text-amber-300 inline mr-2" />
                {diceWinnerNotice}
              </motion.div>
            )}

        </div>
      )}

      {/* =========================================================================
          ESCOBA
      ========================================================================= */}

      {activeGame === 'escoba' && (
        <div className="glass-card p-5 sm:p-6 border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-black/50 to-slate-900/60 space-y-5">

          {/* HEADER ESCOBA */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">

            <div>
              <h4 className="text-base font-black text-rose-200 uppercase">
                La Escoba del 15 🃏
              </h4>

              <p className="text-xs text-white/60">
                Suma exactamente 15 con una carta de tu mano y las cartas de la mesa.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <div className="flex p-1 rounded-xl bg-white/10">

                <button
                  type="button"
                  onClick={() => {
                    setEscobaMode('solo');
                    startNewEscobaGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    escobaMode === 'solo'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 inline mr-1" />
                  Solitario
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEscobaMode('couple');
                    startNewEscobaGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    escobaMode === 'couple'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Vs Pareja
                </button>

              </div>

              <button
                type="button"
                onClick={
                  startNewEscobaGame
                }
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Nueva partida"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* MARCADOR */}

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-3xl bg-black/40 border border-white/10 text-center">

            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                escobaTurn === 'p1'
                  ? 'border-lime-400 bg-lime-950/30'
                  : 'border-white/5'
              }`}
            >
              <div className="text-xs font-black text-lime-300">
                {currentDisplayMe.name ||
                  'Jugador 1'}
              </div>

              <div className="text-lg font-black text-white mt-1">
                🧹 {escobaCountP1} |
                🎴 {escobaPileP1.length}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                escobaTurn === 'p2'
                  ? 'border-rose-400 bg-rose-950/30'
                  : 'border-white/5'
              }`}
            >
              <div className="text-xs font-black text-rose-300">
                {escobaMode === 'solo'
                  ? 'Pareja Virtual 🤖'
                  : currentDisplayPartner.name ||
                    'Jugador 2'}
              </div>

              <div className="text-lg font-black text-white mt-1">
                🧹 {escobaCountP2} |
                🎴 {escobaPileP2.length}
              </div>
            </div>

          </div>

          {/* MANO P2 */}

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">

            <div className="flex items-center justify-between">

              <span className="text-xs font-bold text-white/70">
                Mano de{' '}
                {escobaMode === 'solo'
                  ? 'Pareja Virtual 🤖'
                  : currentDisplayPartner.name ||
                    'Jugador 2'}

                {escobaTurn === 'p2' && (
                  <span className="ml-2 text-rose-400 font-black animate-pulse">
                    ¡Su Turno!
                  </span>
                )}
              </span>

              <div className="flex gap-2">
                {escobaHandP2.map((card) => {
                  const isTurnP2 = escobaMode === 'couple' && escobaTurn === 'p2';
                  const isSelected = selectedHandCard?.id === card.id;
                  return (
                    <div key={card.id}>
                      {isTurnP2 ? (
                        <SpanishCardView
                          card={card}
                          size="md"
                          isSelected={isSelected}
                          onClick={() => handleSelectHandCard(card)}
                        />
                      ) : (
                        <SpanishCardView
                          card={card}
                          size="sm"
                          isFaceDown={true}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MESA */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-950/70 via-black/80 to-emerald-950/70 border-2 border-emerald-500/50 text-center space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-black text-emerald-300 uppercase">
              <span>Cartas en la Mesa ({escobaTable.length}):</span>
              <span>
                Suma:{' '}
                <strong
                  className={
                    currentEscobaSum === 15
                      ? 'text-lime-400 font-black text-sm'
                      : 'text-amber-300 font-black text-sm'
                  }
                >
                  {currentEscobaSum} / 15
                </strong>
              </span>
            </div>

            {escobaTable.length === 0 ? (
              <div className="py-8 text-white/60 text-xs italic bg-black/30 rounded-2xl border border-white/5">
                🧹 ¡La mesa está limpia! Tira una carta de tu mano para abrir la mesa.
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-2">
                {escobaTable.map((card) => {
                  const isSelected = selectedTableCards.some((sc) => sc.id === card.id);
                  return (
                    <SpanishCardView
                      key={card.id}
                      card={card}
                      isSelected={isSelected}
                      size="md"
                      onClick={() => toggleSelectTableCard(card)}
                    />
                  );
                })}
              </div>
            )}

            {/* Opciones de combinaciones posibles que suman 15 */}
            {availableCombos.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 p-2.5 rounded-2xl bg-black/60 border border-amber-400/30 mt-2">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                  💡 {availableCombos.length} combinaciones de 15:
                </span>
                {availableCombos.map((combo, idx) => {
                  const isSelectedCombo =
                    combo.length === selectedTableCards.length &&
                    combo.every((c) => selectedTableCards.some((sc) => sc.id === c.id));
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedTableCards(combo);
                        playTone('water');
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        isSelectedCombo
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-1 ring-amber-300'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      Opción {idx + 1} ({combo.length} cartas)
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTableCards([]);
                    setEscobaMessage('Mesa desmarcada. Puedes pulsar el botón abajo para descartar a la mesa.');
                  }}
                  className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 text-[11px] cursor-pointer"
                >
                  Desmarcar mesa
                </button>
              </div>
            )}
          </div>

          {/* MANO P1 */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/15 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <span>Tu Mano ({currentDisplayMe.name || 'Yo'})</span>
                {escobaTurn === 'p1' && (
                  <span className="text-[11px] text-lime-400 font-black animate-pulse bg-lime-950/60 px-2 py-0.5 rounded-full border border-lime-400/40">
                    👉 ¡Tu Turno!
                  </span>
                )}
              </span>

              <span className="text-xs text-white/70">
                Mazo restante: {escobaDeck.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              {escobaHandP1.map((card) => {
                const isSelected = selectedHandCard?.id === card.id;
                return (
                  <SpanishCardView
                    key={card.id}
                    card={card}
                    isSelected={isSelected}
                    size="lg"
                    disabled={escobaTurn !== 'p1' || escobaGameOver}
                    onClick={() => handleSelectHandCard(card)}
                  />
                );
              })}
            </div>
          </div>

          {/* MENSAJE DE ESTADO DE LA PARTIDA */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{escobaMessage}</span>
          </div>

          {/* BOTÓN JUGAR DINÁMICO */}
          {selectedHandCard &&
            !escobaGameOver &&
            (escobaMode === 'couple' || escobaTurn === 'p1') && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handlePlayEscobaCard}
                className={`w-full py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all ${
                  currentEscobaSum === 15 && selectedTableCards.length > 0
                    ? 'bg-gradient-to-r from-lime-500 to-emerald-600 text-slate-950 shadow-lime-500/40 ring-2 ring-lime-300'
                    : selectedTableCards.length === 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-amber-500/30'
                    : 'bg-white/20 text-white/70'
                }`}
              >
                {currentEscobaSum === 15 && selectedTableCards.length > 0 ? (
                  <>
                    <span>✅</span>
                    <span>
                      {selectedTableCards.length === escobaTable.length
                        ? '🧹 ¡¡HACER ESCOBA!! (+1 Pto Limpio)'
                        : `¡Suma 15! Capturar ${selectedTableCards.length + 1} Cartas`}
                    </span>
                  </>
                ) : selectedTableCards.length === 0 ? (
                  <>
                    <span>🃏</span>
                    <span>
                      Descartar {RANK_NAMES[selectedHandCard.rank] || selectedHandCard.rank} a la Mesa
                    </span>
                  </>
                ) : (
                  <>
                    <span>⚠️</span>
                    <span>
                      Suma actual: {currentEscobaSum}/15 (Debe sumar 15 para capturar o desmarca la mesa)
                    </span>
                  </>
                )}
              </motion.button>
            )}

          {/* RESULTADO */}

          {escobaGameOver &&
            escobaScores && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/80 via-black to-purple-950/80 border-2 border-amber-400/60 space-y-4 text-center shadow-2xl"
              >

                <div className="text-4xl">
                  🏆
                </div>

                <h4 className="text-xl font-black text-amber-200 font-heading">
                  ¡Fin de la Partida!
                </h4>

                <p className="text-sm font-bold text-white">
                  Ganador:{' '}
                  <span className="text-amber-300 font-black">
                    {
                      escobaScores.winnerName
                    }
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-3 text-left">

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">

                    <h5 className="text-xs font-black text-lime-300">
                      {currentDisplayMe.name ||
                        'Jugador 1'}
                      :{' '}
                      {
                        escobaScores.scoreP1
                      }{' '}
                      Pts
                    </h5>

                    <ul className="text-[11px] text-white/80 mt-2 space-y-1">

                      {escobaScores.detailsP1.map(
                        (d, i) => (
                          <li key={i}>
                            • {d}
                          </li>
                        )
                      )}

                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">

                    <h5 className="text-xs font-black text-rose-300">
                      {escobaMode ===
                      'solo'
                        ? 'Pareja Virtual 🤖'
                        : currentDisplayPartner.name ||
                          'Jugador 2'}
                      :{' '}
                      {
                        escobaScores.scoreP2
                      }{' '}
                      Pts
                    </h5>

                    <ul className="text-[11px] text-white/80 mt-2 space-y-1">

                      {escobaScores.detailsP2.map(
                        (d, i) => (
                          <li key={i}>
                            • {d}
                          </li>
                        )
                      )}

                    </ul>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    startNewEscobaGame
                  }
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-slate-950 font-black cursor-pointer shadow-lg active:scale-98 transition-all"
                >
                  🔄 Jugar Otra Partida
                </button>

              </motion.div>
            )}

        </div>
      )}

      {/* =========================================================================
          UNO
      ========================================================================= */}

      {activeGame === 'uno' && (
        <div className="glass-card p-5 sm:p-6 border-sky-500/30 bg-gradient-to-br from-sky-950/30 via-black/50 to-indigo-950/60 space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">

            <div>
              <h4 className="text-base font-black text-sky-200 uppercase">
                UNO en Pareja 🌈
              </h4>

              <p className="text-xs text-white/60">
                Deshazte de todas tus cartas emparejando por color, número o comodines.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <div className="flex p-1 rounded-xl bg-white/10">

                <button
                  type="button"
                  onClick={() => {
                    setUnoMode('solo');
                    startNewUnoGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    unoMode === 'solo'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Solitario
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUnoMode('couple');
                    startNewUnoGame();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    unoMode === 'couple'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Vs Pareja
                </button>

              </div>

              <button
                type="button"
                onClick={
                  startNewUnoGame
                }
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* MANO P2 */}

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">

            <div className="text-xs font-bold text-white/80">
              Mano de{' '}
              {unoMode === 'solo'
                ? 'Pareja Virtual 🤖'
                : currentDisplayPartner.name ||
                  'Jugador 2'}
            </div>

            <div className="flex gap-2 overflow-x-auto">

              {unoHandP2.map(
                (card) => (
                  <div
                    key={card.id}
                  >
                    {unoMode ===
                      'couple' &&
                    unoTurn ===
                      'p2' ? (
                      <UnoCardView
                        card={card}
                        size="sm"
                        disabled={
                          !canPlayUnoCard(
                            card
                          ) ||
                          unoGameOver
                        }
                        onClick={() =>
                          handlePlayUnoCard(
                            card,
                            'p2'
                          )
                        }
                      />
                    ) : (
                      <div className="w-12 h-20 rounded-xl bg-slate-900 border-2 border-white/30 flex items-center justify-center shadow-md">
                        <span className="text-xs font-black text-rose-500">
                          UNO
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}

            </div>
          </div>

          {/* CENTRO UNO */}

          <div className="flex items-center justify-center gap-8 py-4">

            <motion.button
              type="button"
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.95,
              }}
              disabled={
                unoTurn !== 'p1' ||
                unoGameOver
              }
              onClick={
                handlePlayerDraw
              }
              className="w-24 h-36 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-black border-2 border-white/30 flex flex-col items-center justify-center cursor-pointer shadow-xl"
            >
              <div className="w-14 h-20 rounded-2xl border-2 border-white/20 flex items-center justify-center bg-black/40">
                <span className="text-sm font-black text-rose-500">
                  UNO
                </span>
              </div>

              <span className="text-[10px] font-bold text-white/70 mt-1">
                Robar Carta
              </span>

              <span className="text-[9px] text-white/40">
                ({unoDeck.length})
              </span>
            </motion.button>

            <div className="flex flex-col items-center">

              {topDiscard ? (
                <div>
                  <UnoCardView
                    card={{
                      ...topDiscard,
                      color:
                        unoActiveColor,
                    }}
                    size="lg"
                  />
                </div>
              ) : (
                <div className="w-24 h-36 rounded-3xl bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center text-xs text-white/50">
                  Vacío
                </div>
              )}

              <span className="text-[11px] font-black text-white mt-2 px-3 py-1 rounded-full bg-black/50 border border-white/10">
                Color:{' '}
                {
                  UNO_COLOR_STYLES[
                    unoActiveColor
                  ].name
                }
              </span>

            </div>
          </div>

          {/* COMODIN */}

          {isChoosingWildColor && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="p-4 rounded-3xl bg-black/80 border-2 border-white/40 space-y-2 text-center"
            >

              <h5 className="text-xs font-black text-white">
                Elige un color
              </h5>

              <div className="grid grid-cols-4 gap-2">

                {(
                  [
                    'red',
                    'yellow',
                    'green',
                    'blue',
                  ] as UnoColor[]
                ).map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() =>
                      handleSelectWildColor(
                        clr
                      )
                    }
                    className={`py-3 rounded-2xl ${UNO_COLOR_STYLES[clr].bg} text-white font-black text-xs cursor-pointer shadow-md`}
                  >
                    {
                      UNO_COLOR_STYLES[
                        clr
                      ].name
                    }
                  </button>
                ))}

              </div>
            </motion.div>
          )}

          {/* MANO P1 */}

          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">

            <div className="flex items-center justify-between">

              <span className="text-xs font-black text-white uppercase">
                Tu Mano (
                {currentDisplayMe.name ||
                  'Yo'}
                )
              </span>

              {unoHandP1.length <=
                2 && (
                <button
                  type="button"
                  onClick={() => {
                    setUnoSaidP1(
                      true
                    );

                    trigger3DConfetti();

                    playTone(
                      'cathedral_bells'
                    );

                    sendMessage(
                      `🗣️ ¡¡${
                        currentDisplayMe.name ||
                        'Yo'
                      } cantó UNO en pareja!! 💖`
                    );
                  }}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs cursor-pointer shadow-lg animate-pulse"
                >
                  ¡¡CANTAR UNO!! 🗣️
                </button>
              )}

            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">

              {unoHandP1.map(
                (card) => {

                  const playable =
                    canPlayUnoCard(
                      card
                    ) &&
                    unoTurn ===
                      'p1';

                  return (
                    <UnoCardView
                      key={card.id}
                      card={card}
                      size="lg"
                      disabled={
                        !playable ||
                        unoGameOver
                      }
                      onClick={() =>
                        handlePlayUnoCard(
                          card
                        )
                      }
                    />
                  );
                }
              )}

            </div>
          </div>

          {/* MENSAJE UNO */}

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>
              {unoMessage}
            </span>
          </div>

        </div>
      )}
    </section>
  );
};
