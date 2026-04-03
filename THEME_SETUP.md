# Theme System - Справочный файл

## Описание

Приложение TimeTable использует систему тем (Light/Dark mode) через React Context API.

## Архитектура

### Файлы

- `src/contexts/ThemeContext.jsx` - Context для управления темой
- `src/index.css` - CSS переменные для тем

### Использование в компонентах

```javascript
import { useTheme } from "../contexts/ThemeContext";

export const MyComponent = () => {
  const { theme } = useTheme();

  return (
    <div className={theme === "dark" ? "bg-[#1A1F2E]" : "bg-white"}>
      Контент
    </div>
  );
};
```

## Цветовая схема

### Light Theme

- Background: `bg-white`, `bg-gray-50`
- Text: `text-gray-900`, `text-gray-700`
- Header: `bg-gradient-to-r from-[#0066B2] to-[#00418C]`

### Dark Theme

- Background: `bg-[#1A1F2E]`
- Text: `text-white`, `text-gray-300`
- Header: `bg-[#0D1B2F]`
- Sections: `bg-[#252B3A]`

## Классы Tailwind для тем

```javascript
// Пример
className={`
  ${theme === "dark"
    ? "bg-[#252B3A] text-gray-300 border-gray-700"
    : "bg-white text-gray-900 border-gray-200"
  }
`}
```

## Как добавить переключение темы (если понадобится)

### 1. В App.jsx импортировать иконки

```javascript
import { Moon, Sun } from "lucide-react";
```

### 2. Использовать toggleTheme

```javascript
const { theme, toggleTheme } = useTheme();
```

### 3. Добавить кнопку

```javascript
<button
  onClick={toggleTheme}
  className={`p-2 rounded-lg transition ${
    theme === "dark"
      ? "bg-yellow-400 text-blue-900"
      : "bg-white bg-opacity-10 text-white"
  }`}
>
  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
</button>
```

## Состояние

- ✅ Тема автоматически сохраняется в localStorage
- ✅ Тема применяется на все компоненты
- ✅ Поддерживаются Light и Dark режимы

## Примечание

Переключение темы было убрано из интерфейса, но система остаётся активной.
Для включения - следуйте инструкциям выше.
