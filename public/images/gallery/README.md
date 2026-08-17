# Referenzfotos

Hier eigene Projektfotos ablegen (empfohlen: `.jpg`/`.webp`, Querformat,
möglichst mind. 1200 px breit).

Danach in `lib/content.ts` im Array `galleryItems` beim jeweiligen Eintrag
den Pfad eintragen, z. B.:

```ts
{
  id: "ref-01",
  category: "Bäder",
  title: "Barrierefreies Bad",
  location: "Dortmund-Innenstadt",
  image: "/images/gallery/bad-dortmund-01.jpg",
  alt: "Barrierefreies Badezimmer mit bodengleicher Dusche in Dortmund",
},
```

Solange `image: null` gesetzt ist, zeigt die Galerie automatisch einen
gestalteten Platzhalter ("Foto folgt") an.
