import { 
  University, 
  Career, 
  Subject, 
  StudyItemCard, 
  PendingRequest, 
  Tournament, 
  VisualTemplate, 
  User,
  Folder
} from '../types';

export const INITIAL_UNIVERSITIES: University[] = [
  { id: 'u1', name: 'Universidad Nacional Mayor de San Marcos', acronym: 'UNMSM', country: 'Perú' },
  { id: 'u2', name: 'Pontificia Universidad Católica del Perú', acronym: 'PUCP', country: 'Perú' },
  { id: 'u3', name: 'Tecnológico de Monterrey', acronym: 'ITESM', country: 'México' },
  { id: 'u4', name: 'Universidad Nacional Autónoma de México', acronym: 'UNAM', country: 'México' },
  { id: 'u5', name: 'Universidad de Buenos Aires', acronym: 'UBA', country: 'Argentina' },
  { id: 'u6', name: 'Universidad de los Andes', acronym: 'UniAndes', country: 'Colombia' },
  { id: 'u7', name: 'Universidad de Chile', acronym: 'UCH', country: 'Chile' },
];

export const INITIAL_CAREERS: Career[] = [
  { id: 'c1', name: 'Ingeniería de Sistemas y Software', universityId: 'u1' },
  { id: 'c2', name: 'Medicina Humana', universityId: 'u1' },
  { id: 'c3', name: 'Derecho y Ciencias Políticas', universityId: 'u2' },
  { id: 'c4', name: 'Ingeniería Informática', universityId: 'u2' },
  { id: 'c5', name: 'Ciencias de la Computación', universityId: 'u3' },
  { id: 'c6', name: 'Biotecnología Médica', universityId: 'u3' },
  { id: 'c7', name: 'Psicología Clínica', universityId: 'u4' },
  { id: 'c8', name: 'Economía y Finanzas', universityId: 'u5' },
];

export const INITIAL_SUBJECTS: Subject[] = [
  // Ingeniería de Sistemas - UNMSM (c1)
  { id: 's1', name: 'Cálculo Multivariable y Vectorial', careerId: 'c1', semester: 2 },
  { id: 's2', name: 'Estructuras de Datos y Algoritmos', careerId: 'c1', semester: 3 },
  { id: 's3', name: 'Arquitectura de Computadoras', careerId: 'c1', semester: 4 },
  { id: 's4', name: 'Bases de Datos Relacionales y NoSQL', careerId: 'c1', semester: 5 },
  { id: 's5', name: 'Sistemas Operativos Distribuidos', careerId: 'c1', semester: 6 },
  { id: 's6', name: 'Inteligencia Artificial y Machine Learning', careerId: 'c1', semester: 7 },
  { id: 's7', name: 'Ingeniería de Software Ágil', careerId: 'c1', semester: 8 },
  
  // Medicina Humana - UNMSM (c2)
  { id: 's8', name: 'Anatomía Humana y Disección', careerId: 'c2', semester: 2 },
  { id: 's9', name: 'Fisiología Celular y Sistémica', careerId: 'c2', semester: 3 },
  { id: 's10', name: 'Farmacología Médica y Terapéutica', careerId: 'c2', semester: 4 },
  { id: 's11', name: 'Patología General y Diagnóstica', careerId: 'c2', semester: 5 },
  
  // Derecho - PUCP (c3)
  { id: 's12', name: 'Derecho Constitucional Comparado', careerId: 'c3', semester: 2 },
  { id: 's13', name: 'Derecho Civil: Obligaciones y Contratos', careerId: 'c3', semester: 3 },
  { id: 's14', name: 'Derecho Penal y Teoría del Delito', careerId: 'c3', semester: 4 },

  // Computación ITESM (c5)
  { id: 's15', name: 'Desarrollo Web Fullstack y Cloud', careerId: 'c5', semester: 4 },
  { id: 's16', name: 'Ciberseguridad y Criptografía', careerId: 'c5', semester: 6 },
];

export const INITIAL_USER: User = {
  id: 'usr_me',
  fullName: 'Mateo Valenzuela',
  username: 'mateo_val',
  email: 'mateo.valenzuela@unmsm.edu.pe',
  avatarUrl: '', // empty defaults to WhatsApp gray silhouette
  bannerType: 'gradient',
  bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
  university: 'Universidad Nacional Mayor de San Marcos',
  career: 'Ingeniería de Sistemas y Software',
  currentSemester: 4,
  enrolledSubjects: [
    'Estructuras de Datos y Algoritmos',
    'Arquitectura de Computadoras',
    'Cálculo Multivariable y Vectorial'
  ],
  isIncognito: false,
  bio: 'Estudiante de 4to ciclo apasionado por algoritmos, grafos y microaprendizaje interactivo. Creador de ráfagas para exámenes parciales.',
  rpPoints: 1420,
  streakDays: 12,
  role: 'user',
  createdAt: '2026-03-01',
};

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Exámenes Parciales 2026', color: '#6366f1' },
  { id: 'f2', name: 'Algoritmos & Grafos', color: '#10b981' },
  { id: 'f3', name: 'Cálculo y Fórmulas Clave', color: '#f59e0b' },
  { id: 'f4', name: 'Memorización Rápida', color: '#ec4899' },
];

export const VISUAL_TEMPLATES: VisualTemplate[] = [
  { id: 'vt1', name: 'Deep Indigo Nebula', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' },
  { id: 'vt2', name: 'Cyber Emerald', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)' },
  { id: 'vt3', name: 'Solar Amber Flare', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #d97706 100%)' },
  { id: 'vt4', name: 'Crimson Velocity', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #dc2626 100%)' },
  { id: 'vt5', name: 'Violet Quantum', category: 'gradient', type: 'gradient', value: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%)' },
  { id: 'vt6', name: 'Midnight Slate', category: 'minimal', type: 'gradient', value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)' },
  { id: 'vt7', name: 'Algoritmos Abstractos', category: 'tech', type: 'image', value: 'https://images.unsplash.com/photo-1516116211227-bbc13c74410c?auto=format&fit=crop&w=1200&q=80' },
  { id: 'vt8', name: 'Neurociencia & Circuitos', category: 'academic', type: 'image', value: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80' },
  { id: 'vt9', name: 'Matemáticas Puras', category: 'academic', type: 'image', value: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80' },
];

export const INITIAL_CARDS: StudyItemCard[] = [
  {
    id: 'card-1',
    title: 'Árboles Binarios, AVL y Grafos Dirigidos',
    description: 'Cuaderno completo interactivo con flashcards 3D, diagramas de rotaciones y ejercicios de secuencia de inserción.',
    contentType: 'material',
    accessCode: 'ARBL-42',
    authorId: 'usr_me',
    authorUsername: 'mateo_val',
    authorUniversity: 'UNMSM',
    authorAvatar: '',
    subjectName: 'Estructuras de Datos y Algoritmos',
    universityName: 'Universidad Nacional Mayor de San Marcos',
    semester: 3,
    coverType: 'gradient',
    coverValue: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)',
    rating: 4.9,
    ratingsCount: 88,
    activePlayers: 42,
    isFavorite: true,
    folderId: 'f2',
    createdAt: '2026-03-10',
    blocks: [
      {
        id: 'b1',
        type: 'content_card',
        title: 'Definición Formal de Árbol Balanceado (AVL)',
        body: 'Un árbol AVL es un árbol binario de búsqueda auto-balanceable donde para cada nodo, la diferencia de alturas entre el subárbol izquierdo y derecho (Factor de Equilibrio) nunca excede ±1.',
        calloutType: 'key_concept'
      },
      {
        id: 'b2',
        type: 'flashcard',
        question: '¿Cuál es la complejidad temporal en el peor caso para buscar un elemento en un árbol AVL de n nodos?',
        answer: 'O(log n). Gracias a que el factor de balance garantiza que la altura máxima sea aproximadamente 1.44 log2(n).',
        userMastery: 'easy'
      },
      {
        id: 'b3',
        type: 'flashcard',
        question: '¿Qué rotación simple se aplica cuando un desbalance ocurre en la rama izquierda del hijo izquierdo (Caso LL)?',
        answer: 'Rotación Simple a la Derecha (Right Rotation). El hijo izquierdo pasa a ser la nueva raíz del subárbol.',
        userMastery: 'medium'
      },
      {
        id: 'b4',
        type: 'connect',
        prompt: 'Relaciona cada algoritmo de recorrido de grafos con su propiedad característica:',
        pairs: [
          { id: 'p1', left: 'BFS (Breadth First Search)', right: 'Utiliza una Cola (Queue) y encuentra el camino más corto en grafos sin pesos.' },
          { id: 'p2', left: 'DFS (Depth First Search)', right: 'Utiliza una Pila (Stack) o recursión; ideal para detección de ciclos.' },
          { id: 'p3', left: 'Dijkstra', right: 'Utiliza una Cola de Prioridad para distancias mínimas con pesos no negativos.' },
          { id: 'p4', left: 'Kruskal', right: 'Algoritmo Greedy que une aristas de menor peso para el Árbol de Expansión Mínima.' }
        ]
      },
      {
        id: 'b5',
        type: 'sequence',
        prompt: 'Ordena cronológicamente los pasos para insertar y balancear un nodo en un Árbol AVL:',
        items: [
          { id: 'sq1', text: 'Realizar la inserción estándar como en un Árbol Binario de Búsqueda (BST).', correctOrder: 1 },
          { id: 'sq2', text: 'Retroceder recursivamente actualizando las alturas de los nodos ancestros.', correctOrder: 2 },
          { id: 'sq3', text: 'Calcular el Factor de Equilibrio (FE = altura_izq - altura_der) en cada ancestro.', correctOrder: 3 },
          { id: 'sq4', text: 'Si |FE| > 1, determinar el caso (LL, RR, LR, RL) y ejecutar la rotación correspondiente.', correctOrder: 4 }
        ]
      }
    ]
  },
  {
    id: 'card-2',
    title: 'Ráfaga Relámpago: Complejidades Big-O y Algoritmos',
    description: 'Desafío contra el reloj para dominar complejidades asintóticas y clasificaciones rápidas en menos de 30 segundos.',
    contentType: 'game',
    accessCode: 'BIGO-99',
    authorId: 'usr_2',
    authorUsername: 'sofia_code',
    authorUniversity: 'PUCP',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    subjectName: 'Estructuras de Datos y Algoritmos',
    universityName: 'Pontificia Universidad Católica del Perú',
    semester: 3,
    coverType: 'gradient',
    coverValue: 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #9333ea 100%)',
    rating: 5.0,
    ratingsCount: 140,
    activePlayers: 67,
    isFavorite: true,
    folderId: 'f1',
    createdAt: '2026-03-12',
    blocks: [
      {
        id: 'g1',
        type: 'content_card',
        title: 'Reglas de la Ráfaga',
        body: 'Responde cada reto velozmente. Si respondes en menos de 3 segundos, acumulas Bono de Velocidad (+50 RP).',
        calloutType: 'info'
      },
      {
        id: 'g2',
        type: 'true_false_rush',
        statements: [
          { id: 'tf1', statement: 'El acceso a un elemento por índice en un Array contiguo tiene complejidad O(1).', isTrue: true, explanation: 'Correcto. La dirección en memoria se calcula instantáneamente con base + índice * tamaño.' },
          { id: 'tf2', statement: 'El peor caso del algoritmo Quicksort sin pivote aleatorio es O(n log n).', isTrue: false, explanation: 'Falso. En el peor caso (arreglo ya ordenado con mal pivote) se degrada a O(n²).' },
          { id: 'tf3', statement: 'Merge Sort es un algoritmo de ordenamiento estable con complejidad O(n log n) garantizada.', isTrue: true, explanation: 'Verdadero. Divide y conquista garantizando n log n en todos los casos.' },
          { id: 'tf4', statement: 'La búsqueda binaria requiere que la colección de elementos esté previamente ordenada.', isTrue: true, explanation: 'Verdadero. Sin orden no se puede descartar la mitad del espacio de búsqueda.' }
        ]
      },
      {
        id: 'g3',
        type: 'fill_blank',
        sentence: 'La estructura de datos que sigue el principio LIFO (Last In, First Out) se denomina [Pila] o Stack.',
        mode: 'free_text',
        options: [],
        correctAnswer: 'pila',
        explanation: 'Las pilas (stacks) permiten apilar (push) y desapilar (pop) el último elemento ingresado.'
      },
      {
        id: 'g4',
        type: 'fill_blank',
        sentence: '¿Cuál es la complejidad temporal de buscar un elemento en una Tabla Hash ideal sin colisiones?',
        mode: 'multiple_choice',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 'O(1)',
        explanation: 'En promedio y sin colisiones, la función hash accede al bucket en tiempo constante O(1).'
      },
      {
        id: 'g5',
        type: 'swipe_classify',
        prompt: 'Clasifica los siguientes algoritmos según su paradigma principal de diseño:',
        categories: ['Divide y Conquista', 'Algoritmo Voraz (Greedy)'],
        items: [
          { id: 'sc1', text: 'Merge Sort', category: 'Divide y Conquista' },
          { id: 'sc2', text: 'Algoritmo de Prim', category: 'Algoritmo Voraz (Greedy)' },
          { id: 'sc3', text: 'Búsqueda Binaria', category: 'Divide y Conquista' },
          { id: 'sc4', text: 'Codificación de Huffman', category: 'Algoritmo Voraz (Greedy)' }
        ]
      },
      {
        id: 'g6',
        type: 'slider_estimator',
        prompt: '¿Cuántas comparaciones exactas realiza una Búsqueda Binaria en el peor caso sobre un arreglo de 1,024 elementos?',
        min: 1,
        max: 30,
        unit: 'comparaciones',
        correctValue: 10,
        tolerance: 1,
        explanation: 'log2(1024) = 10 comparaciones como máximo.'
      }
    ]
  },
  {
    id: 'card-3',
    title: 'Cálculo Vectorial: Gradiente, Rotacional y Divergencia',
    description: 'Aprende y pon a prueba los teoremas de Green, Stokes y Gauss con ejercicios interactivos y detección de errores.',
    contentType: 'material',
    accessCode: 'CALC-92',
    authorId: 'usr_3',
    authorUsername: 'carlos_math',
    authorUniversity: 'UNAM',
    authorAvatar: '',
    subjectName: 'Cálculo Multivariable y Vectorial',
    universityName: 'Universidad Nacional Autónoma de México',
    semester: 2,
    coverType: 'gradient',
    coverValue: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #d97706 100%)',
    rating: 4.8,
    ratingsCount: 95,
    activePlayers: 29,
    isFavorite: false,
    folderId: 'f3',
    createdAt: '2026-03-05',
    blocks: [
      {
        id: 'c_b1',
        type: 'content_card',
        title: 'Operador Nabla (∇)',
        body: 'El operador diferencial vectorial ∇ actúa sobre campos escalares produciendo el gradiente (vector de derivadas parciales) y sobre campos vectoriales mediante el producto punto (divergencia) o producto cruz (rotacional).',
        calloutType: 'formula'
      },
      {
        id: 'c_b2',
        type: 'flashcard',
        question: '¿Qué significa geométricamente que el rotacional de un campo vectorial sea idénticamente cero (∇ × F = 0)?',
        answer: 'Significa que el campo es irrotacional o conservativo, por lo que existe una función potencial f tal que F = ∇f.',
        userMastery: 'medium'
      },
      {
        id: 'c_b3',
        type: 'error_detect',
        instruction: 'Toca sobre la zona del diagrama donde se encuentra la anomalía de flujo vectorial (divergencia negativa / sumidero):',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        targetZone: {
          xPercent: 50,
          yPercent: 50,
          radiusPercent: 20
        },
        explanation: 'En el centro geométrico las flechas convergen hacia un punto único de succión (sumidero con ∇·F < 0).'
      },
      {
        id: 'c_b4',
        type: 'slider_estimator',
        prompt: 'Calcula el valor aproximado del flujo neto de un campo uniforme a través de una superficie cerrada esférica:',
        min: -10,
        max: 10,
        unit: 'unidades de flujo',
        correctValue: 0,
        tolerance: 0.5,
        explanation: 'Por el Teorema de Gauss de la divergencia, si no hay fuentes ni sumideros internos, el flujo neto es exactamente 0.'
      }
    ]
  },
  {
    id: 'card-4',
    title: 'Duelo Anatómico: Huesos del Cráneo y Pares Craneales',
    description: 'Batalla multijugador y práctica rápida con diagramas hotspot y reconocimiento de nervios craneales.',
    contentType: 'game',
    accessCode: 'ANAT-04',
    authorId: 'usr_4',
    authorUsername: 'dra_elena',
    authorUniversity: 'UNMSM',
    authorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    subjectName: 'Anatomía Humana y Disección',
    universityName: 'Universidad Nacional Mayor de San Marcos',
    semester: 2,
    coverType: 'image',
    coverValue: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    ratingsCount: 162,
    activePlayers: 54,
    isFavorite: false,
    folderId: 'f4',
    createdAt: '2026-03-08',
    blocks: [
      {
        id: 'a1',
        type: 'content_card',
        title: 'Mnemotecnia de Pares Craneales',
        body: 'I Olfatorio, II Óptico, III Oculomotor, IV Troclear, V Trigémino, VI Abducens, VII Facial, VIII Vestibulococlear, IX Glosofaríngeo, X Vago, XI Accesorio, XII Hipogloso.',
        calloutType: 'info'
      },
      {
        id: 'a2',
        type: 'hotspot',
        instruction: 'Toca los puntos anatómicos en orden secuencial estricto (1. Frontal, 2. Parietal, 3. Occipital):',
        isSequential: true,
        imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
        hotspots: [
          { id: 'h1', label: 'Hueso Frontal', xPercent: 28, yPercent: 32, stepOrder: 1 },
          { id: 'h2', label: 'Hueso Parietal', xPercent: 55, yPercent: 24, stepOrder: 2 },
          { id: 'h3', label: 'Hueso Occipital', xPercent: 78, yPercent: 55, stepOrder: 3 }
        ],
        explanation: 'Identificación correcta de la bóveda craneal en secuencia anteroposterior.'
      },
      {
        id: 'a3',
        type: 'swipe_classify',
        prompt: 'Clasifica los siguientes pares craneales según su función principal:',
        categories: ['Sensitivo Puro', 'Motor Puro', 'Mixto'],
        items: [
          { id: 'p_sc1', text: 'Par I: Nervio Olfatorio', category: 'Sensitivo Puro' },
          { id: 'p_sc2', text: 'Par IV: Nervio Troclear', category: 'Motor Puro' },
          { id: 'p_sc3', text: 'Par VII: Nervio Facial', category: 'Mixto' },
          { id: 'p_sc4', text: 'Par VIII: Vestibulococlear', category: 'Sensitivo Puro' },
          { id: 'p_sc5', text: 'Par XII: Hipogloso', category: 'Motor Puro' },
          { id: 'p_sc6', text: 'Par X: Nervio Vago', category: 'Mixto' }
        ]
      },
      {
        id: 'a4',
        type: 'true_false_rush',
        statements: [
          { id: 'atf1', statement: 'El nervio trigémino (V) es el principal responsable de la sensibilidad sensitiva de la cara.', isTrue: true, explanation: 'Verdadero. Sus tres ramas (oftálmica, maxilar, mandibular) inervan toda la cara sensitivamente.' },
          { id: 'atf2', statement: 'El hueso vómer es un hueso par de la base del cráneo.', isTrue: false, explanation: 'Falso. El vómer es un hueso único e impar del tabique nasal.' }
        ]
      }
    ]
  },
  {
    id: 'card-5',
    title: 'Arquitectura RISC-V y Pipeline de Instrucciones',
    description: 'Etapas de ejecución, riesgos de datos (hazards) y cálculo de ciclos por instrucción (CPI).',
    contentType: 'material',
    accessCode: 'RISC-55',
    authorId: 'usr_me',
    authorUsername: 'mateo_val',
    authorUniversity: 'UNMSM',
    authorAvatar: '',
    subjectName: 'Arquitectura de Computadoras',
    universityName: 'Universidad Nacional Mayor de San Marcos',
    semester: 4,
    coverType: 'gradient',
    coverValue: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    rating: 4.7,
    ratingsCount: 38,
    activePlayers: 19,
    isFavorite: false,
    folderId: 'f1',
    createdAt: '2026-03-14',
    blocks: [
      {
        id: 'r1',
        type: 'sequence',
        prompt: 'Ordena secuencialmente las 5 etapas clásicas del procesador con Pipeline:',
        items: [
          { id: 'pip1', text: 'IF: Instruction Fetch (Búsqueda de la instrucción)', correctOrder: 1 },
          { id: 'pip2', text: 'ID: Instruction Decode & Register Read (Decodificación)', correctOrder: 2 },
          { id: 'pip3', text: 'EX: Execute & Address Calculation (Ejecución en ALU)', correctOrder: 3 },
          { id: 'pip4', text: 'MEM: Memory Access (Lectura/Escritura en memoria RAM)', correctOrder: 4 },
          { id: 'pip5', text: 'WB: Write Back (Escritura de resultado en registro)', correctOrder: 5 }
        ]
      }
    ]
  },
  {
    id: 'card-6',
    title: 'Duelo Constitucional: Garantías y Derechos Fundamentales',
    description: 'Habeas Corpus, Acción de Amparo y Control Difuso en el marco del Estado de Derecho.',
    contentType: 'game',
    accessCode: 'DCON-11',
    authorId: 'usr_5',
    authorUsername: 'lucia_juris',
    authorUniversity: 'PUCP',
    authorAvatar: '',
    subjectName: 'Derecho Constitucional Comparado',
    universityName: 'Pontificia Universidad Católica del Perú',
    semester: 2,
    coverType: 'gradient',
    coverValue: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #dc2626 100%)',
    rating: 4.9,
    ratingsCount: 76,
    activePlayers: 31,
    isFavorite: false,
    createdAt: '2026-03-11',
    blocks: [
      {
        id: 'dc1',
        type: 'connect',
        prompt: 'Asocia cada garantía constitucional con el derecho tutelado:',
        pairs: [
          { id: 'dp1', left: 'Habeas Corpus', right: 'Protege la libertad individual y la integridad personal física.' },
          { id: 'dp2', left: 'Acción de Amparo', right: 'Protege derechos fundamentales distintos a la libertad física.' },
          { id: 'dp3', left: 'Habeas Data', right: 'Protege el acceso a la información pública y la autodeterminación informativa.' },
          { id: 'dp4', left: 'Acción Popular', right: 'Control de constitucionalidad y legalidad contra reglamentos del Ejecutivo.' }
        ]
      }
    ]
  }
];

export const INITIAL_PENDING_REQUESTS: PendingRequest[] = [
  {
    id: 'req-1',
    type: 'university',
    customValue: 'Universidad del Pacífico (UP)',
    submittedByUsername: 'andres_eco',
    submittedAt: '2026-03-18 14:22',
    status: 'pending',
    adminNotes: 'Solicitud realizada al registrarse usando la Opción Otra'
  },
  {
    id: 'req-2',
    type: 'career',
    customValue: 'Bioingeniería Médica Avanzada',
    relatedEntityName: 'Universidad Nacional Mayor de San Marcos',
    submittedByUsername: 'camila_biomed',
    submittedAt: '2026-03-17 09:40',
    status: 'pending',
    adminNotes: 'Nueva carrera propuesta para la facultad de medicina'
  },
  {
    id: 'req-3',
    type: 'subject',
    customValue: 'Neurociencia Computacional y Modelado',
    relatedEntityName: 'Ingeniería de Sistemas y Software (Semestre 7)',
    submittedByUsername: 'matias_ai',
    submittedAt: '2026-03-16 18:15',
    status: 'pending',
    adminNotes: 'Materia optativa propuesta por los alumnos'
  }
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'trn-1',
    title: 'Torneo Relámpago Inter-Universitario: Algoritmos y Grafos 2026',
    subject: 'Estructuras de Datos y Algoritmos',
    date: '2026-03-28',
    exactTime: '19:00 GMT-5',
    prizeDescription: 'Medalla de Oro Virtual + 2,500 Puntos de Liga (RP) + Insignia Exclusiva de Maestro Algorítmico',
    status: 'upcoming',
    participantsCount: 16,
    bracket: [
      {
        id: 'm1',
        roundName: 'Semifinal A',
        player1: { id: 'usr_me', username: 'mateo_val', score: 980 },
        player2: { id: 'usr_2', username: 'sofia_code', score: 920 },
        winnerId: 'usr_me',
        status: 'finished'
      },
      {
        id: 'm2',
        roundName: 'Semifinal B',
        player1: { id: 'usr_3', username: 'carlos_math', score: 870 },
        player2: { id: 'usr_6', username: 'diego_dev', score: 910 },
        winnerId: 'usr_6',
        status: 'finished'
      },
      {
        id: 'm3',
        roundName: 'Gran Final',
        player1: { id: 'usr_me', username: 'mateo_val' },
        player2: { id: 'usr_6', username: 'diego_dev' },
        status: 'live'
      }
    ]
  },
  {
    id: 'trn-2',
    title: 'Batalla Médica Nacional: Farmacología & Diagnóstico Clínico',
    subject: 'Farmacología Médica y Terapéutica',
    date: '2026-04-05',
    exactTime: '18:30 GMT-5',
    prizeDescription: 'Cupo para Congreso Nacional de Medicina + 3,000 RP + Trofeo Estetoscopio Dorado',
    status: 'upcoming',
    participantsCount: 32,
    bracket: [
      {
        id: 'm4',
        roundName: 'Cuartos de Final',
        player1: { id: 'usr_4', username: 'dra_elena' },
        player2: { id: 'usr_7', username: 'valeria_med' },
        status: 'pending'
      }
    ]
  }
];

export interface CommunityMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bannerType: 'gradient' | 'image' | 'color';
  bannerValue: string;
  university: string;
  career: string;
  semester: number;
  bio: string;
  rpPoints: number;
  streakDays: number;
  isIncognito: boolean;
}

export const COMMUNITY_MEMBERS: CommunityMember[] = [
  {
    id: 'usr_2',
    fullName: 'Sofía Carrasco',
    username: 'sofia_code',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bannerType: 'gradient',
    bannerValue: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
    university: 'Pontificia Universidad Católica del Perú',
    career: 'Ingeniería Informática',
    semester: 5,
    bio: 'Competidora en ACM-ICPC. Fanática de los árboles de segmentos y optimizaciones dinámicas.',
    rpPoints: 2350,
    streakDays: 34,
    isIncognito: false
  },
  {
    id: 'usr_4',
    fullName: 'Dra. Elena Ramos',
    username: 'dra_elena',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    bannerType: 'image',
    bannerValue: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
    university: 'Universidad Nacional Mayor de San Marcos',
    career: 'Medicina Humana',
    semester: 6,
    bio: 'Docente auxiliar y estudiante de medicina. Creando cuadernos de repaso y ráfagas para anatomía.',
    rpPoints: 3100,
    streakDays: 45,
    isIncognito: false
  },
  {
    id: 'usr_incog',
    fullName: 'Javier Alarcón',
    username: 'ninja_cipher',
    avatarUrl: '',
    bannerType: 'color',
    bannerValue: '#18181b',
    university: 'Universidad Nacional de Ingeniería',
    career: 'Ciencias de la Computación',
    semester: 7,
    bio: 'Usuario en Modo Incógnito',
    rpPoints: 2890,
    streakDays: 20,
    isIncognito: true // Private mode active!
  },
  {
    id: 'usr_3',
    fullName: 'Carlos Mendoza',
    username: 'carlos_math',
    avatarUrl: '',
    bannerType: 'gradient',
    bannerValue: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
    university: 'Universidad Nacional Autónoma de México',
    career: 'Matemáticas Aplicadas',
    semester: 4,
    bio: 'Resolviendo integrales de superficie y compartiendo cuadernos de cálculo vectorial.',
    rpPoints: 1980,
    streakDays: 18,
    isIncognito: false
  },
  {
    id: 'usr_6',
    fullName: 'Diego Salazar',
    username: 'diego_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bannerType: 'gradient',
    bannerValue: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    university: 'Tecnológico de Monterrey',
    career: 'Ciencias de la Computación',
    semester: 4,
    bio: 'Dev & gamer competitivo en Notea.',
    rpPoints: 2410,
    streakDays: 26,
    isIncognito: false
  }
];
