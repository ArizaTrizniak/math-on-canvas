# Восстановление пароля: задание для math-on-canvas-auth

**Дата:** 2026-11-11
**Статус:** Черновик для бэкенда
**Репозиторий:** [math-on-canvas-auth](https://github.com/ArizaTrizniak/math-on-canvas-auth): AWS Lambda за API Gateway, TypeScript, пользователи в AWS Cognito, данные в DynamoDB
**Макет:** https://claude.ai/artifact/PHeB3SfALtr8tVDrfQ7nRa (ряд «Восстановление пароля»: экраны 4–6 и телефон)
**Клиенты:** math-on-canvas (сайт и каталог) и math_poster_editor (редактор)

## Как сейчас устроен вход по почте

- Маршруты регистрируются в `src/controllers/nativeAuthController.ts`: `/auth/signup`, `/auth/confirm-signup`, `/auth/signin`, `/auth/resend-code`. Каждый обработчик разбирает JSON, вызывает `AuthService`, а ошибки отдаёт через `toHttpResponse` в формате `{ error, message, request_id }`.
- `src/services/authService.ts` проверяет почту (`validateEmail`, `normalizeEmail`) и вызывает нужный метод `NativeAuthProvider`. При входе он выпускает собственные JWT и refresh-токен через `provisionUserAndIssueTokens(userInfo, ip, userAgent)`.
- `src/providers/cognito.ts` работает с публичным API Cognito (`SignUp`, `ConfirmSignUp`, `InitiateAuth` с `USER_PASSWORD_AUTH`, `ResendConfirmationCode`) через `SecretHash` клиента. Admin-методы Cognito не используются, IAM-прав на них у Lambda нет. Ошибки Cognito переводятся в `AppError` в `mapCognitoError`.
- `resendCode` уже скрывает, существует ли аккаунт: на `UNAUTHORIZED` он отвечает `{ sent: true }`. Здесь нужно сделать так же.
- User Pool **не описан в Terraform**: его id передаётся переменной (`cognito_user_pool_id` в `infra/terraform/environments/*/terraform.tfvars`). Значит, настройки пула и app client меняются в консоли AWS. Своего ограничителя частоты запросов в коде нет. Есть только общий throttling стадии API Gateway (50 rps, burst 100) и встроенные лимиты Cognito.

## Пользовательский сценарий

1. На экране входа пользователь нажимает «Забыли пароль?» и попадает на экран 4. Почта подставлена из формы входа.
2. Нажимает «Отправить код». Срабатывает **RP-1**, открывается экран 5: «Если аккаунт с этой почтой существует, мы отправили на неё код».
3. Вводит код из письма и новый пароль, нажимает «Сохранить и войти». Срабатывает **RP-2**.
4. Экран 6: «Пароль изменён. Вы вошли как …». Пользователь уже авторизован.

Кнопка «Отправить код повторно» ещё раз вызывает RP-1. На фронтенде она блокируется таймером на 60 с.

---

## RP-1 (P0). `POST /auth/forgot-password`

```json
{ "email": "anna@school.ru", "lang": "ru" }
```

→ **200**, тело одинаковое в любом случае:

```json
{ "sent": true }
```

**Реализация**
- В `NativeAuthProvider` и `CognitoAuthProvider` добавить метод `forgotPassword(email, lang)`. Он вызывает `ForgotPasswordCommand` с параметрами `ClientId`, `SecretHash`, `Username: email` и `ClientMetadata: { lang }`. `lang` нужен для локализации письма, см. RP-3.
- В `AuthService` добавить `forgotPassword({ email, lang })`: сначала `validateEmail` и `normalizeEmail`, как в `resendCode`, затем вызов провайдера.
- Что вернуть, в зависимости от ответа Cognito:

| Ответ Cognito | Ответ клиенту |
|---|---|
| успех | 200 `{ sent: true }` |
| `UserNotFoundException` (почты нет или аккаунт только через Google) | 200 `{ sent: true }` |
| `InvalidParameterException` («no registered/verified email»: почта не подтверждена) | 200 `{ sent: true }`, но см. «Неподтверждённая почта» |
| `NotAuthorizedException` (аккаунт отключён) | 200 `{ sent: true }` |
| `LimitExceededException`, `TooManyRequestsException` | 429 `rate_limit_exceeded` (уже есть в `mapCognitoError`) |
| `CodeDeliveryFailureException` | 502 `provider_error`, записать в лог как ошибку |

Ответ не должен выдавать, существует ли аккаунт. Поэтому `UserNotFoundException`, `InvalidParameterException` и `NotAuthorizedException` нужно перехватывать в сервисе, а не отдавать как ошибку. Сейчас `mapCognitoError` превращает `InvalidParameterException` в 400, и это выдало бы, что аккаунт существует, но не подтверждён.

- Невалидная почта отдаёт 400 `invalid_request`. Это то же поведение, что у `/auth/resend-code`.
- Маршрут регистрируется в `nativeAuthController.ts`, обработчик устроен как `resendCodeHandler`.

## RP-2 (P0). `POST /auth/reset-password`

```json
{ "email": "anna@school.ru", "code": "730926", "newPassword": "Kvadrat-2026" }
```

→ **200** `{ "success": true, "signedIn": true }` плюс **cookies сессии, как у `/auth/signin`**.

**Реализация**
- В провайдер добавить `confirmForgotPassword(email, code, newPassword)` → `ConfirmForgotPasswordCommand` с параметрами `ClientId`, `SecretHash`, `Username`, `ConfirmationCode` и `Password`.
- В `AuthService` добавить `resetPassword({ email, code, newPassword, ipAddress, userAgent })`:
  1. `validateEmail` и `normalizeEmail`.
  2. Вызвать `confirmForgotPassword`.
  3. Найти пользователя (`userRepo.getByEmail`) и вызвать `tokenRepo.revokeAllForUser(userId)`, чтобы выйти из аккаунта на всех остальных устройствах. Этот метод уже есть.
  4. Войти с новым паролем так же, как это делает `signIn`: `initiateAuth(email, newPassword)` → `verifyNativeIdToken` → `provisionUserAndIssueTokens`.
  5. Записать `auditRepo.append` с событием `password_reset_completed`, IP и user-agent.
- Обработчик возвращает `{ statusCode: 200, cookies, body: { success: true } }`, как `signInHandler`.

**Ошибки** (сопоставление в `mapCognitoError` уже есть, новых кодов ошибок не нужно):

| Ответ Cognito | Ответ клиенту |
|---|---|
| `CodeMismatchException`, `ExpiredCodeException` | 400 `invalid_confirmation_code`. Фронтенд покажет «Код неверен или истёк». |
| `UserNotFoundException` | 400 `invalid_confirmation_code`, **а не** `unauthorized`: так не выдаётся, существует ли аккаунт. |
| `InvalidPasswordException` | 400 `password_too_weak`. Код при этом не сгорает, пользователь может отправить форму снова. |
| `LimitExceededException`, `TooManyRequestsException` | 429 `rate_limit_exceeded`. Cognito так отвечает и после нескольких неверных кодов подряд. |

> Если пароль уже сменился, а шаг 4 упал (Cognito недоступен и т. п.), нужно вернуть `{ "success": true, "signedIn": false }` без cookies, а не 5xx. Пароль ведь уже изменён. На этот случай на макете есть экран 6 с вариантом «Войдите с новым паролем».

## RP-3 (P1). Письмо с кодом на языке пользователя

Cognito отправляет письмо с кодом сам, по одному шаблону на весь пул. Чтобы письмо было на языке пользователя:
- Подключить к пулу Lambda-триггер **Custom Message**. На событие `CustomMessage_ForgotPassword` он выбирает тему и текст по `event.request.clientMetadata.lang` (`en | ru | es | de`, по умолчанию `en`) и вставляет `{####}` — так Cognito обозначает код.
- В письме: код крупным шрифтом, «код действует 1 час», и что делать, если сброс запрашивал не пользователь.
- Тем же триггером стоит локализовать и `CustomMessage_SignUp` и `CustomMessage_ResendCode`. Сейчас письма о регистрации, судя по всему, тоже отправляются по одному шаблону. Для этого RP-1 и `/auth/resend-code` должны передавать `lang`.

## RP-4 (P1). Письмо «Пароль изменён»

Cognito такого письма не отправляет. Варианты:
- Lambda-триггер **Post Confirmation** со значением `PostConfirmation_ConfirmForgotPassword` отправляет письмо через SES;
- или письмо отправляется прямо из `resetPassword` через SES.

Оба варианта требуют настроенного SES, см. «Настройки пула».

## RP-5 (P2). `GET /auth/password-policy`

Фронтенд проверяет пароль по правилам, записанным у него в коде: не меньше 8 символов, заглавная, строчная, цифра, спецсимвол. Настоящая политика задана в User Pool. Нужен эндпоинт, который её отдаёт:

```json
{ "minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireDigit": true, "requireSymbol": true }
```

Можно читать политику из пула (`DescribeUserPool`, понадобится IAM-право `cognito-idp:DescribeUserPool`) с кешем в памяти Lambda, а можно держать константой в конфиге. Главное, чтобы она совпадала с настройкой пула.

---

## Настройки пула (консоль AWS, staging и prod)

User Pool не в Terraform, поэтому всё ниже нужно проверить или включить вручную. Лучше заодно перенести пул и app client в Terraform.

1. **App client → Prevent user existence errors = Enabled.** Тогда Cognito и сам не выдаёт, существует ли аккаунт, это дополнительная защита к перехвату в RP-1.
2. **Account recovery → «Email only»** (`AccountRecoverySetting`: `verified_email`, priority 1). Без этого `ForgotPassword` может пытаться отправить код по SMS или вообще не отправлять его.
3. **Отправка писем — через SES, а не `COGNITO_DEFAULT`.** Встроенный отправитель Cognito ограничен примерно **50 письмами в сутки** на пул, и этот лимит общий для регистраций и сбросов. Нужен SES из production-режима (не sandbox) с подтверждённым доменом и `From`, например `no-reply@math-on-canvas.com`.
4. **Политика пароля** совпадает с проверкой на фронтенде, см. RP-5.
5. **App client auth flows:** `ALLOW_USER_PASSWORD_AUTH` уже нужен для входа и подойдёт для шага 4 в RP-2.
6. **Проверка:** «Keep original attribute value active when an update is pending» (`AttributesRequireVerificationBeforeUpdate`) включён. Это не связано со сбросом напрямую, но проверить стоит.

## Неподтверждённая почта

Если почта не подтверждена (пользователь зарегистрировался, но не ввёл код), Cognito не даёт сбросить пароль публичным API. Варианты:

- **А (P0, рекомендую).** RP-1 в этом случае тихо вызывает `ResendConfirmationCode` и всё равно отвечает `{ sent: true }`. Пользователь получает письмо с кодом подтверждения, а не сброса, и RP-2 вернёт `invalid_confirmation_code`. Это плохой опыт, но случай редкий. Фронтенд дополнительно подскажет: «Если вы не подтверждали почту — войдите, мы пришлём код подтверждения».
- **Б (P2).** RP-2 через admin-API: проверить статус `UNCONFIRMED` (`AdminGetUser`), затем `ConfirmSignUp` с кодом и `AdminSetUserPassword` с `Permanent: true`. Это полноценный сценарий, но Lambda понадобятся IAM-права `cognito-idp:AdminGetUser` и `cognito-idp:AdminSetUserPassword`, а этот путь отличается от остального кода.

## Аккаунты только через Google

Такой пользователь в Cognito заведён под другим именем (`Google_…`), поэтому `ForgotPassword(email)` вернёт `UserNotFoundException`, а RP-1 ответит `{ sent: true }`, и письмо не придёт. На экране 4 уже есть подсказка «Входили через Google? Пароль не нужен». Письмо «вы входите через Google» (поиск по `userRepo.getByEmail` с `providerType = 'google'` и отправка через SES) — **P2**, и только после того, как будет настроен SES.

## Безопасность

Генерацией, хранением, сроком жизни (1 час) и одноразовостью кода занимается Cognito. Новый запрос RP-1 аннулирует предыдущий код. Повторять это в нашем коде не нужно. Что остаётся на нашей стороне:
- **Ответ RP-1 не зависит от существования аккаунта**: тело и статус одинаковые, см. таблицу в RP-1.
- **После смены пароля** вызывать `tokenRepo.revokeAllForUser`. Наши access-JWT короткоживущие и истекут сами.
- **Лимиты.** Встроенных лимитов Cognito и общего throttling стадии API Gateway для начала достаточно. Если нужно жёстче (1 RP-1 в 60 с на одну почту), счётчик можно хранить в DynamoDB с TTL. Это P2.
- **Логи.** Не писать в них код и пароль. Почту писать маскированной, как в остальных обработчиках. Аудит-события: `password_reset_requested` и `password_reset_completed`.
- **CORS и cookies** как у `/auth/signin`.

## Критерии приёмки

1. RP-1 для существующей, несуществующей, неподтверждённой и Google-почты отвечает 200 `{ sent: true }`.
2. На существующую подтверждённую почту приходит письмо с кодом на языке `lang` (после RP-3), отправленное через SES.
3. После RP-2 с верным кодом:
   - старый пароль не работает в `/auth/signin`;
   - новый пароль работает;
   - `/auth/me` с выданными cookies возвращает профиль;
   - refresh-токен, выданный другому устройству до сброса, отклоняется в `/auth/refresh`.
4. Неверный или истёкший код → 400 `invalid_confirmation_code`. Повторное использование кода → то же.
5. Слабый пароль → 400 `password_too_weak`, после чего тот же код с сильным паролем проходит.
6. Частые запросы → 429 `rate_limit_exceeded`.
7. Интеграционные тесты рядом с тестами `nativeAuthController`, Cognito замокан. Отдельно проверяется перехват «неперехваченных» ошибок Cognito в RP-1.
8. На staging проверены настройки пула 1–3.

## Что сделает фронтенд (для сведения)

- `authApiClient.forgotPassword(email, lang)` и `authApiClient.resetPassword(email, code, newPassword)`.
- Виды окна `forgotPassword`, `resetPassword` и `resetDone`, ссылка «Забыли пароль?» на экране входа.
- Ответ `signedIn: false` обрабатывается запасным вариантом экрана 6.
- Новых кодов ошибок нет. Уже переведённые `invalid_confirmation_code`, `password_too_weak` и `rate_limit_exceeded` покрывают все случаи.
- Таймер повторной отправки — 60 с на фронтенде.
- Пути `/auth/forgot-password` и `/auth/reset-password` добавляются в `SKIP_PATHS` перехватчика 401.
- Локальный прокси `/auth/[...path]` уже пропускает любые POST на staging.

## Открытые вопросы

1. Как сейчас отправляются письма пула: `COGNITO_DEFAULT` или SES? Если `COGNITO_DEFAULT`, это блокирующая проблема для запуска из-за лимита 50 писем в сутки.
2. Неподтверждённая почта: вариант А сейчас и Б позже, или сразу Б?
3. Переносим ли User Pool в Terraform в рамках этой задачи или отдельной?
