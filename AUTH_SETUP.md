# Auth Setup

Текущая система авторизации уже работает с реальным backend API.

## Что реализовано

- логин по `email + password + role`
- регистрация `student` и `teacher`
- `admin` не регистрируется публично
- проверка роли на backend при входе
- хранение сессии в `localStorage`
- защита маршрутов по ролям
- локализация основных auth-ошибок на `ru / kk / en`

## Тестовые аккаунты

### Admin

```text
Email: admin@kazatu.edu.kz
Password: admin123
```

### Teacher

```text
Email: teacher@kazatu.edu.kz
Password: teacher123
```

### Student

```text
Email: student@university.kz
Password: student123
```

## Основные файлы

- `src/contexts/AuthContext.jsx`
- `src/hooks/useAuth.js`
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx`
- `src/services/api.js`
- `src/App.jsx`

## Правила доступа

| Роль | Маршруты | Возможности |
| --- | --- | --- |
| `admin` | `/`, `/courses`, `/teachers`, `/rooms`, `/schedule` | полный доступ |
| `teacher` | `/`, `/schedule` | просмотр |
| `student` | `/`, `/schedule` | просмотр |

## Регистрация

- `student` может зарегистрироваться с любым email
- `teacher` может зарегистрироваться только с email `@kazatu.edu.kz`
- `admin` публично зарегистрировать нельзя

## Как это работает

1. Пользователь выбирает роль.
2. Frontend отправляет запрос в backend.
3. Backend проверяет пользователя, пароль и роль.
4. Если всё успешно, пользователь сохраняется в `localStorage`.
5. Интерфейс начинает показывать только доступные разделы.

## Важно

- токен хранится в `localStorage`
- новые пароли хешируются на backend
- для production лучше использовать удалённую БД через `DATABASE_URL`
