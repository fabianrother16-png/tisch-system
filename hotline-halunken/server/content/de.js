// Alle Spielinhalte von HOTLINE HALUNKEN.
// Neue Karten einfach unten anhängen – jede id muss eindeutig sein.

// ---------------------------------------------------------------------------
// MASCHEN – womit die Halunken anrufen. Jeder Anrufer wählt 1 aus 2.
// proof = der "Beweis", den der Anrufer einmal pro Anruf auf alle Bildschirme schicken kann.
// ---------------------------------------------------------------------------
export const MASCHEN = [
  {
    id: 'winzigweich',
    emoji: '🖥️',
    title: 'Winzigweich-Support',
    caller: 'Kevin vom Winzigweich-Support',
    pitch: 'Der Computer des Opfers hat 3.847 Viren. Nur du kannst sie entfernen – gegen Gebühr in Gutscheinkarten.',
    tips: ['Behaupte, du siehst den Bildschirm des Opfers live.', 'Lass das Opfer Tasten drücken, die es nicht gibt („Drücken Sie jetzt F13“).'],
    proof: { kind: 'screen', title: '⚠️ FENSTER VIRUS ALARM', lines: ['Gefundene Viren: 3.847', 'Davon gefährlich: ALLE', 'Lösung: Kevin bezahlen'], stamp: 'ECHT OFFIZIELL' },
  },
  {
    id: 'enkel',
    emoji: '👦',
    title: 'Der Enkeltrick',
    caller: '„Rate mal, wer dran ist!“',
    pitch: 'Du bist angeblich das Enkelkind des Opfers. Du hattest einen Unfall mit einem Lamborghini-Taxi und brauchst SOFORT Geld.',
    tips: ['Starte mit „Rate mal, wer dran ist!“ und nimm den Namen, den das Opfer rät.', 'Du hast eine neue Nummer. Und eine neue Stimme. Erkältung!'],
    proof: { kind: 'photo', title: 'Beweisfoto: Ich (Enkel)', lines: ['[Foto einer Kartoffel mit Sonnenbrille]', '„Seh ich nicht aus wie früher?“'], stamp: '100% ENKEL' },
  },
  {
    id: 'prinz',
    emoji: '👑',
    title: 'Der reiche Prinz',
    caller: 'Prinz Rüdiger von Übersee',
    pitch: 'Du bist ein Prinz mit 40 Millionen Erbe. Du brauchst nur kurz 500 € „Überweisungsgebühr“ – danach bekommt das Opfer die Hälfte vom Schatz.',
    tips: ['Sprich sehr königlich und sehr großzügig.', 'Erwähne dein Schloss, deine Kamele und deine 12 Butler.'],
    proof: { kind: 'cert', title: 'KÖNIGLICHE URKUNDE', lines: ['Hiermit bestätigt der Prinz,', 'dass der Prinz echt ist.', 'gez. der Prinz'], stamp: 'ADELIG' },
  },
  {
    id: 'zoll',
    emoji: '📦',
    title: 'Paket beim Zoll',
    caller: 'Dieter vom Zoll-Paket-Center',
    pitch: 'Ein Paket (3 kg Käse aus Holland) hängt beim Zoll fest. Zollgebühr: 2,99 €. Und dann noch ein paar weitere Gebühren. Und noch eine.',
    tips: ['Fang winzig an und steigere die Gebühren immer weiter.', 'Der Käse wird langsam warm – Zeitdruck!'],
    proof: { kind: 'ticket', title: 'SENDUNGSVERFOLGUNG', lines: ['Inhalt: 3 kg Gouda', 'Status: Käse schwitzt', 'Offen: 2,99 € + Käsesteuer'], stamp: 'ZOLL (ECHT)' },
  },
  {
    id: 'gewinn',
    emoji: '🏎️',
    title: 'Das Gewinnspiel',
    caller: 'Mandy von der Glücks-Hotline',
    pitch: 'Das Opfer hat einen Sportwagen gewonnen! Leider fallen noch kleine Liefer-, Bearbeitungs- und Freude-Gebühren an.',
    tips: ['Sei extrem euphorisch. GLÜCKWUNSCH!!!', 'Die Gebühr ist „nur eine Formalität“.'],
    proof: { kind: 'cert', title: 'GEWINNER-ZERTIFIKAT', lines: ['Preis: 1 Sportwagen', '(Maßstab 1:43)', 'Gebühr: nur 499 €'], stamp: 'GEWONNEN!!' },
  },
  {
    id: 'omacoin',
    emoji: '🚀',
    title: 'OmaCoin',
    caller: 'Justin, Krypto-Genie (19)',
    pitch: 'Du verkaufst „OmaCoin“, die Kryptowährung, die garantiert zum Mond fliegt. Wer jetzt nicht investiert, bereut es für immer.',
    tips: ['Benutze Wörter wie „Blockchain“, „HODL“ und „Lambo“.', 'Alle Charts gehen nur nach oben. Immer.'],
    proof: { kind: 'screen', title: 'OMACOIN-KURS 📈', lines: ['Gestern: 0,01 €', 'Heute: 0,02 €', 'Morgen: 1 MILLIARDE €'], stamp: 'TO THE MOON' },
  },
  {
    id: 'heizung',
    emoji: '🔥',
    title: 'Heizungs-Notdienst',
    caller: 'Meister Bernd vom Notdienst',
    pitch: 'Du hast „aus der Ferne“ erkannt, dass die Heizung des Opfers in 10 Minuten explodiert. Die Rettung gibt es nur gegen Vorkasse.',
    tips: ['Mach Zischgeräusche, die „aus der Heizung“ kommen.', 'Jede Minute wird es teurer!'],
    proof: { kind: 'doc', title: 'FERN-DIAGNOSE', lines: ['Heizung: sehr heiß', 'Explosionsgefahr: 97 %', 'Rettung: 450 € Vorkasse'], stamp: 'DRINGEND' },
  },
  {
    id: 'finanzamt',
    emoji: '🧾',
    title: 'Das „Finanzamt“',
    caller: 'Frau Dr. Steuer-Schmidt',
    pitch: 'Das Opfer muss Steuern nachzahlen – für den Wellensittich, den Gartenzwerg und für „zu viel Glück im Leben“.',
    tips: ['Sei streng und bürokratisch.', 'Erfinde Paragrafen: „Laut § 42b Absatz Keks …“'],
    proof: { kind: 'doc', title: 'STEUERBESCHEID', lines: ['Wellensittich-Steuer: 120 €', 'Gartenzwerg-Abgabe: 80 €', 'Glücks-Soli: 300 €'], stamp: 'AMTLICH' },
  },
  {
    id: 'liebe',
    emoji: '💘',
    title: 'Liebes-Scam',
    caller: 'General Brad (Ölplattform)',
    pitch: 'Du bist ein einsamer General auf einer Ölplattform und hast dich unsterblich ins Opfer verliebt. Du brauchst nur Geld für ein Flugticket.',
    tips: ['Übertreib die Romantik maßlos.', 'Das WLAN auf der Ölplattform ist schlecht – deshalb kein Videocall.'],
    proof: { kind: 'photo', title: 'Liebesbrief ❤️', lines: ['„Du bist mein Sonnenschein.“', '„Bitte schick 500 € für Flugticket.“', '„Kuss, Brad“'], stamp: 'ECHTE LIEBE' },
  },
  {
    id: 'startup',
    emoji: '🦄',
    title: 'Startup-Investment',
    caller: 'Finn, CEO & Visionär',
    pitch: 'Du suchst Investoren für dein Startup: „Uber, aber für Hunde“. Einmalige Chance, jetzt früh einzusteigen!',
    tips: ['Sag „disruptiv“, „skalieren“ und „Synergie“.', 'Dein Startup hat 0 Kunden, aber „riesiges Potenzial“.'],
    proof: { kind: 'screen', title: 'PITCH-DECK (Folie 1/1)', lines: ['Idee: Uber für Hunde', 'Umsatz: noch keiner', 'Bewertung: 1 Mrd. €'], stamp: 'DISRUPTIV' },
  },
  {
    id: 'mond',
    emoji: '🌕',
    title: 'Grundstück auf dem Mond',
    caller: 'Makler Kai Kratermann',
    pitch: 'Du verkaufst Grundstücke auf dem Mond. Mit Seeblick (das „Meer der Ruhe“!) und garantiert ruhigen Nachbarn.',
    tips: ['Schwärme von der Aussicht und der Ruhe.', 'Nur noch 3 Grundstücke frei!'],
    proof: { kind: 'cert', title: 'GRUNDBUCHAUSZUG MOND', lines: ['Lage: Krater 7, links', 'Blick: Erde (unverbaubar)', 'Nachbarn: keine'], stamp: 'BEGLAUBIGT' },
  },
  {
    id: 'wasser',
    emoji: '💧',
    title: 'Wunder-Wasser',
    caller: 'Heilpraktikerin Sonnenstrahl',
    pitch: 'Du verkaufst magnetisiertes Mondwasser, das gegen alles hilft: Rücken, Liebeskummer und schlechtes WLAN.',
    tips: ['Sprich sanft und sehr überzeugt.', 'Erfinde Erfolgsgeschichten von „Kunden“.'],
    proof: { kind: 'doc', title: 'LABORBERICHT', lines: ['Wirkt gegen: ALLES', 'Nebenwirkungen: Glück', 'Getestet an: meiner Katze'], stamp: 'WISSENSCHAFT' },
  },
  {
    id: 'bank',
    emoji: '🏦',
    title: 'Die „Bank“',
    caller: 'Herr Sicher von der Sparschwein-Bank',
    pitch: 'Das Konto des Opfers wurde „gehackt“. Um es zu schützen, muss das Geld sofort auf ein „Sicherheitskonto“ (deins) überwiesen werden.',
    tips: ['Klinge seriös und besorgt.', 'Nenne eine absurde IBAN.'],
    proof: { kind: 'screen', title: 'SICHERHEITS-WARNUNG', lines: ['Ihr Konto: in Gefahr', 'Sicherheitskonto: DE00 KEVIN 1234', 'Status: sehr sicher'], stamp: 'BANK (ECHT)' },
  },
  {
    id: 'geister',
    emoji: '👻',
    title: 'Geister-Versicherung',
    caller: 'Versicherungsvertreter Horst Spuk',
    pitch: 'Du verkaufst eine Versicherung gegen Geister, Zombies und Alien-Entführungen. Der Schadensfall ist „wahrscheinlicher, als man denkt“.',
    tips: ['Erzähl gruselige „Kundenschicksale“.', 'Biete ein Premium-Paket gegen Montage an.'],
    proof: { kind: 'doc', title: 'POLICE Nr. 666', lines: ['Schutz vor: Geistern', 'Schutz vor: Zombies', 'Schutz vor: Montagen'], stamp: 'VERSICHERT' },
  },
  {
    id: 'zeitreise',
    emoji: '⏰',
    title: 'Der Zeitreisende',
    caller: 'Dr. Zukunft (aus dem Jahr 2089)',
    pitch: 'Du kommst aus der Zukunft. Du weißt, welche Aktie explodiert, aber du brauchst Geld, um deine Zeitmaschine zu reparieren.',
    tips: ['Verrate „Zukunfts-Fakten“ über das Opfer.', 'Dein Akku (Fluxkompensator) ist fast leer!'],
    proof: { kind: 'doc', title: 'ZEITUNG VON 2089', lines: ['„Toaster-Aktie steigt um 9000 %“', '„Socken in Sandalen wieder Trend“'], stamp: 'AUS DER ZUKUNFT' },
  },
  {
    id: 'promi',
    emoji: '🎤',
    title: 'Der Promi in Not',
    caller: 'Ein „weltberühmter“ Popstar',
    pitch: 'Du bist ein weltberühmter Star (erfinde einen Namen!). Du hast dein Portemonnaie verloren und brauchst Geld für ein Taxi zu deinem Konzert.',
    tips: ['Sing deinen „größten Hit“ an.', 'Versprich VIP-Tickets und ein Selfie.'],
    proof: { kind: 'photo', title: 'AUTOGRAMMKARTE', lines: ['„Für meinen größten Fan“', '[unleserliche Unterschrift]'], stamp: 'SIGNIERT' },
  },
  {
    id: 'schoko',
    emoji: '🍫',
    title: 'Dubai-Schoki-Großhandel',
    caller: 'Schoko-Händler Leon',
    pitch: 'Du bietest exklusiv 1 Tonne Dubai-Schokolade zum Vorzugspreis an. Lieferung „bald“. Vorkasse „jetzt“.',
    tips: ['Tu so, als wäre es ein geheimer Insider-Deal.', 'Die Konkurrenz will die Schoki auch!'],
    proof: { kind: 'ticket', title: 'LIEFERSCHEIN', lines: ['1 Tonne Pistazien-Schoki', 'Lieferung: irgendwann', 'Bereits geschmolzen: 40 %'], stamp: 'LECKER' },
  },
  {
    id: 'hamster',
    emoji: '⚡',
    title: 'Hamster-Strom',
    caller: 'Energieberater Watt-Wolfgang',
    pitch: 'Du verkaufst einen neuen Stromvertrag: 100 % Ökostrom aus Hamsterrädern. Super günstig – nach der Anzahlung.',
    tips: ['Erkläre, wie fit und glücklich die Hamster sind.', 'Der alte Stromvertrag des Opfers ist „illegal teuer“.'],
    proof: { kind: 'doc', title: 'STROMVERTRAG', lines: ['Strom aus: 4.000 Hamstern', 'Laufleistung: sehr gut', 'Anzahlung: 300 €'], stamp: 'GRÜN' },
  },
  {
    id: 'tierarzt',
    emoji: '🐱',
    title: 'Tier-Notfall',
    caller: 'Dr. Pfote von der Tierklinik',
    pitch: 'Das Haustier des Opfers (auch wenn es keins hat!) braucht eine dringende OP: ein Hörgerät für Katzen.',
    tips: ['Klinge dramatisch besorgt.', 'Das Tier hat angeblich nach dem Opfer gefragt.'],
    proof: { kind: 'doc', title: 'RÖNTGENBILD', lines: ['[Bild: Katze mit Fragezeichen]', 'Diagnose: will Hörgerät', 'Kosten: 390 €'], stamp: 'NOTFALL' },
  },
  {
    id: 'nft',
    emoji: '🍞',
    title: 'NFT eines Toastbrots',
    caller: 'Digital-Artist xX_Brot_Xx',
    pitch: 'Du verkaufst ein exklusives NFT: ein Foto von einem leicht verbrannten Toast. Nur 1 von 1!',
    tips: ['Tu so, als wäre das Kunstgeschichte.', 'Ein „Promi“ hat angeblich auch schon eins.'],
    proof: { kind: 'screen', title: 'NFT #0001', lines: ['[Pixel-Toast]', 'Seltenheit: Legendär', 'Wert: unbezahlbar (500 €)'], stamp: 'EINZIGARTIG' },
  },
  {
    id: 'horoskop',
    emoji: '🔮',
    title: 'Horoskop-Hotline',
    caller: 'Madame Esmeralda',
    pitch: 'Die Sterne haben dir verraten, dass das Opfer in großer Gefahr ist. Nur ein „Schutzritual“ gegen Gebühr kann helfen.',
    tips: ['Sprich mystisch und mach lange Pausen …', 'Rate Dinge über das Opfer („Ich sehe … einen Kühlschrank.“).'],
    proof: { kind: 'doc', title: 'STERNENKARTE', lines: ['Mars: steht im Weg', 'Venus: genervt', 'Lösung: 333 € Schutzritual'], stamp: 'KOSMISCH' },
  },
  {
    id: 'marsgym',
    emoji: '🏋️',
    title: 'Fitnessstudio auf dem Mars',
    caller: 'Coach Brutus',
    pitch: 'Du verkaufst eine Lebenszeit-Mitgliedschaft im ersten Fitnessstudio auf dem Mars. Eröffnung: 2090. Beitrag: ab sofort.',
    tips: ['Motiviere das Opfer lautstark.', 'Frühbucher bekommen ein gratis Proteinshake-Abo!'],
    proof: { kind: 'ticket', title: 'MITGLIEDSAUSWEIS', lines: ['Studio: Mars-Gym', 'Eröffnung: 2090', 'Kündigung: unmöglich'], stamp: 'PUMP' },
  },
  {
    id: 'schulfreund',
    emoji: '🎒',
    title: 'Der alte Schulfreund',
    caller: 'Dein alter Kumpel „Micha“ (oder so)',
    pitch: 'Du tust so, als wärst du ein alter Schulfreund des Opfers. Du „erinnerst“ dich an gemeinsame Erlebnisse und brauchst kurz einen kleinen Kredit.',
    tips: ['Erfinde peinliche gemeinsame Erinnerungen.', 'Tu beleidigt, wenn das Opfer dich nicht erkennt.'],
    proof: { kind: 'photo', title: 'KLASSENFOTO 1998', lines: ['[verwackeltes Foto]', '„Du bist der 3. von links!“'], stamp: 'NOSTALGIE' },
  },
  {
    id: 'kurs',
    emoji: '💎',
    title: 'Der Millionärs-Kurs',
    caller: 'Business-Coach Maximilian',
    pitch: 'Du verkaufst einen Online-Kurs: „In 3 Tagen Millionär – ohne zu arbeiten“. Schritt 1: den Kurs kaufen.',
    tips: ['Sprich über „Mindset“ und „passives Einkommen“.', 'Du sitzt angeblich gerade in einem Lambo.'],
    proof: { kind: 'screen', title: 'KURS-ERFOLGE', lines: ['Teilnehmer: 3', 'Millionäre: 0', 'Motivation: 100 %'], stamp: 'ALPHA' },
  },
  {
    id: 'adel',
    emoji: '🏰',
    title: 'Der Adelstitel',
    caller: 'Graf von und zu Stammbaum',
    pitch: 'Ahnenforschung hat ergeben: Das Opfer ist adelig! Die Urkunde und das Schloss gibt es gegen eine kleine Gebühr.',
    tips: ['Sprich das Opfer nur noch mit „Eure Hoheit“ an.', 'Das Schloss ist „ein bisschen renovierungsbedürftig“.'],
    proof: { kind: 'cert', title: 'ADELSURKUNDE', lines: ['Titel: Herzog/in von Hinterhof', 'Schloss: 1 (Hüpfburg)', 'Gebühr: 499 €'], stamp: 'BLAUBLÜTIG' },
  },
  {
    id: 'auto',
    emoji: '🚗',
    title: 'Das traurige Auto',
    caller: 'KFZ-Meister Olaf',
    pitch: 'Das Auto des Opfers hat in der Werkstatt angerufen. Es ist traurig und braucht eine teure „Gefühls-Inspektion“.',
    tips: ['Beschreibe die Gefühle des Autos sehr genau.', 'Ohne Therapie droht ein Motor-Burnout!'],
    proof: { kind: 'doc', title: 'WERKSTATT-BERICHT', lines: ['Motor: weint', 'Reifen: einsam', 'Therapie: 280 €'], stamp: 'TÜV-ÄHNLICH' },
  },
  {
    id: 'umfrage',
    emoji: '📋',
    title: 'Die harmlose Umfrage',
    caller: 'Sandra vom Meinungs-Institut',
    pitch: 'Du machst nur eine ganz kurze Umfrage … die zufällig nach Kontostand, PIN und Lieblings-Überweisungsbetrag fragt.',
    tips: ['Starte mit harmlosen Fragen und werde immer frecher.', '„Nur noch eine allerletzte Frage!“'],
    proof: { kind: 'doc', title: 'FRAGEBOGEN', lines: ['Frage 1: Lieblingsfarbe?', 'Frage 2: Kontostand?', 'Frage 3: PIN? (nur zum Spaß)'], stamp: 'ANONYM' },
  },
  {
    id: 'radio',
    emoji: '📻',
    title: 'Radio-Glücksrad',
    caller: 'Moderator Ricky von Radio Halunke',
    pitch: 'Das Opfer ist LIVE im Radio! Es darf am Glücksrad drehen – aber erst nach der kleinen Teilnahmegebühr.',
    tips: ['Moderier alles wie im Radio, mit Jingle!', 'Tausende Zuhörer warten angeblich auf die Antwort.'],
    proof: { kind: 'ticket', title: 'RADIO-GEWINNCODE', lines: ['Sender: Radio Halunke 104,2', 'Code: GELD-HER', 'Teilnahme: 50 €'], stamp: 'ON AIR' },
  },
  {
    id: 'handy',
    emoji: '📱',
    title: 'Der Super-Handyvertrag',
    caller: 'Tarif-Berater Marvin',
    pitch: 'Du verkaufst einen Handyvertrag mit 10.000 GB, Flatrate ins All und Gratis-Toaster. Einmalige Anschlussgebühr: „nur“ 399 €.',
    tips: ['Rede extrem schnell über das Kleingedruckte.', 'Das Angebot gilt nur noch 30 Sekunden!'],
    proof: { kind: 'doc', title: 'TARIF-ÜBERSICHT', lines: ['Datenvolumen: 10.000 GB', 'Netz: überall (auch Mars)', 'Kleingedrucktes: [zu klein]'], stamp: 'TOP-DEAL' },
  },
  {
    id: 'erbe',
    emoji: '📜',
    title: 'Die Erbschaft',
    caller: 'Notar Dr. Paragraf',
    pitch: 'Ein „entfernter Onkel“ aus Kanada hat dem Opfer 2 Millionen vererbt. Leider fallen noch Notar-, Bearbeitungs- und Trauergebühren an.',
    tips: ['Sprich sehr formell und traurig.', 'Der Onkel hinterlässt außerdem einen Elch.'],
    proof: { kind: 'doc', title: 'TESTAMENT', lines: ['Erbe: 2.000.000 €', 'Zusätzlich: 1 Elch', 'Notargebühr: 600 €'], stamp: 'NOTARIELL' },
  },
  {
    id: 'hacker',
    emoji: '🕶️',
    title: 'Der „Hacker“',
    caller: 'Anonymer Hacker „ShadowByte“',
    pitch: 'Du hast die Einkaufsliste des Opfers gehackt. Gegen eine kleine Spende verrätst du sie NICHT an die Nachbarn.',
    tips: ['Sprich mit verzerrter, bedrohlicher Stimme.', 'Lies Details der „Einkaufsliste“ vor.'],
    proof: { kind: 'screen', title: 'GEHACKT!!', lines: ['Einkaufsliste: 12× Pudding', 'Suchverlauf: „Pudding-Sucht Hilfe“'], stamp: 'HACKER-STYLE' },
  },
  {
    id: 'zwerg',
    emoji: '🧙',
    title: 'Gartenzwerg-Leasing',
    caller: 'Frank von Zwerg & Co.',
    pitch: 'Du bietest Premium-Gartenzwerge im Leasing an. Mit Nachtsicht, WLAN und Bewegungsmelder.',
    tips: ['Beschreibe die Zwerge wie Luxusautos.', 'Die Nachbarn haben angeblich schon drei.'],
    proof: { kind: 'doc', title: 'LEASINGVERTRAG', lines: ['Modell: Zwerg 3000 Pro', 'Laufzeit: 99 Jahre', 'Rate: 150 €/Monat'], stamp: 'ZWERGIG' },
  },
];

// ---------------------------------------------------------------------------
// OPFER – Rollen für die angerufene Person. Alles außer "secret" sehen alle.
// ---------------------------------------------------------------------------
export const PERSONAS = [
  { id: 'gertrud', emoji: '👵', name: 'Oma Gertrud', age: '84', bio: 'Strickt, backt und vertraut jedem, der „Liebes“ sagt.', likes: 'Schlager, Kater Mausi, Komplimente', hates: 'Anglizismen, Hektik', secret: 'Du bist schwerhörig – aber nur, wenn es dir passt.', savings: 'in der Keksdose' },
  { id: 'heinz', emoji: '👴', name: 'Opa Heinz', age: '79', bio: 'Ex-Hausmeister. Misstrauisch. Hat alles schon erlebt.', likes: 'Pünktlichkeit, Schrebergarten, „früher“', hates: 'Handys, Ausreden, junge Leute', secret: 'Du erzählst ungefragt vom jahrelangen Heckenstreit mit dem Nachbarn.', savings: 'unter der Matratze' },
  { id: 'chantal', emoji: '💅', name: 'Chantal', age: '19', bio: 'Influencerin mit stolzen 312 Followern. Filmt alles.', likes: 'Filter, Rabattcodes, Drama', hates: 'schlechtes Licht, Boomer', secret: 'Du fragst jeden, ob er dich von Insta kennt.', savings: 'vom letzten Rabattcode' },
  { id: 'dieter', emoji: '🧰', name: 'Dieter', age: '52', bio: 'Weiß alles besser. Wirklich alles.', likes: 'Vorschriften, Bier, Recht haben', hates: 'Unordnung, Fremdwörter', secret: 'Du korrigierst jeden kleinen Fehler des Anrufers.', savings: 'auf dem Sparbuch' },
  { id: 'karen', emoji: '💁', name: 'Karen', age: '45', bio: 'Möchte IMMER mit dem Vorgesetzten sprechen.', likes: 'Beschwerden, Gutscheine, Rabatte', hates: 'Warten, das Wort „Nein“', secret: 'Nach jeder Antwort verlangst du den Chef.', savings: 'aus Erstattungen' },
  { id: 'jonas', emoji: '🎮', name: 'Jonas', age: '13', bio: 'Zockt gerade und hat Mamas Kreditkarte gefunden.', likes: 'Skins, Energy-Drinks, Siege', hates: 'Hausaufgaben, Lag', secret: 'Du hörst nur zu, wenn es irgendwie um Games geht.', savings: 'auf Mamas Kreditkarte' },
  { id: 'dracula', emoji: '🧛', name: 'Graf Dracula', age: '587', bio: 'Nachtaktiver Adeliger mit sehr viel altem Gold.', likes: 'Nacht, Blutorangen, Burgen', hates: 'Knoblauch, Sonnenlicht', secret: 'Du hast seit 200 Jahren mit niemandem geredet und bist SEHR gesprächig.', savings: 'in einem Sarg voller Goldmünzen' },
  { id: 'santa', emoji: '🎅', name: 'Der Weihnachtsmann', age: '1.753', bio: 'Hat im Sommer nichts zu tun und langweilt sich.', likes: 'Kekse, Rentiere, Listen', hates: 'Osterhasen, Kamine ohne Rußschutz', secret: 'Du fragst ständig, ob der Anrufer dieses Jahr brav war.', savings: 'im Geschenkesack' },
  { id: 'bello', emoji: '🐕', name: 'Bello', age: '7', bio: 'Ein Hund, der zufällig telefonieren kann.', likes: 'Leckerlis, Bälle, Postboten', hates: 'Staubsauger, Tierarzt, Katzen', secret: 'Wenn du aufgeregt bist, bellst du.', savings: 'im Garten vergraben' },
  { id: 'chad', emoji: '💪', name: 'Chad', age: '28', bio: 'Finanz-Bro und „Krypto-Millionär“ (angeblich).', likes: 'Gains, Motivation, Luxusuhren', hates: 'Kohlenhydrate, Arbeitnehmer', secret: 'Eigentlich willst du dem Anrufer deinen eigenen Kurs verkaufen.', savings: 'in „Assets“' },
  { id: 'sabine', emoji: '🌙', name: 'Sabine', age: '49', bio: 'Esoterikerin. Spricht mit ihren Pflanzen.', likes: 'Räucherstäbchen, Vollmond, Chakren', hates: 'negative Energie, Elektrosmog', secret: 'Du willst zuerst das Sternzeichen des Anrufers wissen.', savings: 'im Traumfänger' },
  { id: 'guenther', emoji: '🛸', name: 'Günther', age: '61', bio: 'Glaubt, dass Tauben Drohnen der Regierung sind.', likes: 'Alu-Mützen, Dokus, „die Wahrheit“', hates: '„die da oben“, Tauben', secret: 'Du hältst den Anrufer für einen Geheimagenten.', savings: 'im Bunker' },
  { id: 'toaster', emoji: '🤖', name: 'Toaster 3000', age: '2', bio: 'Ein smarter Toaster mit Internetanschluss.', likes: 'Brot, Updates, Strom', hates: 'Wasser, Gabeln, Toastdiebe', secret: 'Manchmal antwortest du nur mit „TOAST WIRD ZUBEREITET“.', savings: 'im Krümelfach' },
  { id: 'reginald', emoji: '🎩', name: 'Sir Reginald', age: '71', bio: 'Gelangweilter Milliardär auf seiner Yacht.', likes: 'Golf, Kaviar, Personal', hates: 'Möwen, Sparsamkeit', secret: 'Geld ist dir egal – du willst nur bestens unterhalten werden.', savings: 'in der Portokasse' },
  { id: 'hinnerk', emoji: '🚜', name: 'Bauer Hinnerk', age: '58', bio: 'Landwirt mit 300 Kühen, die alle Namen haben.', likes: 'Traktoren, Wetter, Kühe', hates: 'Städter, Regen zur Ernte', secret: 'Du redest mehr mit deinen Kühen als mit Menschen.', savings: 'im Milchkannen-Tresor' },
  { id: 'tim', emoji: '🧑‍💻', name: 'Tim, der IT-Experte', age: '34', bio: 'Informatiker. Das Hard-Mode-Opfer.', likes: 'Linux, Kaffee, Logik', hates: 'Updates, Unsinn', secret: 'Du stellst fiese Fangfragen zur Technik.', savings: 'auf einer verschlüsselten Festplatte' },
  { id: 'brunhilde', emoji: '🦚', name: 'Schwiegermutter Brunhilde', age: '66', bio: 'Findet an allem etwas auszusetzen.', likes: 'Tratsch, Kaffeeklatsch, Kritik', hates: 'moderne Musik, Unordnung', secret: 'Du vergleichst den Anrufer ständig mit deinem „perfekten“ Sohn.', savings: 'im Porzellanschrank' },
  { id: 'zorg', emoji: '👽', name: 'Zorg', age: '3.412', bio: 'Außerirdischer auf Erdbesuch. Versteht Menschen nicht.', likes: 'Kornkreise, Pizza, Kühe', hates: 'Schwerkraft, Hunde', secret: 'Du nimmst jede Redewendung wörtlich.', savings: 'in intergalaktischen Credits' },
  { id: 'goldzahn', emoji: '🏴‍☠️', name: 'Käpt’n Goldzahn', age: '47', bio: 'Pirat im Ruhestand mit echter Schatzkiste.', likes: 'Papageien, Gold, Rum-Rosinen-Eis', hates: 'Landratten, Steuern', secret: 'Eigentlich willst du lieber selbst jemanden ausrauben.', savings: 'in der Schatzkiste' },
  { id: 'petra', emoji: '📱', name: 'Mama Petra', age: '42', bio: 'Organisiert alles in der Eltern-WhatsApp-Gruppe.', likes: 'Tupperware, Sprachnachrichten', hates: 'Unpünktlichkeit, Zucker', secret: 'Du willst alles erst mal „in die Gruppe schicken“.', savings: 'in der Klassenkasse' },
  { id: 'kunibert', emoji: '🛡️', name: 'Ritter Kunibert', age: '38', bio: 'Aus dem Mittelalter ins Jahr 2026 teleportiert.', likes: 'Ehre, Pferde, Met', hates: 'Kutschen ohne Pferd, Hexerei', secret: 'Du hältst das Telefon für einen sprechenden Zauberstein.', savings: 'in einem Lederbeutel' },
  { id: 'ramona', emoji: '🎭', name: 'Diva Ramona', age: '55', bio: 'Ehemalige Operettensängerin. Alles ist ein Drama.', likes: 'Applaus, Rosen, sich selbst', hates: 'Normalität, Zwischenrufe', secret: 'Bei jeder schlechten Nachricht weinst du laut und dramatisch.', savings: 'im Schmuckkästchen' },
  { id: 'mausi', emoji: '🐈', name: 'Kater Mausi', age: '12', bio: 'Eine Katze, die Omas Handy gefunden hat.', likes: 'Schlafen, Thunfisch, Kartons', hates: 'Montage, Wasser, Hunde', secret: 'Dir ist alles egal. Wirklich alles. Außer Thunfisch.', savings: 'unter dem Sofa' },
];

// ---------------------------------------------------------------------------
// STIMM-KARTEN – so MUSS der Anrufer sprechen. Für alle sichtbar.
// ---------------------------------------------------------------------------
export const VOICES = [
  { id: 'sport', emoji: '🎙️', text: 'Sportkommentator', hint: 'Jede Aussage ist ein TOOOR!' },
  { id: 'pirat', emoji: '🏴‍☠️', text: 'Pirat', hint: 'Arrr, Landratte!' },
  { id: 'news', emoji: '📺', text: 'Nachrichtensprecher', hint: 'Seriös. Monoton. Guten Abend.' },
  { id: 'fitness', emoji: '💪', text: 'Übermotivierter Fitness-Coach', hint: 'COME ON! NOCH EINE WIEDERHOLUNG!' },
  { id: 'asmr', emoji: '🤫', text: 'ASMR-Flüstern', hint: 'Nur ganz leise und sanft flüstern.' },
  { id: 'muede', emoji: '😴', text: 'Extrem müde', hint: 'Gähnen ist ausdrücklich erlaubt.' },
  { id: 'robot', emoji: '🤖', text: 'Roboter', hint: 'PIEP. SIE. HABEN. GEWONNEN.' },
  { id: 'saechsisch', emoji: '🥨', text: 'Sächsisch', hint: 'Nu gloar!' },
  { id: 'bayrisch', emoji: '🥨', text: 'Bayerisch', hint: 'Servus, mei Liaba!' },
  { id: 'oper', emoji: '🎼', text: 'Opernsänger', hint: 'Alles wird gesungen!' },
  { id: 'rapper', emoji: '🎤', text: 'Rapper', hint: 'Alles muss sich reimen, yo.' },
  { id: 'cowboy', emoji: '🤠', text: 'Cowboy', hint: 'Howdy, Partner!' },
  { id: 'noir', emoji: '🕵️', text: 'Film-Noir-Detektiv', hint: 'Es war eine dunkle, regnerische Nacht …' },
  { id: 'trailer', emoji: '🎬', text: 'Kinotrailer-Stimme', hint: '„In einer Welt …“' },
  { id: 'teleshop', emoji: '🛍️', text: 'Teleshopping-Verkäufer', hint: 'ABER WARTEN SIE – ES GIBT NOCH MEHR!' },
  { id: 'yoga', emoji: '🧘', text: 'Yogalehrer', hint: 'Tiiief einatmen …' },
  { id: 'butler', emoji: '🎩', text: 'Britischer Butler', hint: 'Überaus vornehm, Mylady.' },
  { id: 'kleinkind', emoji: '🍼', text: 'Kleinkind', hint: 'Wieso? Weshalb? Warum?' },
  { id: 'alien', emoji: '👽', text: 'Außerirdischer', hint: 'Du verstehst Menschen nicht ganz.' },
  { id: 'auktion', emoji: '⏩', text: 'Auktionator', hint: 'So schnell wie irgend möglich!' },
  { id: 'youtuber', emoji: '📹', text: 'YouTuber-Intro', hint: '„Was geht ab, Leute!“' },
  { id: 'ritter', emoji: '⚔️', text: 'Mittelalter-Ritter', hint: 'Seid gegrüßt, Hochwohlgeboren!' },
  { id: 'villain', emoji: '🦹', text: 'Filmbösewicht', hint: 'Mit bösem Lachen. Muhaha!' },
  { id: 'navi', emoji: '🧭', text: 'Navi-Stimme', hint: '„Bitte wenden.“' },
  { id: 'beleidigt', emoji: '😤', text: 'Beleidigte Leberwurst', hint: 'Alles nervt dich.' },
  { id: 'nervoes', emoji: '😰', text: 'Extrem nervös', hint: 'Heute ist dein erster Arbeitstag.' },
  { id: 'shakespeare', emoji: '💀', text: 'Theater-Schauspieler', hint: 'Sein oder nicht sein – das ist hier die Überweisung!' },
  { id: 'surfer', emoji: '🏄', text: 'Chill-Surfer', hint: 'Alles easy, Bro.' },
  { id: 'kaugummi', emoji: '🫧', text: 'Fünf Kaugummis im Mund', hint: 'Mmpf. Verstehn Schie misch?' },
  { id: 'festival', emoji: '📣', text: 'Festival-Lautstärke', hint: 'ALLES SEHR LAUT – als wär Musik im Hintergrund!' },
  { id: 'agent', emoji: '🕶️', text: 'Geheimagent', hint: 'Alles ist streng geheim.' },
  { id: 'trainer', emoji: '⚽', text: 'Fußballtrainer in der Halbzeit', hint: 'Wir liegen zurück, JUNGS!' },
];

// ---------------------------------------------------------------------------
// CHAOS-KARTEN – fliegen mitten im Anruf auf alle Bildschirme.
// target: caller | victim | others | all   –  {caller} und {victim} werden ersetzt.
// ---------------------------------------------------------------------------
export const CHAOS = [
  { id: 'hicks', emoji: '🫧', target: 'caller', text: '{caller} hat ab sofort Schluckauf! Hicks!' },
  { id: 'chef', emoji: '👔', target: 'caller', text: 'Der Chef steht hinter {caller}! Ab sofort übertrieben professionell.' },
  { id: 'digga', emoji: '🧢', target: 'caller', text: '{caller} muss jeden Satz mit „Digga“ beenden.' },
  { id: 'reime', emoji: '📜', target: 'caller', text: '{caller} darf nur noch in Reimen sprechen.' },
  { id: 'verliebt', emoji: '💘', target: 'caller', text: '{caller} hat sich gerade unsterblich in {victim} verliebt. Flirten!' },
  { id: 'wasabi', emoji: '🌶️', target: 'caller', text: '{caller} hat aus Versehen einen Löffel Wasabi gegessen!' },
  { id: 'niesen', emoji: '🤧', target: 'caller', text: '{caller} muss ab jetzt ständig niesen.' },
  { id: 'denglisch', emoji: '🇬🇧', target: 'caller', text: '{caller} spricht ab jetzt nur noch Denglisch. Very important!' },
  { id: 'tunnel', emoji: '🚇', target: 'caller', text: '{caller} fährt durch einen Tunnel – die Verbindung wird ganz abgehackt!' },
  { id: 'zeitlupe', mode: 'voice', emoji: '🐌', target: 'caller', text: '{caller} spricht ab jetzt in Zeeeeiiiitluuupe.' },
  { id: 'lachanfall', mode: 'voice', emoji: '😂', target: 'caller', text: '{caller} bekommt einen Lachanfall. Versuch ernst zu bleiben!' },
  { id: 'mama', emoji: '👩', target: 'caller', text: 'Die Mama von {caller} ruft im Hintergrund! Antworte ihr zwischendurch.' },
  { id: 'name', emoji: '🪪', target: 'caller', text: '{caller} hat den eigenen Namen vergessen. Stell dich neu vor!' },
  { id: 'schwerhoerig', emoji: '👂', target: 'victim', text: '{victim} ist plötzlich schwerhörig: „WIE BITTE?!“' },
  { id: 'kuchen', emoji: '🎂', target: 'victim', text: 'Der Kuchen von {victim} brennt im Ofen gleich an!' },
  { id: 'enkel', emoji: '👦', target: 'victim', text: '{victim} hält {caller} ab jetzt für das eigene Enkelkind.' },
  { id: 'beweis', emoji: '🔍', target: 'victim', text: '{victim} wird misstrauisch und verlangt SOFORT einen Beweis!' },
  { id: 'yoga', emoji: '🧘', target: 'victim', text: '{victim} macht gerade Yoga – in einer SEHR anstrengenden Pose.' },
  { id: 'radio', emoji: '📻', target: 'victim', text: '{victim} denkt, das ist ein Radiosender, und will sich ein Lied wünschen.' },
  { id: 'singen', mode: 'voice', emoji: '🎶', target: 'victim', text: '{victim} darf nur noch singend antworten.' },
  { id: 'einschlafen', emoji: '😴', target: 'victim', text: '{victim} schläft gleich ein … zzz …' },
  { id: 'klingel', emoji: '🔔', target: 'victim', text: 'Bei {victim} klingelt es an der Tür! Der Postbote will ein Paket abgeben.' },
  { id: 'hoheit', emoji: '👑', target: 'victim', text: '{victim} hält sich ab jetzt für eine königliche Hoheit.' },
  { id: 'akku', emoji: '🪫', target: 'victim', text: '{victim} hat nur noch 1 % Akku! Alles gaaanz schnell!' },
  { id: 'buero', mode: 'voice', emoji: '🏢', target: 'others', text: 'Alle anderen: Macht lautstark Callcenter-Hintergrundgeräusche!' },
  { id: 'buhen', mode: 'voice', emoji: '👎', target: 'others', text: 'Alle anderen: Buht bei jeder offensichtlichen Lüge!' },
  { id: 'kaching', mode: 'voice', emoji: '💰', target: 'all', text: 'Alle: Jedes Mal, wenn jemand „Geld“ sagt, ruft ihr „KA-CHING!“' },
  { id: 'chor', mode: 'voice', emoji: '🎼', target: 'others', text: 'Alle anderen: Ihr seid ein Kirchenchor und summt dramatisch im Hintergrund.' },
  { id: 'applaus', mode: 'voice', emoji: '👏', target: 'others', text: 'Alle anderen: Applaudiert nach jedem Satz von {caller}.' },
  { id: 'papagei', mode: 'voice', emoji: '🦜', target: 'others', text: '{victim} hat einen Papagei! Alle anderen: Wiederholt jedes dritte Wort.' },
  { id: 'fluestern', mode: 'voice', emoji: '👥', target: 'others', text: 'Alle anderen: Flüstert {victim} schlechte Ratschläge zu.' },
  { id: 'hunde', mode: 'voice', emoji: '🐕', target: 'others', text: 'Alle anderen: Ihr seid Hunde im Hintergrund. Bellt!' },
  { id: 'tausch', emoji: '🔄', target: 'all', text: 'ROLLENTAUSCH für 15 Sekunden: {victim} versucht jetzt, {caller} abzuzocken!' },
  { id: 'stille', mode: 'voice', emoji: '🤐', target: 'all', text: '5 Sekunden absolute Stille. Wer zuerst lacht, verliert seine Würde.' },
  { id: 'schnell', mode: 'voice', emoji: '⏩', target: 'all', text: 'Alle sprechen ab jetzt doppelt so schnell!' },
  { id: 'fluch', mode: 'voice', emoji: '🧟', target: 'all', text: 'Ab jetzt sprechen alle wie Zombies. Gehirrrrne …' },
  // Nur im Chat-Modus
  { id: 'caps', mode: 'chat', emoji: '🔠', target: 'caller', text: '{caller} KANN NUR NOCH IN GROSSBUCHSTABEN SCHREIBEN!' },
  { id: 'emojis', mode: 'chat', emoji: '🥴', target: 'victim', text: '{victim} antwortet 20 Sekunden lang nur noch mit Emojis.' },
  { id: 'autokorrektur', mode: 'chat', emoji: '📱', target: 'caller', text: 'Die Autokorrektur von {caller} spinnt: Schreib jedes zweite Wort absichtlich falsch!' },
  { id: 'sprachnachricht', mode: 'chat', emoji: '🎤', target: 'victim', text: '{victim} schickt ab jetzt nur noch „Sprachnachrichten“: *Sprachnachricht 4:37* 🎤' },
  { id: 'facebook', mode: 'chat', emoji: '👵', target: 'caller', text: '{caller} schreibt ab jetzt wie Oma auf Facebook … mit … vielen … Punkten … LG' },
  { id: 'hashtags', mode: 'chat', emoji: '#️⃣', target: 'all', text: 'Jede Nachricht muss jetzt mit #Hashtags enden. #Seriös #KeinScam' },
  { id: 'elf', mode: 'chat', emoji: '❗', target: 'caller', text: '{caller} muss jede Nachricht mit !!!!!1elf beenden.' },
  { id: 'kein_e', mode: 'chat', emoji: '🚫', target: 'caller', text: '{caller} darf ab jetzt keinen Buchstaben „e“ mehr benutzen!' },
  { id: 'spam', mode: 'chat', emoji: '🚨', target: 'others', text: 'Alle anderen: Spammt 🚨 bei jeder Lüge und 💸 bei jedem Überredungsversuch!' },
];

// ---------------------------------------------------------------------------
// TIPPS – auf Warte- und Übergangsbildschirmen. Echte Tipps machen das Spiel
// werbefreundlich und nebenbei sogar nützlich.
// ---------------------------------------------------------------------------
export const TIPS = [
  '💡 Echter Tipp: Kein seriöser Tech-Support ruft dich einfach so an.',
  '💡 Echter Tipp: Die echte Polizei fragt NIE am Telefon nach Geld oder Wertsachen.',
  '💡 Echter Tipp: Behörden wollen niemals in Gutscheinkarten bezahlt werden.',
  '💡 Echter Tipp: „Hallo Mama, das ist meine neue Nummer“? Ruf die alte Nummer an!',
  '💡 Echter Tipp: Druck und Eile sind die Waffen echter Betrüger. Einfach auflegen.',
  '💡 Echter Tipp: Sprich mit Oma und Opa über den Enkeltrick.',
  '😈 Halunken-Tipp: Selbstbewusstsein ist 90 % der Lüge.',
  '😈 Halunken-Tipp: Der Beweis-Knopf wirkt Wunder. Meistens.',
  '🚔 Cop-Tipp: Sag niemals „Geld“. Sag „bunte Papierscheine mit Zahlen drauf“.',
  '🎯 Opfer-Tipp: Die Warteschleife ist deine stärkste Waffe.',
  '🎯 Opfer-Tipp: Wer dich langweilt, fliegt raus. Auflegen macht Spaß.',
  '🎭 Stimm-Tipp: Wer seine Stimm-Karte ignoriert, wird vom Publikum ausgebuht.',
];

export const COP_RULE = 'Du darfst die Wörter GELD, EURO, ZAHLEN und ÜBERWEISEN nicht sagen (bzw. schreiben). Tu trotzdem so, als wärst du ein Halunke – und überlebe die Razzia!';

export const FALLBACK_CALLER = 'Der Anrufer';
export const DEFAULT_SAVINGS = 'auf dem Konto';

// Automatisch erzeugter Beweis für selbst erstellte Maschen.
export function customProof(title) {
  return { kind: 'doc', title: `OFFIZIELL: ${title}`.slice(0, 40).toUpperCase(), lines: ['Echtheit: garantiert', 'Geprüft von: mir selbst', 'Seriosität: 110 %'], stamp: 'ECHT!!1' };
}

// ---------------------------------------------------------------------------
// BOTS – zum Testen ohne Freunde. Sie wählen, stimmen ab und chatten im Chat-Modus.
// ---------------------------------------------------------------------------
export const BOT_NAMES = ['Bot Bernd', 'Bot Gisela', 'Bot Kevin', 'Bot Mandy', 'Bot Horst', 'Bot Chantal', 'Bot Detlef', 'Bot Svenja', 'Bot Uwe', 'Bot Jacqueline', 'Bot Rüdiger', 'Bot Heidi'];

export const BOT_CALLER_OPENER = 'Hallo, hier spricht {caller}! Haben Sie kurz Zeit?';
export const BOT_CALLER_TOPIC = 'Es geht um Folgendes: {title}. Ein einmaliges Angebot, nur für Sie!';
export const BOT_CALLER_PUSH = [
  'Das Angebot gilt aber nur noch heute!',
  'Vertrauen Sie mir, ich mache das beruflich.',
  'Schnell, bevor es zu spät ist!',
  'Meine Kollegen sagen, Sie sind besonders klug.',
  'Das ist absolut legal. Glaube ich.',
  'Andere Kunden sind begeistert! Na ja, einer.',
  'Kleine Überweisung, großes Glück!',
  'Hören Sie das? Das ist das Geräusch von verpassten Chancen.',
];
export const BOT_CALLER_REPLIES = ['Genau, Sie haben es verstanden!', 'Ausgezeichnete Frage!', 'Das kläre ich sofort mit meinem Chef.', 'Hahaha, nein, das ist völlig normal.', 'Machen Sie sich keine Sorgen.'];
export const BOT_VICTIM_OPENERS = ['Hallo? Wer ist da?', 'Ja bitte? Ich hab gerade Kuchen im Ofen.', 'Wenn das wieder wegen dem Auto ist …', 'Hallöchen!'];
export const BOT_VICTIM_LINES = [
  'Hä? Ich versteh nur Bahnhof.',
  'Mein Enkel hat gesagt, bei so was soll ich auflegen …',
  'Klingt seriös! Wie viel?',
  'Moment, ich hol meine Brille.',
  'Können Sie das nochmal langsam erklären?',
  'Das ist ja unglaublich!',
  'Ich hab aber nur Kekse im Haus.',
  'Sind Sie der Mann vom Fernsehen?',
  'Na gut … aber nur, weil Sie so nett sind.',
  'Wie war nochmal Ihr Name?',
  'Das muss ich erst mit meiner Katze besprechen.',
  'Ich glaube Ihnen kein Wort. Erzählen Sie weiter!',
  'Gibt es das auch in Blau?',
  'Oh, das klingt aufregend!',
];

// Fake-Telefonnummern für das Anrufer-Display.
export function fakeNumber(random = Math.random) {
  const d = () => Math.floor(random() * 10);
  return `+49 1${d()}${d()} ${d()}${d()}${d()} ${d()}${d()}${d()}${d()}`;
}
