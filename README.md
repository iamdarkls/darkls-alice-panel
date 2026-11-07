# DARKLS Alice Panel

Веб-панель для Яндекс Станции Мини 3 Про с root-доступом (pickle, ARM64). Сервер Python работает на колонке в `/data/darkls-alice`. Интерфейс написан на Vue 3 и TypeScript и поставляется в готовой сборке Vite. ПК и ADB нужны для обслуживания, а панель открывается в браузере.

## Возможности

- Управление колонкой, плеер, файлы, консоль, графики и журналы.
- Поиск и установка пакетов через YAM v2, управление службами, автозапуск и ссылки на интерфейсы приложений.
- Обновление панели, откат к предыдущей сборке, диагностика и резервные копии настроек.
- Управление внешним голосовым агентом через вкладку ChatGPT.

## Обновление на колонке

Открой панель по адресу `http://<IP колонки>:8770`. Во вкладке **«Обновления панели»** нажми **«Проверить»**, затем **«Установить обновление»**. После перезапуска обнови страницу.

В поле «Источник обновлений» используется [манифест последнего релиза](https://github.com/iamdarkls/darkls-alice-panel/releases/latest/download/update.json). Панель проверяет SHA-256 пакета, а при неудачном запуске supervisor возвращает предыдущую сборку. [Скачать релиз](https://github.com/iamdarkls/darkls-alice-panel/releases/latest).

## Структура проекта

| Путь | Назначение |
| --- | --- |
| [`app/`](app/) | Сервер Python и готовые файлы интерфейса для колонки |
| [`frontend/`](frontend/) | Исходники Vue и конфигурация сборки |
| [`tests/`](tests/) | Тесты Python и сценарий проверки в браузере |
| [`scripts/release/`](scripts/release/) | Сборка пакета и публикация релиза |
| [`scripts/device/`](scripts/device/) | Ручное обновление установленной панели через ADB |
| [`deploy/device/`](deploy/device/) | Supervisor и служебные скрипты колонки |
| [`deploy/voice-agent/`](deploy/voice-agent/) | Голосовой агент и установщик для Linux |
| [`docs/`](docs/) | Руководства и заметки к релизу |
| `dist/` | Архивы и манифесты, созданные локальной сборкой |

Корневые `update.json` и `release.json` описывают опубликованный релиз. Прямой адрес `update.json` используется как источник обновлений.

## Сборка и тесты

Для сборки интерфейса нужны Node.js 24 и npm. Для сервера и тестов используем Python 3.14.

```sh
npm ci --prefix frontend
npm run build --prefix frontend
python -m unittest discover -s tests -v
python scripts/release/build-release.py --repository iamdarkls/darkls-alice-panel
```

Для браузерной проверки укажи путь к установленному Chrome или Chromium.

```sh
BROWSER_EXECUTABLE=/path/to/chrome node tests/ui.mjs
```

В `dist/` появятся `app.tar.gz`, `source.zip`, `update.json` и `release.json`. Скрипт `scripts/device/upgrade.ps1` берёт архив и метаданные из этой папки. GitHub Actions проверяет проект и публикует новые версии из `app/DARKLS_VERSION`.

## Руководства

- Сборка интерфейса и браузерная проверка. [Фронтенд](docs/FRONTEND.md)
- Установка пакетов и переход с yamd. [YAM v2](docs/YAM-V2.md)
- Запуск служб и автозапуск. [Хост приложений](docs/APP-HOST.md)
- Обнаружение веб-интерфейсов пакетов. [Ссылки на панели](docs/WEB-PANELS.md)
- Освобождение места и откат. [Очистка сборок](docs/CLEANUP.md)
- Поддержка UwU Eyes и проверка экрана. [Совместимость UwU Eyes](docs/UWU-COMPAT.md)

Основа интерфейса — dimap/yandex-station-web (MIT).
