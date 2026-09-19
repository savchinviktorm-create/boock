# 2. Сервер для ліміту та Premium

Цей крок потрібен, якщо ви хочете справжній технічний ліміт 10 рекомендацій на добу та платний Premium.

## 2.1. Створіть Cloudflare

1. Зайдіть у Cloudflare.
2. Створіть безкоштовний акаунт.
3. Відкрийте **Workers & Pages**.
4. Створіть Worker або імпортуйте GitHub-репозиторій.
5. Для Worker вкажіть папку `worker/` як робочу директорію.

## 2.2. Створіть D1

Якщо робите через термінал:

```bash
npx wrangler d1 create prostir-knyhy
```

Скопіюйте отриманий `database_id` у `worker/wrangler.toml` замість `REPLACE_AFTER_CREATING_D1`.

Потім виконайте:

```bash
npx wrangler d1 execute prostir-knyhy --remote --file=schema.sql
```

## 2.3. Секрети Worker

У Cloudflare відкрийте Worker → **Settings → Variables and Secrets** і створіть:

- `BOT_TOKEN` — токен вашого Telegram-бота.
- `WEBHOOK_SECRET` — придумайте довгий випадковий рядок, наприклад 30–50 символів.

`BOT_TOKEN` ніколи не записуйте у фронтенд або GitHub-файли.

## 2.4. Опублікуйте Worker

Після deploy Cloudflare дасть адресу на кшталт:

`https://prostir-knyhy-api.ваш-піддомен.workers.dev`

Скопіюйте її у `frontend/config.js`:

```js
window.BOOK_APP_CONFIG = {
  API_URL: "https://prostir-knyhy-api.ваш-піддомен.workers.dev"
};
```

Знову зробіть push у GitHub.

## 2.5. Встановіть webhook Telegram

Після публікації Worker виконайте запит:

```text
https://api.telegram.org/botВАШ_ТОКЕН/setWebhook?url=https://ВАШ-WORKER.workers.dev/telegram/webhook&secret_token=ВАШ_WEBHOOK_SECRET
```

У URL немає пробілу після `bot`.

Перевірити webhook можна через:

```text
https://api.telegram.org/botВАШ_ТОКЕН/getWebhookInfo
```

## Що робить Worker

- перевіряє підпис Telegram Mini App `initData`;
- визначає Telegram user ID;
- рахує максимум 10 безкоштовних рекомендацій на календарну добу за київським часом;
- не показує користувачу цифру ліміту;
- після 10 запитів повертає екран Premium/завтра;
- для Premium не застосовує добовий ліміт, поки підписка активна;
- створює рахунок Telegram Stars на 10 XTR з періодом 30 днів;
- приймає `pre_checkout_query` і `successful_payment` через webhook;
- записує строк Premium у D1.
