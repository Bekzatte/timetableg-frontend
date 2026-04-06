# Frontend

Клиентская часть `TimeTableG` на `React + Vite`.

## Что делает frontend

- показывает страницы логина и регистрации
- отображает dashboard
- отображает разделы:
  - courses
  - teachers
  - rooms
  - schedule
- управляет переводами
- хранит текущего пользователя в `localStorage`
- отправляет запросы в backend API

## Стек

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React

## Запуск локально

```bash
npm install
npm run dev
```

По умолчанию frontend запускается на:

```text
http://localhost:5173
```

## Переменные окружения

Файл:

```text
frontend/.env
```

Пример:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Для другого ноутбука в сети:

```env
VITE_API_URL=http://192.168.1.25:8000/api
```

Для production:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

Если frontend размещен на Vercel, `VITE_API_URL` нужно добавить в настройках проекта Vercel.
Иначе production-сборка не сможет обращаться к backend на Render.

## Роли во frontend

### Admin

- видит `courses`, `teachers`, `rooms`, `schedule`
- может создавать, редактировать и удалять записи
- может генерировать расписание

### Teacher

- видит `home`, `schedule`
- может войти только в аккаунт роли `teacher`

### Student

- видит `home`, `schedule`
- может войти только в аккаунт роли `student`

## Регистрация

- `student` регистрируется с любым email
- `teacher` регистрируется только с email `@kazatu.edu.kz`
- `admin` не регистрируется публично

## Переводы

Поддерживаются языки:

- `ru`
- `kk`
- `en`

Файл переводов:

```text
frontend/src/i18n/translations.js
```

## Адаптивность

### Dashboard

- карточки адаптированы под мобильную версию

### CRUD-страницы

- на desktop данные показываются таблицей
- на mobile данные показываются карточками

Это относится к:

- courses
- teachers
- rooms

## Важные файлы

- `src/App.jsx` - маршруты, layout, header, footer
- `src/services/api.js` - API-клиент и обработка ошибок
- `src/contexts/AuthContext.jsx` - auth provider
- `src/pages/LoginPage.jsx` - логин
- `src/pages/RegisterPage.jsx` - регистрация
- `src/pages/Dashboard.jsx` - dashboard
- `src/pages/SchedulePage.jsx` - расписание

## Проверки

```bash
npm run build
npm run lint
```

## Что пока не закончено

- алгоритм составления расписания пока базовый и без сложных ограничений
