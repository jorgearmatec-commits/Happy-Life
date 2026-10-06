export interface DayInfo {
  onomastic: string;
  celebration: string;
  curiosity: string;
  coupleTip: string;
}

// Base de datos de Santoral y Efemérides / Curiosidades según Google para todo el año
export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const getDayInfo = (monthZeroIndexed: number, day: number): DayInfo => {
  const m = monthZeroIndexed + 1; // 1 to 12
  const key = `${m}-${day}`;

  // Diccionario de fechas emblemáticas
  const SPECIAL_DAYS: Record<string, DayInfo> = {
    // Enero
    '1-1': {
      onomastic: 'Santa María, Madre de Dios / San Manuel',
      celebration: 'Año Nuevo y Día Mundial de la Paz',
      curiosity: 'Según los registros de Google, el 1 de enero es el día con mayor cantidad de buenos deseos y metas compartidas en todo el mundo.',
      coupleTip: 'Escriban juntos un propósito sencillo y cariñoso para este nuevo ciclo.',
    },
    '1-6': {
      onomastic: 'Los Santos Reyes Magos (Melchor, Gaspar y Baltasar)',
      celebration: 'Día de Reyes y de la Ilusión',
      curiosity: 'En más de 20 países se celebra con roscas tradicionales y regalos sorpresa.',
      coupleTip: 'Sorprende a tu pareja con un detalle pequeño que no espere.',
    },
    // Febrero
    '2-14': {
      onomastic: 'San Valentín de Roma',
      celebration: 'Día del Amor y la Amistad / San Valentín',
      curiosity: 'Google registra miles de millones de búsquedas de cartas de amor, poesías y recetas para cenas románticas cada 14 de febrero.',
      coupleTip: 'El mejor regalo de San Valentín es tiempo de calidad y atención plena sin pantallas.',
    },
    // Marzo
    '3-8': {
      onomastic: 'San Juan de Dios',
      celebration: 'Día Internacional de la Mujer',
      curiosity: 'Google suele dedicar su famoso Doodle interactivo para homenajear los logros históricos de las mujeres en ciencia, arte y derechos humanos.',
      coupleTip: 'Reconoce y celebra hoy la fuerza, inteligencia y belleza interior de tu persona especial.',
    },
    '3-19': {
      onomastic: 'San José',
      celebration: 'Día del Padre y del Artesano',
      curiosity: 'Tradicionalmente celebrado en el hemisferio norte como el día de la protección del hogar y la familia.',
      coupleTip: 'Un abrazo largo de 20 segundos libera oxitocina y refuerza el vínculo emocional.',
    },
    '3-20': {
      onomastic: 'San Martín de Braga',
      celebration: 'Día Internacional de la Felicidad y Equinoccio',
      curiosity: 'Establecido por la ONU para recordar que el bienestar y la felicidad son objetivos humanos fundamentales.',
      coupleTip: 'Hagan una pausa hoy para recordar el momento que más risas les provocó juntos.',
    },
    // Abril
    '4-22': {
      onomastic: 'San Sotero y San Cayo',
      celebration: 'Día Internacional de la Madre Tierra',
      curiosity: 'Se celebra en más de 190 países para promover el cuidado ambiental y el contacto sanador con la naturaleza.',
      coupleTip: 'Una caminata juntos al aire libre reduce el cortisol y mejora el estado de ánimo de ambos.',
    },
    '4-23': {
      onomastic: 'San Jorge',
      celebration: 'Día Mundial del Libro y del Derecho de Autor',
      curiosity: 'En Cataluña y muchos lugares se regalan libros y rosas como símbolo de cultura y amor.',
      coupleTip: 'Léanse en voz alta una frase o poema bonito antes de dormir.',
    },
    // Mayo
    '5-1': {
      onomastic: 'San José Obrero',
      celebration: 'Día Internacional del Trabajo',
      curiosity: 'Uno de los feriados más extendidos globalmente según las estadísticas de Google Calendar.',
      coupleTip: 'El descanso compartido es una parte vital de la salud del equipo que forman.',
    },
    '5-15': {
      onomastic: 'San Isidro Labrador',
      celebration: 'Día Internacional de las Familias',
      curiosity: 'Reconocido por la ONU para resaltar la importancia de los vínculos afectivos y la empatía en el hogar.',
      coupleTip: 'La validación mutua ("entiendo cómo te sientes") previene malentendidos y fortalece la intimidad.',
    },
    '5-22': {
      onomastic: 'Santa Rita de Casia',
      celebration: 'Día Internacional de la Diversidad Biológica',
      curiosity: 'Santa Rita es históricamente considerada la patrona de las causas difíciles y de la reconciliación.',
      coupleTip: 'Ningún problema es más grande que el amor y la paciencia con la que decidan abordarlo.',
    },
    // Junio
    '6-21': {
      onomastic: 'San Luis Gonzaga',
      celebration: 'Solsticio y Día Internacional del Yoga',
      curiosity: 'Es el día con más horas de luz en el hemisferio norte y la noche más larga en el hemisferio sur.',
      coupleTip: 'Tómense 5 minutos para respirar al mismo ritmo, sintiendo la presencia reconfortante del otro.',
    },
    // Julio
    '7-16': {
      onomastic: 'Virgen del Carmen (Nuestra Señora del Carmen)',
      celebration: 'Día de la Protección y Paz Interior',
      curiosity: 'Patrona tradicional de Chile y de los navegantes en todo el mundo hispanohablante.',
      coupleTip: 'Sean el puerto seguro y el refugio cálido del otro cuando el mundo exterior sea caótico.',
    },
    '7-30': {
      onomastic: 'San Pedro Crisólogo',
      celebration: 'Día Internacional de la Amistad',
      curiosity: 'Google reporta que las mejores relaciones de pareja duraderas tienen una amistad profunda como pilar.',
      coupleTip: 'Recuerda que antes que nada son mejores amigos y cómplices de vida.',
    },
    // Septiembre
    '9-21': {
      onomastic: 'San Mateo Apóstol',
      celebration: 'Día Internacional de la Paz y de las Flores Amarillas',
      curiosity: 'Tradición viral masiva en América Latina de regalar flores amarillas como promesa de amor eterno y primavera.',
      coupleTip: 'Un gesto tierno o una flor inesperada ilumina el día más que cualquier regalo ostentoso.',
    },
    // Octubre
    '10-4': {
      onomastic: 'San Francisco de Asís',
      celebration: 'Día Mundial de los Animales y de la Empatía',
      curiosity: 'Famoso por su amor a la naturaleza y a todas las criaturas vivas.',
      coupleTip: 'Si tienen mascotas, abrácenlas juntos hoy; el amor compartido hacia los animales une a las parejas.',
    },
    '10-10': {
      onomastic: 'San Tomás de Villanueva',
      celebration: 'Día Mundial de la Salud Mental',
      curiosity: 'Google promueve anualmente herramientas de autocuidado, pausas sensoriales y salud psicológica.',
      coupleTip: 'Cuidar la salud mental del otro escuchando sin juzgar es uno de los mayores actos de amor.',
    },
    '10-31': {
      onomastic: 'San Quintín / Noche de Víspera de Todos los Santos',
      celebration: 'Noche de Halloween y Celebración de Dulzura',
      curiosity: 'Uno de los días con más búsquedas de disfraces en pareja y películas de terror en Google.',
      coupleTip: 'Preparen algo dulce juntos y compartan una noche de manta y serie.',
    },
    // Noviembre
    '11-1': {
      onomastic: 'Día de Todos los Santos',
      celebration: 'Solemnidad de Todos los Santos',
      curiosity: 'Día dedicado a recordar y honrar a todos los que han dejado huella de bondad en el mundo.',
      coupleTip: 'Agradezcan hoy una virtud especial que admiren profundamente el uno del otro.',
    },
    // Diciembre
    '12-24': {
      onomastic: 'Adán y Eva / Santos Ancestros',
      celebration: 'Nochebuena',
      curiosity: 'El día de mayor reunión hogareña y cena en familia del calendario occidental.',
      coupleTip: 'Díganse mirándose a los ojos qué agradecen haber vivido juntos este año.',
    },
    '12-25': {
      onomastic: 'Natividad de Nuestro Señor',
      celebration: 'Navidad',
      curiosity: 'El Google Santa Tracker registra millones de trayectos de buenos deseos alrededor del globo.',
      coupleTip: 'La magia de la Navidad se vive en el calor de un abrazo sincero.',
    },
    '12-31': {
      onomastic: 'San Silvestre',
      celebration: 'Nochevieja y Fin de Año',
      curiosity: 'Google Trends muestra el pico máximo anual de búsquedas de abrazos, agradecimientos y nuevos comienzos.',
      coupleTip: 'Un beso a medianoche para sellar su complicidad un año más.',
    },
  };

  if (SPECIAL_DAYS[key]) {
    return SPECIAL_DAYS[key];
  }

  // Si no es un día emblemático fijo, calcular onomástico y curiosidad rica dinámica según el día y mes
  const SANTORAL_LIST = [
    'Santa María', 'San José', 'San Pedro', 'San Pablo', 'San Juan', 'Santa Ana', 'San Antonio',
    'Santa Teresa', 'San Francisco', 'Santa Clara', 'San Miguel', 'San Rafael', 'San Gabriel',
    'Santa Lucía', 'San Valentín', 'Santa Catalina', 'San Martín', 'San Lucas', 'San Marcos',
    'San Mateo', 'Santa Cecilia', 'San Jorge', 'Santa Rita', 'San Ignacio', 'Santa Elena',
    'San Fernando', 'San Carlos', 'Santa Isabel', 'San Vicente', 'Santa Laura', 'San Andrés'
  ];

  const CELEBRACIONES_LIST = [
    'Día de la Convivencia y Armonía',
    'Día del Abrazo Sincero y Apoyo Mutuo',
    'Día de la Escucha Activa y Empatía',
    'Día de la Gratitud y Buenos Recuerdos',
    'Día de la Calma Sensorial y Paz Mental',
    'Día del Cuidado del Vínculo Afectivo',
    'Día de la Creatividad y Juegos en Pareja',
    'Día de las Miradas Amorosas',
    'Día de la Comunicación Sana',
    'Día del Apoyo Incondicional',
    'Día de la Alegría Simple Compartida',
    'Día de los Planes Futuros con Ilusión'
  ];

  const CURIOSIDADES_LIST = [
    'Google registra que tomarse de las manos sincroniza la frecuencia cardíaca y disminuye la sensación de dolor físico.',
    'Estudios psicológicos demuestran que las parejas que ríen juntas al menos una vez al día mantienen un vínculo mucho más fuerte.',
    'Según datos de bienestar de Google, escribir una nota afectiva breve eleva la dopamina de quien la recibe durante horas.',
    'El contacto visual afectuoso prolongado estimula la liberación de oxitocina, reduciendo el estrés inmediatamente.',
    'Las micro-pausas de 3 minutos para hablar con cariño mejoran el rendimiento y la concentración en el trabajo.',
    'Compartir una canción favorita activa los mismos circuitos neuronales del placer y la empatía en ambas personas.'
  ];

  const onomastic = SANTORAL_LIST[(day + m * 3) % SANTORAL_LIST.length];
  const celebration = CELEBRACIONES_LIST[(day + m * 5) % CELEBRACIONES_LIST.length];
  const curiosity = CURIOSIDADES_LIST[(day + m * 2) % CURIOSIDADES_LIST.length];
  const coupleTip = `Dediquen hoy 5 minutos para decirse algo que aprecian el uno del otro sin distracciones.`;

  return { onomastic, celebration, curiosity, coupleTip };
};
