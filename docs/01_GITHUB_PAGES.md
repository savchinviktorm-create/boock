# 1. Публікація Mini App через GitHub Pages

1. Створіть новий приватний або публічний GitHub-репозиторій, наприклад `prostir-knyhy-mini-app`.
2. Розпакуйте цей архів.
3. Завантажте всі файли в репозиторій.
4. Відкрийте `frontend/config.js`.
5. Поки що там стоїть `https://YOUR-WORKER.workers.dev`. Після створення Worker замініть його на реальну адресу.
6. Зробіть `git push` у гілку `main`.
7. У GitHub відкрийте **Settings → Pages**.
8. Для **Build and deployment** виберіть **GitHub Actions**.
9. Workflow `Deploy Mini App to GitHub Pages` автоматично опублікує папку `frontend`.
10. GitHub покаже адресу виду `https://ВАШ-АКАУНТ.github.io/ВАШ-РЕПОЗИТОРІЙ/`.

Ця адреса потрібна далі для Telegram Web App.
