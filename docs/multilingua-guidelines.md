# 🌍 Sistema Multilingua - Linee Guida Obbligatorie

## ⚠️ IMPORTANTE: OGNI NUOVA PAGINA O COMPONENTE DEVE SEGUIRE QUESTE REGOLE

## 📋 Configurazione Attuale

### Stack Tecnologico
- **Framework i18n**: `next-intl` v4.3.4
- **Lingue supportate**: Italiano (`it`) e Inglese (`en`)
- **Lingua di fallback**: Inglese (`en`)
- **Auto-detection**: Abilitata (basata sul browser)
- **Routing**: Locale sempre nell'URL (`/it/...` o `/en/...`)

### File di Configurazione
- **Config principale**: `src/i18n/config.ts`
- **Middleware**: `src/middleware.ts`
- **Traduzioni**: `src/i18n/messages/[locale].json`

## 🚨 REGOLE OBBLIGATORIE PER OGNI SVILUPPO

### 1. MAI Usare Testi Hardcoded

❌ **SBAGLIATO:**
```tsx
<h1>Welcome to Dashboard</h1>
<p>Please login to continue</p>
<Button>Submit</Button>
```

✅ **CORRETTO:**
```tsx
const t = useTranslations('dashboard');
const tCommon = useTranslations('common');

<h1>{t('welcome')}</h1>
<p>{t('loginPrompt')}</p>
<Button>{tCommon('submit')}</Button>
```

### 2. Struttura dei Component

#### Per Client Components:
```tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('namespace');
  const locale = useLocale();
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href={`/${locale}/some-page`}>
        {t('linkText')}
      </Link>
    </div>
  );
}
```

#### Per Server Components:
```tsx
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function MyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('namespace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

### 3. Navigazione e Link

#### SEMPRE includere la locale nei link:
```tsx
// ❌ SBAGLIATO
<Link href="/dashboard">Dashboard</Link>

// ✅ CORRETTO - Client Component
const locale = useLocale();
<Link href={`/${locale}/dashboard`}>Dashboard</Link>

// ✅ CORRETTO - Server Component
<Link href={`/${locale}/dashboard`}>Dashboard</Link>
```

### 4. Form e Validazione

#### Messaggi di errore sempre tradotti:
```tsx
const tValidation = useTranslations('validation');

const formSchema = z.object({
  email: z.string().email({
    message: tValidation('email'), // Non hardcoded!
  }),
  password: z.string().min(8, {
    message: tValidation('minLength', { min: 8 }),
  }),
});
```

### 5. Struttura File JSON Traduzioni

#### Aggiungi sempre traduzioni in ENTRAMBI i file:
- `src/i18n/messages/en.json`
- `src/i18n/messages/it.json`

#### Struttura standard:
```json
{
  "common": {
    "save": "Save/Salva",
    "cancel": "Cancel/Annulla",
    "delete": "Delete/Elimina"
  },
  "nomeComponente": {
    "title": "Component Title/Titolo Componente",
    "description": "Description/Descrizione"
  }
}
```

## 📁 Struttura File per Nuove Pagine

```
src/
  app/
    [locale]/
      (app)/
        nuova-pagina/
          page.tsx       # DEVE gestire params.locale
          layout.tsx     # Se necessario, DEVE gestire params.locale
  components/
    nuova-feature/
      component.tsx      # DEVE usare useTranslations()
  i18n/
    messages/
      en.json           # DEVE contenere tutte le nuove chiavi
      it.json           # DEVE contenere tutte le nuove chiavi
```

## 🔧 Hook e Utility Disponibili

### Hook da Usare:
```tsx
import { useTranslations, useLocale } from 'next-intl';
import { useLanguage } from '@/hooks/useLanguage'; // Per cambio lingua

// NON USARE MAI:
// import { useI18n } from '@/contexts/I18nContext'; // DEPRECATO, NON ESISTE PIÙ
```

### Per Server Components:
```tsx
import { getTranslations, getMessages } from 'next-intl/server';
```

## 🚫 ERRORI COMUNI DA EVITARE

1. **NON creare un proprio sistema i18n** - Usa solo next-intl
2. **NON usare I18nProvider** - È stato rimosso, usa NextIntlClientProvider
3. **NON hardcodare '/en/' o '/it/'** - Usa sempre la variabile locale
4. **NON dimenticare traduzioni** - Aggiungi SEMPRE in entrambi i file JSON
5. **NON mixare Server e Client Components** con traduzioni - Scegli uno

## ✅ Checklist per Nuove Feature

Prima di fare commit, verifica:

- [ ] Nessun testo hardcoded nel codice
- [ ] Traduzioni aggiunte in `en.json`
- [ ] Traduzioni aggiunte in `it.json`
- [ ] Link includono `/${locale}/`
- [ ] Form validation usa traduzioni
- [ ] Testato cambio lingua funzionante
- [ ] Nessun errore console browser
- [ ] Component usa `useTranslations()` o `getTranslations()`

## 📝 Template per Nuovi Componenti

### Client Component Template:
```tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export function NuovoComponente() {
  const t = useTranslations('nuovoComponente');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Link href={`/${locale}/percorso`}>
        {tCommon('goBack')}
      </Link>
    </div>
  );
}
```

### Server Component Template:
```tsx
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NuovaPagina({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('nuovaPagina');
  const tCommon = await getTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <Link href={`/${locale}/altra-pagina`}>
        {tCommon('continue')}
      </Link>
    </div>
  );
}
```

## 🆘 Troubleshooting

### Errore: "MISSING_MESSAGE"
- Aggiungi la chiave mancante in entrambi i file JSON
- Verifica il namespace sia corretto

### Errore: "Cannot read locale"
- Verifica di usare useLocale() non useI18n()
- Per Server Components usa params.locale

### Traduzioni non cambiano
- Verifica che il componente usi useTranslations
- Controlla che l'URL contenga la locale corretta
- Pulisci cache browser (Ctrl+Shift+R)

## 📚 Riferimenti

- [next-intl docs](https://next-intl-docs.vercel.app/)
- File esempio: `src/app/[locale]/page.tsx`
- Hook personalizzato: `src/hooks/useLanguage.tsx`
- Config: `src/i18n/config.ts`

---

## ⚡ REGOLA D'ORO

> **"Se vedi un testo hardcoded, è un bug!"**

Ogni stringa visibile all'utente DEVE passare attraverso il sistema di traduzione.