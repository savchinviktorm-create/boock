# 4. Зміна вашого планувальника постів

У вашому існуючому Python-коді не потрібно чіпати інші рубрики.

Додайте біля інших URL:

```python
BOOKS_MINI_APP_URL = os.environ.get(
    "BOOKS_MINI_APP_URL",
    "https://t.me/lifechaksdaybot/knyha"
)
```

Для вечірньої книжкової рубрики поверніть одну книгу і кнопку:

```python
text = (
    "📖 <b>КНИГА НА ВЕЧІР</b>\n\n"
    f"{book_text}\n\n"
    "✨📚 Якщо хочеться ще — обирайте категорію та відкривайте наступну книгу."
)

reply_markup = {
    "inline_keyboard": [[
        {
            "text": "✨ БІЛЬШЕ КНИГ",
            "url": BOOKS_MINI_APP_URL
        }
    ]]
}

return text, img, reply_markup
```

Якщо пост іде з фото, ваша функція `send_telegram` вже може передати `reply_markup` під фото, якщо вона реалізована так само, як у вашому попередньому коді.
