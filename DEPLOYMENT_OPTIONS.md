# Nutri MVP — practical deployment options (web + Node + SQLite)

Ниже 3 реалистичных пути для продакшн-деплоя с учётом текущего стека (Node + статический фронт + SQLite).

## 1) Самый быстрый запуск: **Render / Railway (single service + persistent volume)**

**Когда выбирать:** нужно «поднять сегодня» с минимальным DevOps.

**Что делаем:**
1. Подготовить `start`-скрипт в `package.json` (например `node server.js`) и переменные окружения.
2. Завести веб-сервис в Render/Railway из Git-репозитория.
3. Подключить persistent disk/volume и хранить SQLite-файл на нём.
4. Прописать healthcheck (`/health`) и авто-рестарт.
5. Настроить домен + HTTPS (обычно встроено).
6. Сделать бэкапы SQLite (cron job в платформе или внешний nightly dump в object storage).

**Риски:**
- SQLite плохо переносит burst-нагрузку и конкурентные записи.
- Vendor lock-in по конфигу платформы.
- На дешёвых тарифах возможны cold starts/ограничения IOPS.

**Ориентировочная сложность:** **2/5 (низкая)**.

---

## 2) Самый стабильный: **VPS (Hetzner/DO) + Docker Compose + Nginx + systemd + бэкапы**

**Когда выбирать:** нужен предсказуемый прод с контролем, логами, мониторингом и без сильной зависимости от PaaS.

**Что делаем:**
1. Арендовать VPS (минимум 2 vCPU / 2–4 GB RAM).
2. Поставить Docker + Compose, UFW, fail2ban, auto security updates.
3. Собрать контейнер Node-приложения; SQLite хранить в смонтированном volume (`/var/lib/nutri/data.sqlite`).
4. Поднять `docker-compose`:
   - `app` (Node)
   - `nginx` (reverse proxy, rate limit, gzip, static cache)
5. Настроить HTTPS (Let’s Encrypt, certbot/lego) и автопродление.
6. Добавить:
   - systemd unit на автозапуск compose
   - логи (journald + ротация)
   - мониторинг (Uptime Kuma/Grafana Cloud)
   - nightly backup SQLite + еженедельная проверка restore.

**Риски:**
- Больше операционки на команде (обновления, патчи, ротация логов).
- Ошибки в бэкапах/restore, если не тестировать восстановление.
- SQLite остаётся single-writer; при росте трафика нужен план миграции на Postgres.

**Ориентировочная сложность:** **4/5 (выше средней)**.

---

## 3) Самый дешёвый: **Один бюджетный VPS (~€4–6/мес) без контейнеров (Node + PM2 + Caddy)**

**Когда выбирать:** важна минимальная стоимость и простой стек.

**Что делаем:**
1. Взять бюджетный VPS (1 vCPU / 1–2 GB RAM).
2. Установить Node LTS, PM2, Caddy.
3. Развернуть код в `/opt/nutri-mvp`, установить зависимости.
4. Запуск через PM2 (`pm2 start server.js --name nutri-mvp`, `pm2 save`, startup).
5. Настроить Caddy как reverse proxy (HTTPS автоматически).
6. SQLite в отдельной папке (`/opt/nutri-mvp/data`), ежедневный `sqlite3 .backup` + копия на внешний storage.

**Риски:**
- Меньше запас по ресурсам, просадки под пиками.
- Ручной деплой/обновления, выше риск «человеческого фактора».
- При росте проекта быстро упрёмся в пределы single-node + SQLite.

**Ориентировочная сложность:** **3/5 (средняя)**.

---

## Практическая рекомендация для nutri-mvp

- **Сейчас:** стартовать с варианта **№1 (быстрый)**, чтобы быстрее получить production feedback.
- **Через 1–2 итерации:** перейти к **№2 (стабильный)**, если появляются платящие пользователи/регулярная нагрузка.
- **Во всех вариантах обязательно:**
  - ежедневный backup SQLite + периодический test restore,
  - healthcheck endpoint,
  - базовый rate limiting,
  - план миграции на Postgres при росте write-нагрузки.
