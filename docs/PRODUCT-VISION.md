# Visión funcional del producto

## Estado de esta visión

Este documento recoge ideas de producto surgidas durante la exploración del flujo de un aprendiz. No todas forman parte del MVP actual. Sirve para conservar el contexto y convertir las ideas en decisiones implementables cuando el núcleo esté estable.

## 1. Principio de experiencia

El aprendiz debe entrar y entender rápidamente tres cosas:

1. qué cursos tiene activos
2. cuánto ha avanzado
3. cuál es el siguiente paso recomendado

La experiencia debe orientar, no limitarse a listar contenido. Cada pantalla importante debería responder a la pregunta: "¿Qué puedo hacer ahora para seguir aprendiendo?"

## 2. Flujo futuro del aprendiz

```text
Dashboard del aprendiz
  -> Mis cursos y avance
  -> Siguiente lección recomendada
  -> Lección orientada
       -> Video
       -> Conceptos teóricos
       -> Cuaderno o herramienta de repaso
       -> Evidencias propias
       -> Opiniones de otros aprendices
  -> Comunidad filtrada
       -> Iglesia
       -> Estado
       -> Distrito
  -> Perfil personal
       -> Publicaciones
       -> Evidencias
       -> Historial de avance
```

## 3. Dashboard del aprendiz

La primera vista debería priorizar:

- cursos en progreso
- porcentaje o lecciones completadas
- última actividad
- siguiente lección pendiente
- evidencias recientes propias
- acceso secundario a la comunidad

La vista social no debe desplazar el objetivo principal: continuar el aprendizaje.

## 4. Comunidad y filtros

La faceta social puede organizarse por alcance:

- mi iglesia
- mi distrito
- mi estado
- toda la comunidad, si se habilita posteriormente

Los filtros deben depender de la relación de `usuarios` con `organizaciones`. Para evitar confusión, cada publicación debe mostrar claramente su contexto organizativo.

El MVP puede comenzar mostrando evidencias de la comunidad sin filtros avanzados. Los filtros por iglesia, distrito y estado son una evolución posterior que requiere definir la geografía y jerarquía de organizaciones.

## 5. Perfil del aprendiz

El perfil debe ser sencillo y orientado a actividad:

- nombre y organización
- cursos activos y completados
- progreso resumido
- publicaciones propias
- evidencias enviadas
- comentarios realizados, si resulta útil

La primera versión no necesita una red social completa. El perfil debe ayudar al aprendiz a ordenar y revisar su recorrido.

## 6. Página de lección orientadora

Una lección debería dividirse en bloques claros:

1. objetivo de la lección
2. conceptos teóricos
3. video o demostración
4. instrucciones prácticas
5. herramienta de repaso
6. evidencia opcional o requerida
7. opiniones y comentarios de quienes ya la vieron
8. botón para marcar progreso

La teoría y la práctica deben estar conectadas. Una lección no debe ser solo un iframe de video.

## 7. Cuadernos y herramientas de repaso

Ideas de bajo riesgo para una etapa posterior:

- notas personales por lección
- checklist de conceptos
- tarjetas de repaso
- glosario de términos musicales
- metrónomo o afinador simple
- historial de intentos o evidencias

Conviene empezar por notas personales y checklist. Son herramientas directamente relacionadas con el contenido y requieren menos complejidad que un sistema completo de autoría.

## 8. Opiniones sobre una lección

El aprendiz debería poder ver una conversación vinculada a la lección, diferenciando:

- comentarios generales sobre la lección
- comentarios sobre una evidencia concreta
- retroalimentación de un líder

La implementación actual tiene comentarios asociados a evidencias. El siguiente refinamiento conceptual sería decidir si se necesita una entidad adicional de comentarios de lección o si toda opinión debe nacer de una evidencia práctica.

## 9. Vista del líder

El líder debería poder consultar el progreso de los alumnos que pertenecen a su organización:

- alumnos activos
- cursos iniciados
- lecciones completadas
- última actividad
- evidencias pendientes de revisar
- comentarios o retroalimentación entregada

La autorización debe limitar el alcance de los datos. Un líder no debería ver automáticamente el progreso de cualquier organización.

Esto requerirá definir una relación clara entre líder, organización y alumnos. El campo `organizacionId` actual es el punto de partida, pero posiblemente se necesite una política de alcance más explícita.

## 10. Jerarquía de cursos y prerrequisitos

El concepto de "curso" debe distinguir entre la identidad académica y su nivel o dependencia.

Propuesta conceptual:

```text
Instrumento: Guitarra
  -> Ruta básica
       -> Curso: Fundamentos de guitarra
  -> Ruta intermedia
       -> Curso: Acordes y acompañamiento
  -> Cursos específicos
       -> Curso: Ritmos latinoamericanos
```

Un curso puede tener:

- instrumento
- nivel: básico, intermedio, avanzado
- tipo: ruta principal o curso específico
- prerrequisitos: otros cursos o lecciones completadas
- estado: borrador, publicado, archivado

Para el MVP se recomienda mantener el modelo simple:

- conservar `cursos` y `lecciones`
- añadir nivel y estado cuando exista una necesidad real de filtrado
- no bloquear todavía cursos por prerrequisitos
- probar primero el avance lineal dentro de un curso

Cuando la necesidad esté validada, los prerrequisitos podrían modelarse con una tabla propia, por ejemplo `curso_prerrequisitos`, en lugar de guardar varios IDs en una columna.

## 11. Orden recomendado de refinamiento

### MVP actual

- cursos y lecciones
- progreso individual
- evidencias, comentarios y reacciones
- administración básica protegida por roles

### Siguiente producto

- dashboard centrado en "Mis cursos"
- porcentaje de avance y siguiente lección
- perfil básico del aprendiz
- filtro social por organización
- vista inicial de progreso para líderes

### Evolución posterior

- teoría estructurada dentro de la lección
- notas y checklist personales
- opiniones generales de la lección
- jerarquía de niveles
- prerrequisitos entre cursos
- herramientas musicales de repaso

## 12. Decisiones que debemos conservar

- el aprendizaje es el flujo principal; lo social lo acompaña
- los filtros sociales dependen de la organización real del usuario
- el líder ve datos de su ámbito, no datos globales sin control
- los prerrequisitos deben ser relaciones explícitas y no texto libre
- una feature nueva debe comenzar con un caso de uso claro, un contrato de datos y un test
- no añadir complejidad de plataforma antes de validar el comportamiento con usuarios

## 13. Directriz para nuevas ideas

Cuando aparezca una idea durante una sesión, no es necesario implementarla inmediatamente. Primero debe conservarse en este documento o en una sección de ideas pendientes, con suficiente contexto para retomarla aunque cambie la sesión o el agente.

Usa esta plantilla:

```md
### [Nombre breve de la idea]

- Fecha:
- Persona principal:
- Situación o necesidad:
- Qué debería poder hacer la persona:
- Sensación que queremos provocar:
- Resultado útil esperado:
- Prioridad: MVP / siguiente etapa / futura
- Dependencias de datos o permisos:
- Preguntas todavía abiertas:
- Primera versión sencilla que podríamos probar:
```

### Cómo debe ayudar el agente

En una sesión futura, el agente debe:

1. leer `CONTEXT.MD`, `docs/ARCHITECTURE.md`, `docs/PRODUCT-VISION.md` y `docs/ROADMAP.md`
2. localizar las ideas relacionadas antes de proponer código
3. pedir o inferir el caso de uso principal, sin convertir una sensación en una lista de funcionalidades sin dirección
4. traducir la intuición a un flujo: entrada, decisión, acción, respuesta y siguiente paso
5. identificar qué emoción o sensación debe sostener cada pantalla, por ejemplo orientación, confianza, pertenencia, progreso o calma
6. proponer primero una versión pequeña y comprobable dentro del MVP
7. separar claramente descubrimiento de producto, diseño UX, modelo de datos e implementación
8. actualizar este documento con las decisiones tomadas y dejar las alternativas descartadas como contexto breve

### Prompt reutilizable para otra sesión

Puedes iniciar una conversación nueva con este texto:

```text
Estamos desarrollando Academia S.I.O.N. en fase MVP. Lee primero CONTEXT.MD, docs/ARCHITECTURE.md, docs/PRODUCT-VISION.md y docs/ROADMAP.md.

Quiero explorar una nueva idea de experiencia de usuario antes de implementarla. Ayúdame a:

1. entender qué necesidad del aprendiz, líder o comunidad resuelve
2. expresar con claridad la sensación que quiero provocar
3. convertirla en un flujo de usuario concreto
4. separar el MVP de las evoluciones posteriores
5. detectar dependencias de datos, permisos y modelo de cursos
6. proponer una primera versión sencilla que podamos probar
7. documentar la idea y las decisiones en docs/PRODUCT-VISION.md

No implementes todavía hasta que el flujo y el alcance estén claros. Cuando lleguemos a una decisión, usa tests y la arquitectura existente para construirla paso a paso.
```

La regla central es: **primero hacemos visible la experiencia que imaginas; después decidimos qué código mínimo puede hacerla real**.
