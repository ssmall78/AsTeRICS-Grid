/**
 * Dime practice module — seed content (Fase 0/1).
 * Source: content/practica-es.md in the dime-app repo; grounded in
 * requirements/EARS.md PRX-1..13 and research findings R4/R6/R8/R13/R15.
 *
 * PERSONALIZE: replace items marked personalize:true with her own words,
 * names and dishes — personally relevant vocabulary is the proven model (R4).
 */

let practiceData = {};

practiceData.LEVELS = [
    {
        id: 'silabas',
        label: 'Sílabas',
        emoji: '👄',
        description: 'Sonidos y sílabas — despacio y juntos'
    },
    {
        id: 'palabras',
        label: 'Palabras',
        emoji: '🗣️',
        description: 'Palabras de su vida diaria'
    },
    {
        id: 'frases',
        label: 'Frases',
        emoji: '💬',
        description: 'Frases cortas y útiles'
    },
    {
        id: 'guiones',
        label: 'Guiones',
        emoji: '📞',
        description: 'Mini-conversaciones reales'
    }
];

/**
 * item fields:
 *  id           unique, stable (used for progress storage)
 *  level        level id
 *  text         what she is trying to say (displayed big, spoken slow)
 *  pic          emoji placeholder (Phase 2+: MultiPic/ARASAAC image or photo)
 *  syllables    array used for the first-syllable cue (cue level 1)
 *  cues         up to 3 SFA prompts, simplest first (cue level 0 extras)
 *  personalize  true = placeholder the family should replace
 */
practiceData.ITEMS = [
    // ---- Nivel 1: sílabas (pairs that are or become words) ----
    { id: 'sil-ma', level: 'silabas', text: 'ma', pic: '👄', syllables: ['ma'], cues: [] },
    { id: 'sil-pa', level: 'silabas', text: 'pa', pic: '👄', syllables: ['pa'], cues: [] },
    { id: 'sil-ta', level: 'silabas', text: 'ta', pic: '👄', syllables: ['ta'], cues: [] },
    { id: 'sil-la', level: 'silabas', text: 'la', pic: '👄', syllables: ['la'], cues: [] },
    { id: 'sil-sa', level: 'silabas', text: 'sa', pic: '👄', syllables: ['sa'], cues: [] },
    { id: 'sil-si', level: 'silabas', text: 'sí', pic: '👍', syllables: ['sí'], cues: [] },
    { id: 'sil-no', level: 'silabas', text: 'no', pic: '👎', syllables: ['no'], cues: [] },
    { id: 'sil-mama', level: 'silabas', text: 'mamá', pic: '👩', syllables: ['ma', 'má'], cues: [] },
    { id: 'sil-papa', level: 'silabas', text: 'papá', pic: '👨', syllables: ['pa', 'pá'], cues: [] },
    { id: 'sil-ya', level: 'silabas', text: 'ya', pic: '⏰', syllables: ['ya'], cues: [] },

    // ---- Nivel 2: palabras (15 starters w/ SFA cues; ~5 to personalize) ----
    { id: 'pal-agua', level: 'palabras', text: 'agua', pic: '💧', syllables: ['a', 'gua'],
        cues: ['es una bebida', 'se toma cuando hay sed', 'va en un vaso'] },
    { id: 'pal-pan', level: 'palabras', text: 'pan', pic: '🍞', syllables: ['pan'],
        cues: ['es comida', 'se come en el desayuno', 'va con café'] },
    { id: 'pal-cafe', level: 'palabras', text: 'café', pic: '☕', syllables: ['ca', 'fé'],
        cues: ['es una bebida', 'se toma caliente', 'por la mañana'] },
    { id: 'pal-sopa', level: 'palabras', text: 'sopa', pic: '🍲', syllables: ['so', 'pa'],
        cues: ['es comida', 'se come con cuchara', 'está caliente'], personalize: true },
    { id: 'pal-leche', level: 'palabras', text: 'leche', pic: '🥛', syllables: ['le', 'che'],
        cues: ['es una bebida', 'es blanca', 'viene de la vaca'] },
    { id: 'pal-casa', level: 'palabras', text: 'casa', pic: '🏠', syllables: ['ca', 'sa'],
        cues: ['es un lugar', 'vivimos adentro', 'tiene puertas'] },
    { id: 'pal-cama', level: 'palabras', text: 'cama', pic: '🛏️', syllables: ['ca', 'ma'],
        cues: ['es un mueble', 'sirve para dormir', 'está en el cuarto'] },
    { id: 'pal-bano', level: 'palabras', text: 'baño', pic: '🚻', syllables: ['ba', 'ño'],
        cues: ['es un lugar', 'nos lavamos ahí', 'tiene agua'] },
    { id: 'pal-mano', level: 'palabras', text: 'mano', pic: '✋', syllables: ['ma', 'no'],
        cues: ['es parte del cuerpo', 'agarra las cosas', 'tiene cinco dedos'] },
    { id: 'pal-boca', level: 'palabras', text: 'boca', pic: '👄', syllables: ['bo', 'ca'],
        cues: ['es parte del cuerpo', 'sirve para comer', 'también para hablar'] },
    { id: 'pal-sol', level: 'palabras', text: 'sol', pic: '☀️', syllables: ['sol'],
        cues: ['está en el cielo', 'da calor', 'sale de día'] },
    { id: 'pal-flor', level: 'palabras', text: 'flor', pic: '🌸', syllables: ['flor'],
        cues: ['es una planta', 'huele bonito', 'crece en el jardín'], personalize: true },
    { id: 'pal-perro', level: 'palabras', text: 'perro', pic: '🐕', syllables: ['pe', 'rro'],
        cues: ['es un animal', 'ladra', 'es amigo fiel'], personalize: true },
    { id: 'pal-mesa', level: 'palabras', text: 'mesa', pic: '🍽️', syllables: ['me', 'sa'],
        cues: ['es un mueble', 'comemos ahí', 'tiene cuatro patas'] },
    { id: 'pal-zapato', level: 'palabras', text: 'zapato', pic: '👟', syllables: ['za', 'pa', 'to'],
        cues: ['es ropa', 'va en el pie', 'se amarra'], personalize: true },

    // ---- Nivel 3: frases (built from Level-2 wins) ----
    { id: 'fra-quiero-agua', level: 'frases', text: 'quiero agua', pic: '💧', syllables: ['quie', 'ro'], cues: [] },
    { id: 'fra-mas-cafe', level: 'frases', text: 'más café', pic: '☕', syllables: ['más'], cues: [] },
    { id: 'fra-mi-casa', level: 'frases', text: 'mi casa', pic: '🏠', syllables: ['mi'], cues: [] },
    { id: 'fra-a-la-cama', level: 'frases', text: 'a la cama', pic: '🛏️', syllables: ['a'], cues: [] },
    { id: 'fra-me-duele', level: 'frases', text: 'me duele', pic: '🤕', syllables: ['me'], cues: [] },
    { id: 'fra-ya-voy', level: 'frases', text: 'ya voy', pic: '🚶', syllables: ['ya'], cues: [] },
    { id: 'fra-esta-bien', level: 'frases', text: 'está bien', pic: '👌', syllables: ['es', 'tá'], cues: [] },
    { id: 'fra-te-quiero', level: 'frases', text: 'te quiero', pic: '❤️', syllables: ['te'], cues: [] },
    { id: 'fra-buenos-dias', level: 'frases', text: 'buenos días', pic: '🌅', syllables: ['bue', 'nos'], cues: [] },
    { id: 'fra-gracias', level: 'frases', text: 'gracias', pic: '🙏', syllables: ['gra', 'cias'], cues: [] },

    // ---- Nivel 4: guiones (her lines; PERSONALIZE names + record real voices) ----
    { id: 'gui-tel-1', level: 'guiones', text: 'Hola, mija', pic: '📞', syllables: ['ho', 'la'],
        cues: ['suena el teléfono', 'contesta ella'], personalize: true },
    { id: 'gui-tel-2', level: 'guiones', text: 'Bien, bien', pic: '📞', syllables: ['bien'],
        cues: ['le preguntan: ¿cómo estás?'], personalize: true },
    { id: 'gui-cafe-1', level: 'guiones', text: 'Sí, quiero café', pic: '☕', syllables: ['sí'],
        cues: ['le preguntan: ¿quieres café?'], personalize: true },
    { id: 'gui-cafe-2', level: 'guiones', text: 'Con leche', pic: '🥛', syllables: ['con'],
        cues: ['le preguntan: ¿con leche?'], personalize: true },
    { id: 'gui-visita-1', level: 'guiones', text: '¡Pásale!', pic: '🚪', syllables: ['pá', 'sa'],
        cues: ['suena el timbre'], personalize: true },
    { id: 'gui-visita-2', level: 'guiones', text: 'Bien, gracias', pic: '🙂', syllables: ['bien'],
        cues: ['le preguntan: ¿cómo está?'], personalize: true }
];

practiceData.getItemsForLevel = function (levelId) {
    return practiceData.ITEMS.filter((i) => i.level === levelId);
};

export { practiceData };
