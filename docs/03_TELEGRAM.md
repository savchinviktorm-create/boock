# 3. Підключення до Telegram

## 3.1. Другий Mini App у тому самому боті

Можна використати той самий бот, який уже запускає Mini App «Простір корисного контенту». Для книги створіть окремий Web App short name, наприклад `knyha`.

У BotFather відкрийте налаштування Web Apps вашого бота та додайте:

- **Name:** `Книга на вечір`
- **Short name:** `knyha`
- **URL:** ваша GitHub Pages адреса

Після цього Deep Link матиме вигляд:

`https://t.me/lifechaksdaybot/knyha`

Якщо ваш бот має інший username — використайте його.

## 3.2. Кнопка під щоденною публікацією

Для поста «📖 КНИГА НА ВЕЧІР» використовуйте:

```python
BOOKS_MINI_APP_URL = os.environ.get(
    "BOOKS_MINI_APP_URL",
    "https://t.me/lifechaksdaybot/knyha"
)

reply_markup = {
    "inline_keyboard": [[
        {
            "text": "✨ БІЛЬШЕ КНИГ",
            "url": BOOKS_MINI_APP_URL
        }
    ]]
}
```

Важливо: ранковий Mini App «Щасливий день» залишайте окремим URL. Не замінюйте його адресою книги.

## 3.3. Кнопка Premium

Оплата проходить всередині Telegram через Stars. Користувачеві не потрібно вводити дані банківської картки у ваш Mini App.

Ціна у Worker вже встановлена як `10 XTR` на 30 днів.
