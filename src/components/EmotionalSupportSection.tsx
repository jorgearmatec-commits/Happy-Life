import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Dices,
  Smile,
  ShieldCheck,
  Brain,
  MessageCircle,
  HelpCircle,
  Volume2,
  Sun,
  Sunset,
  Moon,
  Info,
  Trophy,
  Bell,
  RotateCw,
  Heart
} from 'lucide-react';
import { useApp, EMOTION_OPTIONS } from '../context/AppContext';
import { ModalPortal } from './ModalPortal';

// =========================================================================
// MÁS DE 100 CONSEJOS COMPLETOS (20+ POR CADA APARTADO) PARA PAREJAS
// =========================================================================
export const COMPREHENSIVE_ADVICE = [
  // -------------------------------------------------------------
  // 1. RECIÉN CASADOS Y CONVIVENCIA (21 CONSEJOS)
  // -------------------------------------------------------------
  {
    category: 'Parejas Recién Casadas',
    tag: 'Convivencia y Rutina',
    text: 'El primer año de matrimonio no es para convertirse en clones, sino para aprender el mapa interior del otro. Cuando convivan, descubrirán manías y ritmos distintos. En lugar de decir "¿por qué lo haces así?", pregunten con curiosidad: "¿cómo te hace sentir esta forma de hacerlo?".',
    actionTip: 'Elijan 2 tareas del hogar que a cada uno le causen menos estrés sensorial y asuman esas como su especialidad amorosa.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Comunicación en el Conflicto',
    text: 'En los desacuerdos, recuerden siempre: ustedes dos son un equipo contra la dificultad, nunca el uno contra el otro. Si una discusión sube de tono, activen la "pausa sagrada de 15 minutos": se separan físicamente, beben agua fría, respiran, y vuelven a hablar con el corazón más templado.',
    actionTip: 'Creen una palabra clave divertida (como "Koala" o "Burbuja") que signifique: "Te amo, pero mi mente está abrumada, pausemos 15 minutos".',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Espacio Personal Sagrado',
    text: 'Estar casados no significa renunciar a la individualidad. Pasar horas a solas en su propio rincón no es desamor, es el combustible que permite después reencontrarse con ternura y ganas de compartir.',
    actionTip: 'Establezcan al menos una "tarde libre sin expectativas" a la semana para que cada uno disfrute de sus intereses personales.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Finanzas y Tranquilidad Mutua',
    text: 'El dinero es uno de los temas que más sobrecarga sensorial y ansiedad genera. No hablen de finanzas o cuentas cuando estén cansados o con hambre al final de la jornada. Agenden una "cita de presupuesto" mensual con café rico y calma.',
    actionTip: 'Tengan una cuenta conjunta para gastos del hogar y un porcentaje de libre disposición individual sin rendición de cuentas.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Rituales de Conexión Diaria',
    text: 'Las rutinas predecibles otorgan una inmensa seguridad al sistema nervioso. Un beso sostenido de 6 segundos al despedirse o al reencontrarse libera oxitocina suficiente para regular el estrés del día completo.',
    actionTip: 'Den un abrazo de pecho con pecho respirando sincronizados durante 3 respiraciones profundas cada mañana.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Carga Mental Doméstica',
    text: 'Hacer una tarea del hogar no es solo ejecutarla, sino anticiparla, recordarla y planificarla. Hablen abiertamente sobre quién lleva la carga mental de las compras, el aseo y la comida para equilibrar el peso.',
    actionTip: 'Hagan una lista visible en el refrigerador de compras de la semana para que ninguno tenga que guardar todo en la memoria.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Expectativas vs Realidad',
    text: 'El amor maduro no es un cuento de hadas sin tropiezos, sino dos personas imperfectas decidiendo amarse con paciencia todos los días.',
    actionTip: 'Escriban una nota de agradecimiento a la semana por un detalle pequeño que el otro hizo por el hogar.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Familia Política y Límites',
    text: 'Al casarse, su nuevo hogar es su primera prioridad. Establezcan límites claros y cariñosos con sus familias de origen para proteger su intimidad como pareja.',
    actionTip: 'Acuerden siempre en privado antes de confirmar visitas o planes familiares grandes.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Intimidad y Deseo',
    text: 'La intimidad cambia con el cansancio cotidiano. La cercanía física sin presión sexual (caricias en la espalda, tomarse de la mano) mantiene la ternura encendida.',
    actionTip: 'Dense 10 minutos de masajes suaves en los pies o cuello antes de dormir sin expectativas posteriores.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'El Arte de Pedir Perdón',
    text: 'Un perdón sincero no incluye la palabra "pero". Cambien "perdón si te molestó, pero tú también..." por "lamento haberte hablado con ese tono, veo que te dolió y cuidaré cómo te lo digo".',
    actionTip: 'Practiquen reparar el error con un gesto de servicio afectivo el mismo día.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Días de Baja Energía',
    text: 'Habrá días donde uno de los dos solo pueda dar un 20%. En ese momento, el otro puede aportar el 80% restante con amor, sabiendo que la balanza se invertirá en el futuro.',
    actionTip: 'Pregunten por la mañana: "¿Qué porcentaje de energía tienes hoy del 1 al 100?".',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Citas Fuera de Casa',
    text: 'No dejen que la rutina los convierta solo en compañeros de departamento. Sigan teniendo citas como cuando eran novios, explorando lugares nuevos.',
    actionTip: 'Planifiquen una cita sorpresa al mes, turnándose la organización cada uno.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Higiene del Sueño en Pareja',
    text: 'Dormir con ritmos o temperaturas distintas es común. Si uno necesita cobija más pesada o tapones de oídos, adapten la cama para que ambos descansen profundamente.',
    actionTip: 'Usen dos sábanas o edredones individuales en la misma cama para evitar tirones nocturnos.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Celebrar Pequeños Logros',
    text: 'Festejen cuando logren armar un mueble, pagar una cuenta pendiente o simplemente sobrevivir a una semana agotadora de trabajo.',
    actionTip: 'Brinden con su bebida favorita al final del viernes por haber sido un gran equipo durante la semana.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Validación en Días Grises',
    text: 'Cuando tu pareja llegue triste o de mal humor, no intentes "arreglar" su problema al instante; primero valida su emoción con un abrazo cálido.',
    actionTip: 'Pregunta: "¿Necesitas desahogo, un consejo o simplemente un abrazo en silencio?".',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Comidas sin Pantallas',
    text: 'Cenar mirando el teléfono distancia a la pareja sin que se den cuenta. Compartir al menos una comida al día mirándose a los ojos nutre el alma.',
    actionTip: 'Pongan los teléfonos en modo avión durante la cena por 20 minutos.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Construir Tradiciones Propias',
    text: 'Las parejas más unidas crean pequeñas tradiciones que solo les pertenecen a ellos dos: los domingos de hotcakes, una serie específica los martes, etc.',
    actionTip: 'Inventen un desayuno temático exclusivo de los fines de semana.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Paciencia con el Aprendizaje',
    text: 'Nadie nace sabiendo vivir en pareja. Sean pacientes consigo mismos mientras aprenden a coordinarse como equipo.',
    actionTip: 'Ríanse juntos de los pequeños chascarros domésticos en vez de frustrarse.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'El Poder del Agradecimiento',
    text: 'Dar por sentado que el otro cocina, limpia o trabaja apaga el entusiasmo. Agradecer las cosas cotidianas renueva la generosidad mutua.',
    actionTip: 'Di "gracias por la cena deliciosa" o "gracias por ordenar hoy" cada día.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Vulnerabilidad sin Juicio',
    text: 'Poder llorar o admitir miedo frente a tu cónyuge sin temor a ser criticado es la definición máxima de un hogar seguro.',
    actionTip: 'Escucha a tu pareja sin interrumpir por 5 minutos completos cuando te hable de sus miedos.',
  },
  {
    category: 'Parejas Recién Casadas',
    tag: 'Renovación de Compromiso',
    text: 'El matrimonio no es una meta alcanzada, es un jardín que se riega con atención y ternura cada día.',
    actionTip: 'Mírense fijamente a los ojos por 30 segundos y sonrían sinceramente antes de dormir.',
  },

  // -------------------------------------------------------------
  // 2. PAREJAS NEURODIVERGENTES (21 CONSEJOS)
  // -------------------------------------------------------------
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Doble Empatía',
    text: 'La teoría de la doble empatía nos enseña que las diferencias en cómo procesamos el mundo no son defectos, sino dialectos neurológicos distintos. No supongan que un rostro serio o un silencio significa enfado. Pregunten con gentileza: "¿Estás cansado/a o hay algo que pueda hacer por ti?".',
    actionTip: 'Usen el sistema de colores de la app (Verde, Amarillo, Rojo) para avisar cómo está su batería sin tener que dar explicaciones largas.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Descompresión Sensorial Mutua',
    text: 'Al llegar a casa después del trabajo o la calle, ambos sistemas nerviosos están saturados de estímulos. Dense 20 a 30 minutos de "aterrizaje suave" con luces tenues y sin preguntas sobre trámites ni decisiones del día.',
    actionTip: 'Creen una "zona de descarga" en la entrada donde dejar llaves, mochilas y ponerse ropa holgada inmediatamente.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Comunicación en Paralelo (Body Doubling)',
    text: 'Para las mentes neurodivergentes, estar en la misma habitación haciendo cosas totalmente distintas sin hablarse ("juego paralelo") es una de las mayores expresiones de intimidad y seguridad afectiva.',
    actionTip: 'Pongan música suave y lean o dibujen juntos en el sillón sin necesidad de mantener conversación.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Regulación del Sistema Nervioso',
    text: 'Cuando uno esté sobrecargado, el tacto firme y la compresión suave (abrazo de oso con consentimiento) pueden calmar el sistema simpático de inmediato.',
    actionTip: 'Pregunten antes de tocar: "¿Quieres presión profunda o espacio sin contacto físico?".',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Sobrecarga de Decisiones',
    text: 'Tener que elegir qué cenar o a dónde ir después de un día saturado puede provocar crisis de llanto o irritabilidad. Simplifiquen las opciones.',
    actionTip: 'En lugar de "¿Qué quieres cenar?", ofrezcan solo 2 opciones concretas: "¿Prefieres pasta o quesadillas?".',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Días No Verbales',
    text: 'A veces, hablar en voz alta consume demasiada energía neurológica. Acepten tener momentos o tardes en modo no verbal comunicándose por la app o con señas cariñosas.',
    actionTip: 'Usen el Mini Chat de Happy Life Duo para escribirse incluso estando en la misma casa.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Sensibilidad a Texturas y Alimentos',
    text: 'Si a uno le desagrada el olor o textura de un ingrediente, no es un capricho; es una señal neurológica de incomodidad real.',
    actionTip: 'Tengan comidas "seguras" siempre disponibles en el congelador para días de baja tolerancia sensorial.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Cojines y Mantas de Peso',
    text: 'Las mantas con peso (weighted blankets) son herramientas terapéuticas probadas para reducir el cortisol y estabilizar las emociones compartidas.',
    actionTip: 'Tengan una manta pesada en el sillón para ver películas juntos cobijados.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Luz Cálida y Protección Auditiva',
    text: 'Las luces fluorescentes o ruidos de fondo constantes drenan la batería social rápidamente sin que lo noten.',
    actionTip: 'Reemplacen bombillas blancas por luces cálidas o lámparas de sal con regulador de brillo.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Acuerdos Escritos Claros',
    text: 'La memoria de trabajo neurodivergente suele saturarse. Los acuerdos hablados al aire se olvidan; los acuerdos escritos en la app dan paz y previsibilidad.',
    actionTip: 'Guarden los recordatorios y fechas importantes en la sección de Recordatorios de la app.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Reconocimiento de Stimming',
    text: 'Mover las manos, mecerse o tararear (stimming) son formas sanas de autorregulación. Celébrenlas y no las repriman.',
    actionTip: 'Tengan a mano juguetes sensoriales (pop-its, texturas suaves) en la sala.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Anticipación de Cambios',
    text: 'Los cambios repentinos de planes disparan la respuesta de lucha o huida. Avisen con tiempo cualquier modificación de la rutina.',
    actionTip: 'Si surge una visita o plan imprevisto, den al menos 1 hora de advertencia previa.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Respeto al Interés Especial',
    text: 'Escuchar al otro hablar apasionadamente sobre su tema de hiperfoco durante 15 minutos es una forma profunda de decirle "me importa lo que te hace feliz".',
    actionTip: 'Hagan preguntas sinceras sobre el tema que a tu pareja le fascina.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Descompresión Post-Social',
    text: 'Después de asistir a una fiesta o reunión familiar, planifiquen siempre el día siguiente completamente libre de compromisos para recargar energía.',
    actionTip: 'Declaren el domingo como "zona de ermitaños en pijama" para recuperarse juntos.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'No Verbalizar con Furia',
    text: 'Cuando la mente esté al borde del colapso, lo que se diga puede sonar cortante aunque no haya mala intención. Conozcan sus señales de alarma.',
    actionTip: 'Muestren la tarjeta de "Necesito una pausa" en la app antes de llegar al límite.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Pausas en Conversaciones Complejas',
    text: 'Procesar argumentos lógicos y emociones a la vez cuesta más trabajo. Permitir silencios de 30 segundos durante una charla evita respuestas defensivas.',
    actionTip: 'Di: "Estoy pensando lo que me dijiste, dame un momento para ordenarlo".',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Tolerancia al Desorden Temporal',
    text: 'En épocas de agotamiento, el orden perfecto pasa a segundo plano. Prioricen la salud mental sobre la casa impecable.',
    actionTip: 'Usen platos desechables biodegradables los días en que lavar trastes sea una montaña inalcanzable.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Validación del Cansancio Invisible',
    text: 'Enmascarar (masking) en el trabajo agota tanto como correr un maratón. Reconozcan el valor de su pareja al llegar a casa.',
    actionTip: 'Dile: "Sé que el mundo exterior es agotador, aquí puedes ser 100% tú".',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Canalizar el Hiperfoco en Pareja',
    text: 'Cuando ambos compartan un interés especial, úsenlo como un puente de diversión y compañerismo sin juicios.',
    actionTip: 'Armen un rompecabezas o jueguen un videojuego cooperativo juntos.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Micro-Momentos de Ternura',
    text: 'No se necesitan grandes declaraciones diarias; un emoji enviado por la app o dejarle un dulce favorito en la mesa fortalece el lazo.',
    actionTip: 'Envíale un mensaje rápido de apoyo en el Mini Chat durante la tarde.',
  },
  {
    category: 'Parejas Neurodivergentes',
    tag: 'Agradecer la Singularidad Mutua',
    text: 'Su manera de ver el mundo es única. No comparen su relación con parejas neurotípicas de redes sociales; construyan sus propias reglas felices.',
    actionTip: 'Anota en el diario de la app una cualidad que ames de su mente neurodivergente.',
  },

  // -------------------------------------------------------------
  // 3. AUTISMO (TEA) EN LA PAREJA (21 CONSEJOS)
  // -------------------------------------------------------------
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Claridad sin Indirectas',
    text: 'Las personas autistas procesan la comunicación de forma literal y transparente. Las indirectas, el sarcasmo sutil o esperar que "adivine lo que siento" genera una angustia inmensa. Si necesitas algo, pídelo de forma clara, directa y amorosa.',
    actionTip: 'En lugar de suspirar y decir "no me pasa nada", di: "Me siento abrumado/a y necesito que me abraces por 5 minutos".',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Sobrecarga Sensorial (Meltdown/Shutdown)',
    text: 'Un colapso autista (meltdown o shutdown) no es una rabieta ni una manipulación; es un cortocircuito temporal del sistema nervioso por saturación de estímulos. En ese momento, no intenten razonar ni hacer preguntas.',
    actionTip: 'Baja las luces de inmediato, apaga ruidos fuertes, ofrece audífonos canceladores de ruido y quédate cerca en silencio como ancla de seguridad.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Previsibilidad y Cambios de Rutina',
    text: 'Saber qué va a suceder a lo largo del día otorga paz interior. Si surge un imprevisto, den tiempo para reorientar el plan mental paso por paso.',
    actionTip: 'Repasen juntos el itinerario de la tarde antes de salir de casa.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Contacto Visual Relajado',
    text: 'Para muchas personas en el espectro, sostener la mirada mientras escuchan consume casi toda su energía de procesamiento. No mirar a los ojos no significa falta de interés.',
    actionTip: 'Tengan conversaciones importantes caminando uno al lado del otro o mirando hacia el mismo horizonte.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Expresión Emocional Diferente (Alexitimia)',
    text: 'Identificar y poner en palabras lo que se siente en el cuerpo puede tardar horas. No exijan respuestas emocionales inmediatas durante una conversación difícil.',
    actionTip: 'Usa la rueda de emociones de la app para elegir un emoji que represente cómo se siente el cuerpo.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Seguridad en el Contacto Físico',
    text: 'El tacto inesperado o una caricia ligera puede sentirse como una descarga eléctrica o cosquillas molestas. El tacto firme y anticipado es mucho más regulador.',
    actionTip: 'Siempre avisa antes de abrazar: "Te voy a dar un abrazo apretado, ¿está bien?".',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Ropa Cómoda en el Hogar',
    text: 'Las costuras, etiquetas o telas sintéticas pueden mantener el sistema nervioso en alerta continua sin que la persona lo note.',
    actionTip: 'Quiten etiquetas de la ropa y tengan ropa de algodón suave lista para descansar en casa.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Intereses Especiales Compartidos',
    text: 'El interés especial es un refugio de alegría profunda. Acompañar a la pareja a su tienda favorita o investigar su pasión demuestra amor incondicional.',
    actionTip: 'Dediquen una tarde al mes a explorar el tema favorito de tu pareja.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Lugares Públicos con Plan de Escape',
    text: 'Ir a centros comerciales o restaurantes concurridos puede provocar saturación rápida. Tengan siempre acordada una señal de salida discreta.',
    actionTip: 'Acuerden: "Si cualquiera dice la palabra \'Nube\', salimos al auto sin dar explicaciones ni sentir culpa".',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Audífonos con Cancelación de Ruido',
    text: 'Usar audífonos mientras cocinan o limpian no es aislarse del otro, es proteger los oídos para poder disfrutar después de la compañía.',
    actionTip: 'Tengan los audífonos con batería completa cargados en la mesita de noche.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Elogio Directo y Específico',
    text: 'Los cumplidos vagos como "te ves bien" a veces causan confusión. Los cumplidos concretos como "me encanta cómo te queda esa playera verde" resuenan con claridad.',
    actionTip: 'Haz un cumplido específico y descriptivo hoy.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Tiempo de Transición entre Actividades',
    text: 'Pasar de estar concentrado en la computadora a salir a cenar requiere un periodo de desconexión gradual.',
    actionTip: 'Da aviso 15 y 5 minutos antes de tener que salir de casa.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'El Valor del Silencio Amable',
    text: 'Estar juntos en silencio no significa tensión ni distancia; para el cerebro autista es el estado de mayor descanso y comodidad compartida.',
    actionTip: 'Aprecien el silencio juntos sin la necesidad de llenar el vacío con palabras.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Instrucciones en Pasos Concretos',
    text: 'Decir "ordena la casa" es abrumador por lo inespecífico. Decir "pon la ropa sucia en el canasto y lleva los platos a la cocina" es fácil de ejecutar.',
    actionTip: 'Divide las tareas en 2 o 3 pasos claros numerados.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Comprender la Honestidad Radical',
    text: 'Si una persona autista dice que una comida no le gustó, no está siendo grosera; está compartiendo un dato objetivo. Aprecien su sinceridad.',
    actionTip: 'Recuerda que su intención nunca es herir, sino ser genuino y transparente.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Cuidado con Olores Fuertes',
    text: 'Perfumes intensos o productos de limpieza químicos pueden causar dolor de cabeza o náuseas instantáneas.',
    actionTip: 'Usen productos de limpieza neutros y sin fragancias sintéticas agresivas.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Validar la Necesidad de Repetición',
    text: 'Comer la misma comida varios días seguidos o ver la misma película favorita aporta tranquilidad y ahorra energía mental.',
    actionTip: 'Acepten con cariño las comidas o películas de confort.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Agradecer la Fidelidad Profunda',
    text: 'La lealtad y el compromiso en el vínculo autista son sólidos como una roca una vez que se sienten en un entorno seguro.',
    actionTip: 'Dile a tu pareja cuánto valoras su constancia y lealtad en tu vida.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Espacio Seguro en Casa',
    text: 'Tener un rincón o cuarto donde nadie entre a interrumpir es el santuario de recarga necesario para evitar el burnout.',
    actionTip: 'Acondicionen un rincón con cobijas, luz tenue y cojines para descompresión.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'Preguntar antes de Reorganizar Cosas',
    text: 'Mover de lugar objetos personales de la pareja autista puede desorientar su mapa mental y generar ansiedad.',
    actionTip: 'Pregunta antes de limpiar su escritorio o zona de trabajo.',
  },
  {
    category: 'Autismo (TEA) en la Pareja',
    tag: 'El Amor en Acciones Concretas',
    text: 'Quizás no use palabras poéticas todos los días, pero cargar la batería de tu teléfono, revisar el auto o cuidar los detalles son sus cartas de amor.',
    actionTip: 'Reconoce los actos de servicio de tu pareja como declaraciones genuinas de amor.',
  },

  // -------------------------------------------------------------
  // 4. TDAH EN LA PAREJA (21 CONSEJOS)
  // -------------------------------------------------------------
  {
    category: 'TDAH en la Pareja',
    tag: 'Ceguera Temporal y Olvidos',
    text: 'El cerebro con TDAH vive en dos zonas temporales: "Ahora" y "No ahora". Olvidar sacar la basura, pagar una cuenta o contestar un mensaje NO es falta de amor ni desinterés; es una falla involuntaria de la memoria de trabajo y la dopamina.',
    actionTip: 'No asuman desidia. Usen alarmas compartidas, notas visibles en la app y pongan recordatorios auditivos con tonos cálidos.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Acompañamiento en Tareas (Body Doubling)',
    text: 'Iniciar una tarea aburrida (doblar ropa, ordenar, contestar correos) causa parálisis por falta de dopamina. Si te sientas al lado simplemente con tu presencia, la tarea se desbloquea casi mágicamente.',
    actionTip: 'Ofrece 15 minutos de compañía silenciosa: "Yo me siento aquí mientras tú ordenas tus papeles, estoy contigo".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Sensibilidad al Rechazo (RSD)',
    text: 'La Disforia Sensible al Rechazo hace que una crítica constructiva o un tono cortante se sienta como un dolor físico insoportable. Cuiden las palabras.',
    actionTip: 'Comiencen cualquier señalamiento reafirmando el amor: "Te amo profundamente y sé que te esforzaste, ¿podemos revisar este detalle juntos?".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Transición Fuera del Hiperfoco',
    text: 'Interrumpir a alguien en pleno hiperfoco es como frenar un tren a toda velocidad: genera irritabilidad involuntaria.',
    actionTip: 'Toca suavemente su hombro y avisa: "En 10 minutos tenemos que comer, empieza a guardar lo tuyo".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Evitar el Rol de "Padre / Madre"',
    text: 'Uno de los mayores peligros en parejas con TDAH es que la pareja no-TDAH asuma un rol de regañar y supervisar. Eso destruye la pasión y el romance.',
    actionTip: 'Deleguen la supervisión a alarmas del teléfono y a la app, no a la pareja como fiscalizador.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Búsqueda de Novedad y Dopamina',
    text: 'El aburrimiento es doloroso para el TDAH. Introducir pequeñas novedades en su rutina mantiene vivo el entusiasmo.',
    actionTip: 'Cambien de ruta al caminar, prueben un postre nuevo o cambien los muebles de lugar juntos.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'El Lugar Clave de las Cosas',
    text: 'Perder llaves, cartera o teléfono cada mañana causa frustración diaria. Creen un único sitio sagrado para objetos esenciales.',
    actionTip: 'Coloquen una bandeja junto a la puerta principal y hagan el hábito de dejar llaves y cartera ahí nada más entrar.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Micro-Tareas con Temporizador (Pomodoro)',
    text: 'Ver una montaña de quehaceres congela la iniciativa. Poner un temporizador de 10 minutos para "hacer lo que alcancemos" rompe la inercia.',
    actionTip: 'Pongan música animada y ordenen a toda velocidad durante 10 minutos exactos.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Paciencia con las Interrupciones',
    text: 'La mente con TDAH salta entre ideas y a veces interrumpe por miedo a olvidar su pensamiento, no por falta de respeto.',
    actionTip: 'Tengan una libreta cerca en la mesa para que pueda anotar su idea y esperar su turno con calma.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Validar la Creatividad y Pasión',
    text: 'La espontaneidad y entusiasmo del TDAH aportan chispa y aventura a la relación. Valoren sus ocurrencias brillantes.',
    actionTip: 'Felicita a tu pareja cuando proponga una solución creativa e inesperada a un problema.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'No Guardar Cosas "Invisibles"',
    text: '"Fuera de la vista, fuera de la mente". Si guardas algo en un cajón opaco, el cerebro TDAH olvidará que existe.',
    actionTip: 'Usen cajas transparentes o repisas abiertas para guardar cosas que necesiten recordar usar.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Agradecer el Esfuerzo Oculto',
    text: 'Hacer tareas cotidianas para un cerebro con déficit dopaminérgico cuesta el triple de energía que para otros cerebros.',
    actionTip: 'Reconoce el esfuerzo: "Sé lo difícil que fue concentrarte en esto hoy, gracias por hacerlo".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Dividir Proyectos Grandes',
    text: 'Un proyecto como "pintar la casa" es abrumador. Conviértanlo en "comprar la pintura el sábado" y "pintar una sola pared el domingo".',
    actionTip: 'Anota solo el siguiente paso inmediato en lugar de la lista completa.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Gestión de la Impulsividad',
    text: 'Comprar por impulso para obtener dopamina puede dañar las finanzas. Apliquen la regla de esperar 48 horas antes de cualquier compra no esencial.',
    actionTip: 'Guarden el artículo en la lista de deseos y esperen dos días antes de decidir.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Descargas Físicas de Energía',
    text: 'El cuerpo necesita liberar energía inquieta para que la mente pueda calmarse y dormir mejor.',
    actionTip: 'Salgan a dar una caminata enérgica de 15 minutos juntos antes de cenar.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Celebrar Cuando se Termina una Tarea',
    text: 'Terminar proyectos es el talón de Aquiles del TDAH. Cada vez que tu pareja concluya algo pendiente, festéjenlo.',
    actionTip: 'Den un choque de manos sonoro y celebren con un abrazo alegre.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Cuidado con la Pérdida de la Noción del Tiempo',
    text: 'Mirar el celular o jugar por "5 minutos" puede convertirse fácilmente en 3 horas sin darse cuenta.',
    actionTip: 'Pongan alarmas con nombres cariñosos: "Hora de apagar pantallas y abrazar a mi amor".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'No Repetir Recordatorios en Tono de Queja',
    text: 'Repetir cinco veces "¿ya lo hiciste?" genera resentimiento. Establezcan recordatorios visuales que hablen por sí solos.',
    actionTip: 'Usa una nota adhesiva de color brillante o la sección de Recordatorios de la app.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Aceptar Días de Parálisis Ejecutiva',
    text: 'Habrá días donde el cerebro simplemente no encienda sus motores ejecutivos. La culpa solo empeora el bloqueo.',
    actionTip: 'Apoya con ternura: "Hoy tu motor está frío, descansemos y mañana lo intentamos".',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'El Poder del Humor Compartido',
    text: 'Reírse juntos cuando busquen los lentes que tenían puestos en la cabeza quita tensión y une los corazones.',
    actionTip: 'Ríanse con complicidad de las pequeñas anécdotas despistadas del día.',
  },
  {
    category: 'TDAH en la Pareja',
    tag: 'Amor Incondicional Frente a la Distracción',
    text: 'Saber que su pareja no lo juzga por su neurotipo convierte el hogar en el verdadero lugar seguro para una mente inquieta.',
    actionTip: 'Dile hoy: "Amo tu mente brillante y rápida, eres perfecto/a para mí".',
  },

  // -------------------------------------------------------------
  // 5. TLP Y REGULACIÓN AFECTIVA (21 CONSEJOS)
  // -------------------------------------------------------------
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Terror al Abandono y Validación',
    text: 'Para quien vive con TLP, un silencio prolongado, un mensaje tardío o una mirada distraída puede activar de golpe un pánico profundo al rechazo o abandono. La respuesta calmante no es la lógica fría, sino la validación afectiva constante.',
    actionTip: 'Di con voz suave: "Aquí estoy, no me voy a ir a ninguna parte. Te amo y estamos bien juntos".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Desescalar la Tormenta Emocional',
    text: 'Durante una ola de dolor o angustia intensa, la corteza prefrontal queda temporalmente desconectada por la amígdala. Intentar debatir argumentos solo echa leña al fuego.',
    actionTip: 'Apliquen la técnica TIPP de regulación: agua fría en el rostro, respiración en 4 tiempos y presencia calmada.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Pensamiento Blanco o Negro (Splitting)',
    text: 'El splitting hace que en un instante pases de ser la persona más perfecta del mundo a quien supuestamente "nunca lo/la amó". Recuerden que es una defensa traumática contra el dolor.',
    actionTip: 'No te defiendas con ira. Responde con anclaje: "Sé que ahora estás sintiendo mucho dolor, pero mi amor por ti sigue intacto".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Reafirmación Antes de Salir',
    text: 'Separarse temporalmente (ir al trabajo o salir con amigos) puede disparar angustia de desconexión.',
    actionTip: 'Da un abrazo apretado antes de salir y di a qué hora regresarás: "Te amo, regreso a las 7:00 pm para cenar juntos".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Límites Amorosos y Claros',
    text: 'Tener límites no es rechazar; los límites claros dan una inmensa seguridad al saber dónde termina uno y empieza el otro.',
    actionTip: 'Di: "Te amo demasiado para discutir a gritos. Me sentaré a tu lado en silencio hasta que ambos podamos hablar con calma".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Validación Antes de la Solución',
    text: 'Las emociones intensas necesitan ser sentidas y escuchadas antes de buscar soluciones lógicas.',
    actionTip: 'Usa frases como: "Entiendo por qué te dolió tanto eso, tiene todo el sentido que te sientas así".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Kit de Emergencia Sensorial',
    text: 'Tener objetos que anclen a la realidad ayuda a salir de estados de disociación o angustia aguda.',
    actionTip: 'Tengan a mano un cubo de hielo en las manos, una esencia relajante de lavanda o una cobija suave.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Reconocer el Esfuerzo de Regulación',
    text: 'Gestionar emociones de alta intensidad requiere una fuerza colosal que merece ser aplaudida.',
    actionTip: 'Dile: "Vi cómo respiraste y pudiste expresar tu dolor sin herir; estoy muy orgulloso/a de ti".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'No Tomar los Ataques como Algo Personal',
    text: 'Cuando la tormenta estalla, las palabras hirientes son el llanto de un niño interior herido pidiendo auxilio.',
    actionTip: 'Respira hondo y recuerda que el amor es el refugio más seguro frente a la tormenta.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Mensajes de Conexión en el Día',
    text: 'Un mensaje breve a mitad de la mañana rompe la sensación de vacío o aislamiento que a veces aparece.',
    actionTip: 'Manda un emoji de corazón o una foto de algo que te recordó a tu pareja.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Cuidado del Cuidador',
    text: 'La pareja de alguien con TLP también necesita cuidar su propia salud mental para poder ser un apoyo sólido y amoroso.',
    actionTip: 'Dedica tiempo a tus propios pasatiempos y amigos sin culpa.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Diálogo Post-Crisis sin Rencor',
    text: 'Una vez pasada la tormenta y con el sistema nervioso en paz, hablen con cariño sobre lo que detonó la crisis para prevenirla en el futuro.',
    actionTip: 'Pregunten: "¿Qué fue lo primero que encendió la alarma y cómo podemos cuidarnos mejor la próxima vez?".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'El Abrazo como Ancla Fisiológica',
    text: 'Sostener a la pareja con firmeza mientras llora ayuda a sincronizar los latidos cardíacos y reducir la hiperventilación.',
    actionTip: 'Abraza por la espalda o pecho y respira lento y profundo para que tu ritmo cardíaco guíe el suyo.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Evitar Amenazas de Ruptura',
    text: 'Nunca digan "entonces mejor terminamos" o "no sé si quiero seguir" durante una discusión. Esa frase confirma el peor terror de abandono.',
    actionTip: 'Comprométanse a eliminar las amenazas de separación del vocabulario de discusión.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Terapia y Acompañamiento Profesional',
    text: 'La terapia dialéctico conductual (DBT) es una bendición para el TLP. Apoyar a la pareja en su proceso terapéutico es un acto supremo de amor.',
    actionTip: 'Pregunta con ternura qué herramientas aprendió en su sesión de terapia esta semana.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Celebrar los Periodos de Calma',
    text: 'Cuando haya días tranquilos y hermosos, disfrútenlos plenamente sin esperar con miedo la siguiente tormenta.',
    actionTip: 'Dile: "Qué paz tan bonita estamos viviendo hoy, gracias por construirla conmigo".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Identificar Detonantes Ocultos (Triggers)',
    text: 'El cansancio, el hambre, un dolor físico o una mala noticia ajena pueden bajar las defensas emocionales.',
    actionTip: 'Antes de hablar de un tema tenso, asegúrense de haber comido y descansado.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Amor Inquebrantable',
    text: 'El mayor regalo para quien vive con TLP es comprobar a lo largo de los meses que su pareja no huye frente a su dolor.',
    actionTip: 'Recuérdale: "Te amo con todas tus luces y también cuando hay nubes oscuras".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'La Importancia de la Rutina Diaria',
    text: 'Tener horarios predecibles para dormir, comer y verse aporta un piso firme sobre el cual apoyarse emocionalmente.',
    actionTip: 'Procuren acostarse a la misma hora la mayoría de las noches.',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'Escribir Cartas de Anclaje para Crisis',
    text: 'En los momentos más oscuros, la persona olvida que es amada. Una carta escrita en un día feliz le recordará la verdad.',
    actionTip: 'Escríbanle una carta que diga: "Cuando leas esto y sientas que no vales nada, recuerda que te amo con locura".',
  },
  {
    category: 'TLP (Trastorno Límite) y Regulación Afectiva',
    tag: 'La Esperanza de un Vínculo Seguro',
    text: 'Las investigaciones demuestran que una relación amorosa, consistente y segura es uno de los mayores factores de remisión y sanación del TLP.',
    actionTip: 'Abrácense con fuerza y agradézcanse mutuamente por nunca soltarse.',
  },
];

// Opciones de categorías para filtrar consejos
const ADVICE_CATEGORIES = [
  'Todos',
  'Parejas Recién Casadas',
  'Parejas Neurodivergentes',
  'Autismo (TEA)',
  'TDAH',
  'TLP y Regulación',
];

export const EmotionalSupportSection: React.FC = () => {
  const { me, partner, activeRole, updateMyFeeling, settings, sendMessage } = useApp();

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('Todos');
  const [adviceIndex, setAdviceIndex] = useState<number>(0);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceWinnerNotice, setDiceWinnerNotice] = useState<string | null>(null);

  const currentDisplayMe = activeRole === 'me' ? me : partner;

  const filteredAdvice =
    selectedFilterCategory === 'Todos'
      ? COMPREHENSIVE_ADVICE
      : COMPREHENSIVE_ADVICE.filter((a) =>
          selectedFilterCategory === 'Autismo (TEA)'
            ? a.category.includes('Autismo')
            : selectedFilterCategory === 'TDAH'
            ? a.category.includes('TDAH')
            : selectedFilterCategory === 'TLP y Regulación'
            ? a.category.includes('TLP')
            : a.category.includes(selectedFilterCategory)
        );

  const currentAdvice = filteredAdvice[adviceIndex % filteredAdvice.length] || COMPREHENSIVE_ADVICE[0];

  const handleRandomAdvice = () => {
    const pool = filteredAdvice.filter((a) => a.text !== currentAdvice.text);
    const finalPool = pool.length > 0 ? pool : filteredAdvice;
    const randomPick = finalPool[Math.floor(Math.random() * finalPool.length)];
    const targetIdx = filteredAdvice.findIndex((a) => a.text === randomPick.text);
    setAdviceIndex(targetIdx >= 0 ? targetIdx : Math.floor(Math.random() * filteredAdvice.length));
  };

  // MINI JUEGO: DADO DE LA VERDAD (Para resolver discusiones en pareja de forma cariñosa y al azar)
  const handleRollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    setDiceWinnerNotice(null);

    // Audio / vibración ligera si está disponible
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }

    // Animación de giro de 1.8 segundos
    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceRollResult(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 10) {
        clearInterval(interval);
        const finalNumber = Math.floor(Math.random() * 6) + 1;
        setDiceRollResult(finalNumber);
        setIsRollingDice(false);

        // Mensaje cariñoso de resolución de la verdad
        const shooterName = currentDisplayMe.name;
        const resolution = `🎲 ¡Salió el número ${finalNumber}! ${shooterName} obtuvo el número y gana ✨🏆`;
        setDiceWinnerNotice(resolution);

        // Notificar en el mini chat compartido para ambos
        try {
          sendMessage(`🎲 [Dado de la Verdad]: ¡Obtuve un ${finalNumber}! ${shooterName} gana la tirada 🏆`);
        } catch {}

        // Notificación push de navegador para ambos
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('🎲 Dado de la Verdad', {
              body: `¡Salió el número ${finalNumber}! ${shooterName} obtuvo el número y gana. ¡Decisión resuelta en paz!`,
              icon: '/icon.svg',
            });
          } catch {}
        }
      }
    }, 120);
  };

  return (
    <section className="w-full space-y-6">
      {/* Título de la sección con emoji animado de corazón y llave inglesa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-xl shadow-md select-none">
            <span className="inline-flex items-center gap-0.5">
              <span className="animate-pulse">❤️</span>
              <span className="inline-block animate-bounce">🔧</span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white font-heading tracking-tight">
                Apoyo Emocional & Salud Neurodivergente
              </h3>
              <span className="text-sm select-none" title="Reparación y trabajo interno">
                ❤️🔧
              </span>
            </div>
            <p className="text-xs text-white/60">
              Biblioteca completa con más de 100 consejos: recién casados, TEA, TDAH, TLP y mini juego para la paz
            </p>
          </div>
        </div>
      </div>

      {/* CHECK-IN EMOCIONAL */}
      <div className="glass-card p-5 sm:p-6 border-rose-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h4 className="text-base font-black text-white font-heading uppercase tracking-wide">
              ¿CÓMO ME SIENTO HOY?
            </h4>
            <p className="text-xs text-white/60">
              Sincronizado al instante con tu pareja en Estado Actual
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-2.5">
            <span className="text-2xl">{currentDisplayMe.feelingEmoji}</span>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">Estado Emocional</p>
              <p className="text-sm font-bold text-white">{currentDisplayMe.feeling}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {EMOTION_OPTIONS.map((emo) => {
            const isSelected = currentDisplayMe.feeling === emo.label;
            return (
              <button
                key={emo.label}
                type="button"
                onClick={() => updateMyFeeling(emo.label, emo.emoji)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-500/40 shadow-lg scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                }`}
              >
                <span className="text-2xl shrink-0">{emo.emoji}</span>
                <span className="text-xs font-bold text-white truncate">{emo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MINI JUEGO: DADO DE LA VERDAD (Para resolver desacuerdos con amor) */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-black/40 to-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-lg">
              🎲
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide font-heading">
                Dado de la Verdad 🎲
              </h4>
              <p className="text-xs text-white/60">
                Evita discusiones en pareja: el dado decide con amor y al azar
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-center">
            Mini Juego de Pareja
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* El Dado Físico Blanco de 6 Caras Realista con Pips Negros */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={
                isRollingDice
                  ? {
                      rotate: [0, 90, 180, 270, 360, 450, 540],
                      scale: [1, 1.2, 0.9, 1.15, 1],
                      y: [0, -20, 0, -15, 0],
                    }
                  : { rotate: 0, scale: 1, y: 0 }
              }
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-white via-slate-100 to-slate-200 border-4 border-slate-300 shadow-[0_15px_35px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center p-3 select-none cursor-pointer"
              onClick={handleRollDice}
              title="Toca para lanzar el dado"
            >
              {/* Representación fiel de las 6 caras con puntos negros */}
              {diceRollResult === null || isRollingDice ? (
                <span className="text-4xl">🎲</span>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                  {/* Cara 1 */}
                  {diceRollResult === 1 && (
                    <div className="w-5 h-5 rounded-full bg-red-600 shadow-inner" />
                  )}
                  {/* Cara 2 */}
                  {diceRollResult === 2 && (
                    <div className="w-full h-full flex justify-between">
                      <div className="w-4 h-4 rounded-full bg-slate-900 self-start shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 self-end shadow-inner" />
                    </div>
                  )}
                  {/* Cara 3 */}
                  {diceRollResult === 3 && (
                    <div className="w-full h-full flex justify-between">
                      <div className="w-4 h-4 rounded-full bg-slate-900 self-start shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 self-center shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 self-end shadow-inner" />
                    </div>
                  )}
                  {/* Cara 4 */}
                  {diceRollResult === 4 && (
                    <div className="w-full h-full grid grid-cols-2 gap-4 place-items-center">
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                    </div>
                  )}
                  {/* Cara 5 */}
                  {diceRollResult === 5 && (
                    <div className="w-full h-full relative">
                      <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                    </div>
                  )}
                  {/* Cara 6 */}
                  {diceRollResult === 6 && (
                    <div className="w-full h-full grid grid-cols-2 gap-2 place-items-center">
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                      <div className="w-4 h-4 rounded-full bg-slate-900 shadow-inner" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            <span className="text-[11px] font-bold text-amber-300">
              {isRollingDice
                ? 'Girando el dado...'
                : diceRollResult
                ? `Resultado: ${diceRollResult}`
                : 'Toca el dado o el botón'}
            </span>
          </div>

          {/* Explicación y botón para tirar */}
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <p className="text-xs text-white/80 leading-relaxed">
              ¿No se ponen de acuerdo en qué cenar, qué película ver o quién elige el próximo plan?{' '}
              <strong>Tiren el Dado de la Verdad</strong>. Quien obtenga el número más alto gana pacíficamente.
            </p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                disabled={isRollingDice}
                onClick={handleRollDice}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <Dices className="w-4 h-4 animate-spin" />
                <span>{isRollingDice ? 'Tirando el Dado...' : 'Lanzar Dado de la Verdad 🎲'}</span>
              </button>
            </div>

            {/* Aviso de resultado visible para ambos */}
            {diceWinnerNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-amber-500/25 border border-amber-400/50 text-xs font-bold text-amber-100 flex items-center gap-2 shadow-inner"
              >
                <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{diceWinnerNotice}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BIBLIOTECA COMPLETA DE MÁS DE 100 CONSEJOS (20+ POR CADA APARTADO) */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 border-purple-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h4 className="text-base font-black text-white font-heading uppercase tracking-wide flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span>Biblioteca de Apoyo ({COMPREHENSIVE_ADVICE.length} Consejos)</span>
            </h4>
            <p className="text-xs text-white/60">
              Más de 20 consejos prácticos en cada una de las 5 categorías esenciales
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-purple-200 font-bold px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
              {filteredAdvice.length} consejos en esta sección
            </span>
          </div>
        </div>

        {/* Selector de Categorías (Pestañas) */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {ADVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedFilterCategory(cat);
                setAdviceIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilterCategory === cat
                  ? 'bg-purple-600 text-white shadow-md scale-102 font-black'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tarjeta de Consejo Actual con cambio dinámico */}
        <motion.div
          key={currentAdvice.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-3xl bg-purple-950/40 border border-purple-500/30 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentAdvice.category}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 rounded-full text-[11px] text-purple-200">
                {currentAdvice.tag}
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                {((adviceIndex % filteredAdvice.length) + 1)}/{filteredAdvice.length}
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-white/95 leading-relaxed font-semibold">
            "{currentAdvice.text}"
          </p>

          {currentAdvice.actionTip && (
            <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-400/25 flex items-start gap-2.5 text-xs text-purple-100">
              <span className="text-base shrink-0">💡</span>
              <div>
                <span className="font-black text-amber-200 block text-[11px] uppercase tracking-wider">
                  Paso Práctico para los Dos:
                </span>
                <span>{currentAdvice.actionTip}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/50">
            <span className="flex items-center gap-1 text-purple-300 font-bold">
              <span>👆 Toca el botón abajo para explorar otro consejo de la colección</span>
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-lg text-white/70">
              Al Azar 🎲
            </span>
          </div>
        </motion.div>

        {/* Botón único para cambiar tarjeta al azar */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleRandomAdvice}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 border border-white/20 cursor-pointer transition-all shadow-xl"
          >
            <Dices className="w-4 h-4 text-purple-200 animate-spin" />
            <span>Cambiar Tarjeta al Azar 🎲</span>
          </button>
        </div>
      </div>
    </section>
  );
};
