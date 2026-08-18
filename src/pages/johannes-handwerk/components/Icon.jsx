import * as Icons from 'lucide-react';

// Löst einen Icon-Namen (String, aus data.js) in die passende
// lucide-react-Komponente auf. Zentral gehalten, damit Icon-Namen
// in den Datenobjekten bleiben statt Komponenten-Importe zu verstreuen.
export default function Icon({ name, className, ...props }) {
  const Cmp = Icons[name];
  if (!Cmp) return null;
  return <Cmp className={className} aria-hidden="true" {...props} />;
}
