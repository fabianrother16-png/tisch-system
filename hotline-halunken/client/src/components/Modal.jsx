import { useEffect } from 'react';

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Rules() {
  return (
    <div className="rules">
      <p className="rules-lead">
        Willkommen bei der <b>Halunken GmbH</b>, dem unseriösesten Callcenter der Welt. Heute ist euer erster Arbeitstag.
      </p>
      <ol className="rules-steps">
        <li>
          <span className="rules-icon">🎯</span>
          <div>
            <b>Ein Spieler ist das Opfer.</b> Er bekommt eine Rolle (z. B. <i>Oma Gertrud, 84</i> oder <i>Graf Dracula</i>) und ein
            Konto mit Erspartem. Das Opfer wechselt jede Runde.
          </div>
        </li>
        <li>
          <span className="rules-icon">😈</span>
          <div>
            <b>Alle anderen sind Halunken.</b> Jeder wählt eine absurde Masche (Winzigweich-Support, Mond-Grundstücke, OmaCoin …)
            und bekommt eine <b>Pflicht-Stimme</b> – z. B. Pirat oder Sportkommentator.
          </div>
        </li>
        <li>
          <span className="rules-icon">📞</span>
          <div>
            <b>Nacheinander ruft jeder Halunke das Opfer an</b> (per Voice-Chat, z. B. Discord – oder im selben Raum). Das Opfer kann
            live Geld überweisen, das Vertrauen hoch- und runterdrehen, dich in die <b>Warteschleife</b> schicken oder
            <b> AUFLEGEN</b>. Jeder überwiesene Euro ist deine Beute.
          </div>
        </li>
        <li>
          <span className="rules-icon">⚡</span>
          <div>
            <b>Chaos-Karten</b> fliegen mitten im Gespräch rein: Schluckauf, Rollentausch, Papagei … Wer sich nicht dran hält, wird
            ausgebuht.
          </div>
        </li>
        <li>
          <span className="rules-icon">🚔</span>
          <div>
            <b>Einer der Anrufer ist ein Undercover-Cop</b> (ab 4 Spielern). Er darf <b>nie</b> „Geld“, „Euro“, „zahlen“ oder
            „überweisen“ sagen. Nach den Anrufen kommt die <b>Razzia</b>: Alle stimmen ab, wer der Cop ist. Richtig getippt gibt
            Bonus – entkommt der Cop, <b>beschlagnahmt</b> er die Beute des reichsten Halunken!
          </div>
        </li>
        <li>
          <span className="rules-icon">🏆</span>
          <div>
            Wer am Ende die meiste Beute hat, wird <b>Mitarbeiter des Monats</b>. Dazu gibt es Awards wie „Tuut-Tuut-Legende“ und
            „Justizirrtum“.
          </div>
        </li>
      </ol>
      <div className="rules-tip">
        <b>Für Streamer:</b> Zuschauer können mit dem Raumcode als <b>Publikum</b> beitreten, live mit Emojis reagieren und bei der
        Razzia mittippen. Der <b>Streamer-Modus</b> (🎥 oben) versteckt den Raumcode.
      </div>
      <p className="rules-disclaimer">
        Das ist eine Parodie. Echte Betrugsanrufe sind kein Spaß: Im echten Leben einfach auflegen und im Zweifel die 110 anrufen.
      </p>
    </div>
  );
}
