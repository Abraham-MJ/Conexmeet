# Guía de Implementación de Traducciones

## Sistema de Internacionalización (i18n) Implementado

Se ha implementado un sistema simple de traducciones que permite cambiar entre Español e Inglés en toda la aplicación.

## Archivos Creados/Modificados

### 1. Contexto de Idioma
- `app/context/useLanguageContext.tsx` - Contexto principal para manejar el idioma
- `app/hooks/useTranslation.ts` - Hook personalizado para facilitar el uso
- `app/types/translations.ts` - Tipos TypeScript para las traducciones

### 2. Modal de Traducción
- `app/components/shared/modals/ModalTranslate.tsx` - Actualizado para usar el sistema de traducciones

### 3. Layout Principal
- `app/layout.tsx` - Agregado el LanguageProvider

## Cómo Usar las Traducciones

### En cualquier componente:

```tsx
import { useTranslation } from '../hooks/useTranslation';

const MiComponente = () => {
  const { t, language, setLanguage, isSpanish } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <p>Idioma actual: {language}</p>
      {isSpanish && <span>Contenido solo en español</span>}
    </div>
  );
};
```

### Agregar nuevas traducciones:

1. Edita `app/context/useLanguageContext.tsx`
2. Agrega las claves en ambos idiomas (es/en)
3. Actualiza `app/types/translations.ts` con las nuevas claves

Ejemplo:
```tsx
const translations = {
  es: {
    // Existentes...
    'header.welcome': 'Bienvenido',
    'button.save': 'Guardar',
  },
  en: {
    // Existentes...
    'header.welcome': 'Welcome',
    'button.save': 'Save',
  },
};
```

## Funcionalidades del Modal de Traducción

- Muestra el idioma actual con estilo destacado
- Permite cambiar entre Español e Inglés
- Guarda la preferencia en localStorage
- Se cierra automáticamente al seleccionar un idioma

## Próximos Pasos Recomendados

1. **Agregar más traducciones**: Identifica textos en tu aplicación que necesiten traducción
2. **Traducir componentes existentes**: Usa el hook `useTranslation()` en componentes que tengan texto hardcodeado
3. **Mejorar el sistema**: Considera agregar más idiomas o cargar traducciones desde archivos JSON externos

## Ejemplo de Implementación en un Componente Existente

Si tienes un componente como este:
```tsx
const MiComponente = () => {
  return (
    <div>
      <h1>Bienvenido</h1>
      <button>Guardar</button>
    </div>
  );
};
```

Lo actualizarías así:
```tsx
import { useTranslation } from '../hooks/useTranslation';

const MiComponente = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('header.welcome')}</h1>
      <button>{t('button.save')}</button>
    </div>
  );
};
```