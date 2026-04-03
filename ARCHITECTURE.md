# Frontend Architecture

Этот файл объясняет frontend полностью: какие файлы есть, кто за что отвечает и куда вносить изменения.

## Общая схема

Frontend построен на:

- `React`
- `Vite`
- `React Router`
- `Axios`
- `Tailwind CSS`

Поток обычно такой:

1. приложение стартует через `main.jsx`
2. провайдеры оборачивают всё приложение
3. `App.jsx` задаёт layout и маршруты
4. страницы используют компоненты, hooks и API-сервис

## Точка входа

### [src/main.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/main.jsx)

Это точка входа frontend.

Отвечает за:

- рендер React-приложения
- подключение глобальных провайдеров:
  - `ThemeProvider`
  - `LanguageProvider`
  - `AuthProvider`

Если приложение вообще не стартует, проверка обычно начинается отсюда.

## Основной layout и маршрутизация

### [src/App.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/App.jsx)

Это главный файл интерфейса.

Он отвечает за:

- header
- footer
- desktop и mobile navigation
- маршруты
- `RequireAuth`
- показ страниц по ролям

Именно здесь задаётся:

- какие маршруты доступны
- какие ссылки видит `admin`
- какие ссылки видит `teacher`
- какие ссылки видит `student`

Если нужно менять:

- меню
- footer
- доступ к страницам
- общий layout

смотри этот файл.

## Константы

### [src/constants/roles.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/constants/roles.js)

Здесь лежат роли:

- `admin`
- `teacher`
- `student`

Если меняется список ролей, это один из основных файлов.

## Contexts и hooks

Состояние frontend разделено на provider-файлы и hooks.

### Auth

#### [src/contexts/AuthContext.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/AuthContext.jsx)

Отвечает за:

- хранение текущего пользователя
- `login`
- `register`
- `logout`
- флаги:
  - `isAdmin`
  - `isTeacher`
  - `isStudent`

#### [src/contexts/AuthContextValue.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/AuthContextValue.js)

Содержит сам React context.

#### [src/hooks/useAuth.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/hooks/useAuth.js)

Это hook для доступа к auth context.

Если нужно менять auth-состояние frontend, смотри:

- `AuthContext.jsx`
- `useAuth.js`

### Language

#### [src/contexts/LanguageContext.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/LanguageContext.jsx)

Отвечает за:

- текущий язык
- сохранение языка в `localStorage`

#### [src/contexts/LanguageContextValue.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/LanguageContextValue.js)

Содержит React context языка.

#### [src/hooks/useLanguage.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/hooks/useLanguage.js)

Hook для доступа к language context.

### Theme

#### [src/contexts/ThemeContext.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/ThemeContext.jsx)

Сейчас тема фиксирована как `light`.

#### [src/contexts/ThemeContextValue.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/contexts/ThemeContextValue.js)

Содержит React context темы.

#### [src/hooks/useTheme.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/hooks/useTheme.js)

Hook для доступа к theme context.

### Переводы

#### [src/hooks/useTranslation.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/hooks/useTranslation.js)

Возвращает:

- `t(key)`
- `language`

#### [src/i18n/translations.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/i18n/translations.js)

Главный файл переводов.

Поддерживаются:

- `ru`
- `kk`
- `en`

Если нужно добавлять новые тексты или ошибки на 3 языках, меняй этот файл.

## API-слой

### [src/services/api.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/services/api.js)

Это главный файл общения с backend.

Он отвечает за:

- `axios` instance
- `VITE_API_URL`
- auth token interceptor
- обработку ошибок
- локализацию backend-ошибок
- API-объекты:
  - `courseAPI`
  - `teacherAPI`
  - `roomAPI`
  - `scheduleAPI`
  - `authAPI`

Если нужно:

- поменять backend URL
- поменять обработку ошибок
- добавить новый endpoint

смотри сюда.

## Hooks для загрузки данных

### [src/hooks/useAPI.js](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/hooks/useAPI.js)

Отвечает за вспомогательную логику работы с async API.

Основной hook:

- `useFetch`

Он используется в manager-компонентах и на страницах.

## Страницы

### [src/pages/LoginPage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/LoginPage.jsx)

Отвечает за:

- вход
- выбор роли при входе
- форму email/password

### [src/pages/RegisterPage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/RegisterPage.jsx)

Отвечает за:

- регистрацию
- выбор роли `student/teacher`
- проверку паролей на frontend
- подсказку про `@kazatu.edu.kz`

### [src/pages/Dashboard.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/Dashboard.jsx)

Это главная страница после входа.

Отвечает за:

- карточки разделов
- dashboard summary UI

### [src/pages/CoursesPage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/CoursesPage.jsx)

Страница-обёртка для менеджера курсов.

### [src/pages/TeachersPage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/TeachersPage.jsx)

Страница-обёртка для менеджера преподавателей.

### [src/pages/RoomsPage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/RoomsPage.jsx)

Страница-обёртка для менеджера аудиторий.

### [src/pages/SchedulePage.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/pages/SchedulePage.jsx)

Главная страница расписания.

Отвечает за:

- отображение расписания
- открытие модалки генерации расписания для `admin`

## Компоненты

### CRUD manager-компоненты

#### [src/components/courses/CourseManager.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/courses/CourseManager.jsx)

Отвечает за:

- список курсов
- создание курса
- редактирование курса
- удаление курса

#### [src/components/teachers/TeacherManager.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/teachers/TeacherManager.jsx)

Отвечает за:

- список преподавателей
- создание преподавателя
- редактирование преподавателя
- удаление преподавателя

#### [src/components/rooms/RoomManager.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/rooms/RoomManager.jsx)

Отвечает за:

- список аудиторий
- создание аудитории
- редактирование аудитории
- удаление аудитории

### UI-компоненты

#### [src/components/ui/DataTable.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/ui/DataTable.jsx)

Универсальный компонент вывода данных.

Сейчас он делает:

- desktop table
- mobile cards
- edit/delete actions

Если нужно менять адаптивность `courses / teachers / rooms`, смотри сюда.

#### [src/components/ui/Form.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/ui/Form.jsx)

Универсальная форма для модалок и CRUD.

Отвечает за:

- input
- textarea
- select
- локальные ошибки формы

Если нужно менять общую логику форм, это основной файл.

#### [src/components/ui/Modal.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/ui/Modal.jsx)

Универсальное модальное окно.

### Расписание

#### [src/components/timetable/TimetableGrid.jsx](/Users/bekzatbaibolat05/Desktop/TimeTableG/frontend/src/components/timetable/TimetableGrid.jsx)

Отвечает за таблицу расписания.

Тут меняются:

- отображение дней
- отображение времени
- вид ячеек расписания

## Поток данных

### Пример: логин

1. пользователь открывает `LoginPage`
2. нажимает `Войти`
3. `LoginPage` вызывает `login(...)` из `AuthContext`
4. `AuthContext` вызывает `authAPI.login(...)`
5. `api.js` отправляет запрос в backend
6. если всё ок, пользователь сохраняется в `localStorage`
7. `App.jsx` начинает показывать маршруты по роли

### Пример: список преподавателей

1. открывается `TeachersPage`
2. внутри работает `TeacherManager`
3. `TeacherManager` вызывает `teacherAPI.getAll`
4. данные приходят из backend
5. `DataTable` рендерит desktop table или mobile cards

### Пример: генерация расписания

1. `admin` открывает `SchedulePage`
2. нажимает `Generate`
3. `SchedulePage` вызывает `scheduleAPI.generate`
4. backend генерирует расписание
5. `TimetableGrid` отображает результат

## Куда лезть в зависимости от задачи

### Нужно поменять логин или регистрацию

Смотри:

- `pages/LoginPage.jsx`
- `pages/RegisterPage.jsx`
- `contexts/AuthContext.jsx`
- `services/api.js`

### Нужно поменять переводы

Смотри:

- `i18n/translations.js`

### Нужно поменять маршруты и доступ по ролям

Смотри:

- `App.jsx`
- `constants/roles.js`

### Нужно поменять CRUD по курсам/преподавателям/аудиториям

Смотри:

- `components/courses/CourseManager.jsx`
- `components/teachers/TeacherManager.jsx`
- `components/rooms/RoomManager.jsx`
- `components/ui/Form.jsx`
- `components/ui/DataTable.jsx`

### Нужно поменять расписание UI

Смотри:

- `pages/SchedulePage.jsx`
- `components/timetable/TimetableGrid.jsx`

### Нужно поменять mobile/desktop поведение таблиц

Смотри:

- `components/ui/DataTable.jsx`

### Нужно добавить новый backend endpoint на фронт

Смотри:

- `services/api.js`

## Что сейчас не доведено до конца

- алгоритм составления расписания пока базовый
- полный ручной QA на всех реальных телефонах и десктопах не заменяется одной сборкой
