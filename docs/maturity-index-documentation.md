# MaturityIndex Component

## Overview

Il componente `MaturityIndex` è un componente React riutilizzabile che visualizza l'indice di maturità geometrica dei componenti di un progetto. Supporta tre varianti di visualizzazione (extended, compact, minimal) ed è completamente localizzato con next-intl.

## Location

```
src/components/shared/MaturityIndex.tsx
```

## Features

- 📊 **Visualizzazione multi-stato**: Supporta fino a 6 stati diversi (OTOP, OT, KO, NEW, INCOMPLETE, NOT_OFF_TOOL)
- 🎨 **3 varianti responsive**: Extended (card completa), Compact (barra con labels), Minimal (badge/testo)
- 🌍 **Multilingua**: Completamente integrato con next-intl per supporto i18n
- 🎯 **Tooltip informativi**: Definizioni dettagliate per OTOP e OT con icone informative
- 📈 **Indicatori di trend**: Supporto opzionale per visualizzare trend up/down/stable
- 🌙 **Dark mode**: Palette colori ottimizzata per light e dark mode
- ♿ **Accessibile**: Tooltip e colori ad alto contrasto per accessibilità

## Import

```typescript
import { MaturityIndex, MaturityIndexData } from '@/components/shared/MaturityIndex';
```

## Props

### MaturityIndexProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `MaturityIndexData` | Required | Dati dell'indice di maturità |
| `variant` | `'extended' \| 'compact' \| 'minimal'` | `'extended'` | Variante di visualizzazione |
| `showLabels` | `boolean` | `true` | Mostra labels OTOP/OT/KO (solo compact) |
| `showTrend` | `boolean` | `true` | Mostra indicatore di trend |
| `showDetails` | `boolean` | `true` | Mostra dettagli estesi (solo extended) |
| `className` | `string` | `undefined` | Classi CSS aggiuntive |
| `title` | `string` | `undefined` | Titolo personalizzato |
| `hideTitle` | `boolean` | `false` | Nasconde il titolo |

### MaturityIndexData

```typescript
interface MaturityIndexData {
  otop: number;        // Percentuale OTOP (0-100)
  ot: number;          // Percentuale OT (0-100)
  ko: number;          // Percentuale KO (0-100)
  new?: number;        // Percentuale NEW (opzionale)
  incomplete?: number; // Percentuale INCOMPLETE (opzionale)
  notOffTool?: number; // Percentuale NOT_OFF_TOOL (opzionale)
  trend?: 'up' | 'down' | 'stable'; // Trend opzionale
  trendValue?: number; // Valore del trend (+/- percentuale)
  lastUpdated?: Date;  // Data ultimo aggiornamento
}
```

## Variants

### Extended (Default)
Card completa con barra di progresso, dettagli per ogni stato, icone informative e trend.

```typescript
<MaturityIndex 
  data={data}
  variant="extended"
/>
```

### Compact
Barra di progresso con labels opzionali, ideale per tabelle e liste.

```typescript
<MaturityIndex 
  data={data}
  variant="compact"
  showLabels={true}
  hideTitle={false}
/>
```

### Minimal
Due sottovarianti basate su `hideTitle`:
- **Badge style** (default): Badge colorato con stato dominante
- **Text only** (`hideTitle={true}`): Solo testo con percentuale OTOP

```typescript
// Badge style
<MaturityIndex 
  data={data}
  variant="minimal"
/>

// Text only
<MaturityIndex 
  data={data}
  variant="minimal"
  hideTitle={true}
/>
```

## Usage Examples

### Basic Usage

```typescript
const data: MaturityIndexData = {
  otop: 45,
  ot: 30,
  ko: 25
};

<MaturityIndex data={data} />
```

### In a Project Table

```typescript
// In columns definition
{
  id: 'maturity_index',
  header: () => <div>Maturity Index</div>,
  cell: ({ row }) => {
    const project = row.original;
    const maturityData: MaturityIndexData = {
      otop: project.otop_percentage,
      ot: project.ot_percentage,
      ko: project.ko_percentage,
    };

    return (
      <div className="w-48">
        <MaturityIndex 
          data={maturityData}
          variant="compact"
          showLabels={true}
          showTrend={false}
          hideTitle={true}
        />
      </div>
    );
  },
}
```

### In a Dashboard Card

```typescript
const ProjectCard = ({ project }) => {
  const maturityData: MaturityIndexData = {
    otop: project.otop_percentage,
    ot: project.ot_percentage,
    ko: project.ko_percentage,
    trend: project.trend,
    trendValue: project.trendValue,
    lastUpdated: new Date(project.last_accessed)
  };

  return (
    <Card>
      <CardContent>
        <MaturityIndex 
          data={maturityData}
          variant="compact"
          showLabels={false}
        />
      </CardContent>
    </Card>
  );
};
```

### With All States

```typescript
const fullData: MaturityIndexData = {
  otop: 35,
  ot: 20,
  ko: 15,
  new: 10,
  incomplete: 10,
  notOffTool: 10,
  trend: 'up',
  trendValue: 5.2,
  lastUpdated: new Date()
};

<MaturityIndex 
  data={fullData}
  variant="extended"
  title="Project X - Maturity Status"
/>
```

## Color Palette

I colori sono definiti come variabili CSS in `globals.css`:

```css
:root {
  --maturity-otop: 96 60% 52%;      /* Verde scuro */
  --maturity-ot: 74 89% 47%;        /* Verde lime */
  --maturity-ko: 0 96% 62%;         /* Rosso */
  --maturity-incomplete: 26 100% 59%; /* Arancione */
  --maturity-new: 203 78% 70%;      /* Blu chiaro */
  --maturity-not-off-tool: 0 0% 45%; /* Grigio */
}

.dark {
  --maturity-otop: 96 65% 45%;
  --maturity-ot: 74 85% 55%;
  --maturity-ko: 0 90% 58%;
  --maturity-incomplete: 26 95% 55%;
  --maturity-new: 203 70% 65%;
  --maturity-not-off-tool: 0 0% 60%;
}
```

## Internationalization

Il componente utilizza next-intl per le traduzioni. Le chiavi di traduzione sono definite in:

- `src/i18n/messages/it.json` - Italiano
- `src/i18n/messages/en.json` - Inglese

### Translation Keys

```json
{
  "maturityIndex": {
    "title": "Maturity Index",
    "description": "...",
    "breakdown": "Status Breakdown",
    "otopDescription": "Fully compliant",
    "otDescription": "Compliant with reservations",
    "koDescription": "Non-compliant",
    "new": "New",
    "incomplete": "Incomplete Data",
    "notOffTool": "Not Off Tool",
    "otherStatuses": "Other Statuses",
    "lastUpdated": "Last updated",
    "trend": "Trend",
    "otopFullName": "Off Tool Off Process",
    "otFullName": "Off Tool",
    "otopDefinition": "...",
    "otDefinition": "..."
  }
}
```

## Status Definitions

### OTOP (Off Tool Off Process)
Componenti conformi per dimensioni e con processo produttivo di serie, stabile e capace (Cp/Cpk ≥ 1.33).

### OT (Off Tool)
Componenti presso toolmaker, conformi al disegno per dimensioni. La stabilità del processo produttivo non è ancora verificata.

### KO
Componenti non conformi che richiedono azioni correttive.

### NEW
Componenti nuovi non ancora valutati.

### INCOMPLETE
Componenti con dati di valutazione incompleti.

### NOT OFF TOOL
Componenti non ancora in fase Off Tool.

## Dependencies

- `react` - React 18+
- `next-intl` - Per internazionalizzazione
- `@/components/ui/tooltip` - Componente Tooltip di shadcn/ui
- `@/components/ui/card` - Componente Card di shadcn/ui
- `@/components/ui/badge` - Componente Badge di shadcn/ui
- `lucide-react` - Per le icone
- `@/lib/utils` - Utility function `cn` per classi CSS

## Performance Considerations

- Il componente utilizza `transition-all duration-300` per animazioni fluide
- I tooltip sono lazy-loaded solo quando necessari
- La variante minimal è ottimizzata per rendering in liste lunghe

## Accessibility

- Tutti i colori hanno contrasto WCAG AA compliant
- Tooltip accessibili con keyboard navigation
- Icone informative con aria-labels appropriati
- Supporto completo per screen readers

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Supporto completo per mobile browsers

## Future Enhancements

- [ ] Animazioni di transizione tra stati
- [ ] Export dei dati in CSV/PDF
- [ ] Grafici storici del trend
- [ ] Configurazione colori personalizzati via props
- [ ] Integrazione con sistema di notifiche per soglie critiche

## Related Components

- `StackedProgressBar` - Componente legacy da deprecare
- `ProjectCard` - Utilizza MaturityIndex in modalità compact
- `ProjectTable` - Utilizza MaturityIndex nelle colonne

## Changelog

### v1.0.0 (2024-12)
- Initial release
- Tre varianti di visualizzazione
- Supporto multilingua
- Tooltip informativi per OTOP/OT
- Palette colori personalizzata
- Dark mode support