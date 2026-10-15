# Hospital de campanya · Vall d'Arnes

Activitat individual gamificada del mòdul **0053 Logística sanitària en emergències** (CFGM Tècnic en Emergències Sanitàries, TES 1M).

L'alumnat gestiona un terratrèmol en una vall aïllada, on no es poden evacuar les víctimes, des de la primera nit fins a un any després:

1. **Analitza** l'escenari en una escena 3D (6 punts d'informació).
2. **Classifica** el desastre i els seus efectes (unitat 1).
3. **Activa** el pla: fase del desastre, pla especial, nivell d'activació, ubicació de l'hospital de campanya i primeres actuacions (unitat 2 i PROCICAT).
4. Fa el **triatge START** de 10 víctimes.
5. **Reconstrueix** (dia 15): fase de reconstrucció. Decideix quan es fa cada obra (serveis essencials, setmanes, mesos) i la veu construir-se al mapa 3D.
6. **Prevé** (un any després): fase d'interdesastre. Actualitza el pla d'emergència municipal sobre un mapa de riscos animat: riscos de la vall, recursos del poble i mesures noves.
7. Obté un **informe** amb puntuació sobre 1.500 i un codi de verificació per lliurar a Google Classroom.

Continguts: RA1 (unitat 1, emergències extraordinàries) i RA2 (unitat 2, gestió del desastre: fases, protecció civil, plans d'emergència i d'autoprotecció).

## Accés

- Usuari: correu de l'institut acabat en `@isvh.cat`.
- Contrasenya: la facilita el professorat.

L'accés és una capa senzilla que funciona al navegador (GitHub Pages és un allotjament estàtic). Serveix per filtrar l'entrada, no protegeix dades: el progrés es desa només al navegador de cada alumne (amb una clau diferent de la de `logistica01`).

## Tecnologia

Una sola pàgina (`index.html`) amb HTML, CSS i JavaScript, i [three.js r128](https://threejs.org/) des de cdnjs per a l'escena 3D. Sense servidor ni base de dades.
