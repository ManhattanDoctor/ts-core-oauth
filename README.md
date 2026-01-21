# @ts-core/oauth

[![npm version](https://badge.fury.io/js/%40ts-core%2Foauth.svg)](https://www.npmjs.com/package/@ts-core/oauth)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

TypeScript-библиотека для OAuth-аутентификации через различные провайдеры. Поддерживает браузеры, Cordova и Telegram Web Apps.

## Возможности

- **6 провайдеров**: Google, VK, Яндекс, Mail.ru, Keycloak, Telegram
- **3 платформы**: Browser (pop-up), Cordova (плагины), Telegram Web App
- **Унифицированный API**: единый интерфейс для всех провайдеров
- **TypeScript**: полная типизация, дженерики, интерфейсы
- **Минимум зависимостей**: только `@ts-core/common`

---

## Установка

```bash
npm install @ts-core/oauth
```

---

## Быстрый старт

### Google OAuth

```typescript
import { GoAuth, GoUser } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const auth = new GoAuth(new NullLogger(), 'YOUR_CLIENT_ID');

// Получение токена через pop-up
const { codeOrToken } = await auth.getToken();

// Получение профиля пользователя
const user: GoUser = await auth.getProfile(codeOrToken);
console.log(user.name, user.email, user.picture);

// Не забудьте освободить ресурсы
auth.destroy();
```

### VK OAuth

```typescript
import { VkAuth, VkUser } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const auth = new VkAuth(new NullLogger(), 'YOUR_APP_ID');

// Получение кода авторизации
const { codeOrToken, redirectUri } = await auth.getCode();

// Обмен кода на токен (на сервере)
const token = await auth.getTokenByCode({ codeOrToken, redirectUri }, 'YOUR_SECRET');

// Получение профиля
const user: VkUser = await auth.getProfile(token.accessToken);
console.log(user.name, user.email, user.city);
```

### Яндекс OAuth

```typescript
import { YaAuth, YaUser } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const auth = new YaAuth(new NullLogger(), 'YOUR_CLIENT_ID');
const { codeOrToken } = await auth.getToken();
const user: YaUser = await auth.getProfile(codeOrToken);
```

### Mail.ru OAuth

```typescript
import { MaAuth, MaUser } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const auth = new MaAuth(new NullLogger(), 'YOUR_CLIENT_ID');
const { codeOrToken } = await auth.getToken();
const user: MaUser = await auth.getProfile(codeOrToken);
```

### Keycloak OAuth

```typescript
import { KeycloakAuth, KeycloakUser, IKeycloakAuthSettings } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const settings: IKeycloakAuthSettings = {
    url: 'https://keycloak.example.com',
    realm: 'my-realm',
    clientId: 'my-client'
};

const auth = new KeycloakAuth(new NullLogger(), settings);
const { codeOrToken, redirectUri } = await auth.getCode();
const token = await auth.getTokenByCode({ codeOrToken, redirectUri }, 'YOUR_SECRET');
const user: KeycloakUser = await auth.getProfile(token.accessToken);
```

### Telegram Web App

```typescript
import { TgAuth, TgUser } from '@ts-core/oauth';

// Для Telegram Web Apps — данные из URL hash
const user: TgUser = TgAuth.getUser(window.location.hash);
console.log(user.id, user.name);

// Получение raw данных для верификации на сервере
const initData: string = TgAuth.getInitData(window.location.hash);
```

### Telegram Login Widget

```typescript
import { TgAuth, TgApiLoader } from '@ts-core/oauth';
import { NullLogger } from '@ts-core/common';

const api = new TgApiLoader(new NullLogger());
const auth = new TgAuth(new NullLogger(), { api, botId: YOUR_BOT_ID });

const user = await auth.getUser();
console.log(user.name, user.telegram);
```

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      PopUpBase<U>                           │
│  • Управление pop-up окном                                  │
│  • Обработка событий postMessage                            │
│  • RxJS Observable для lifecycle событий                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OAuthBase<T>                             │
│  • OAuth flow: getCode(), getToken()                        │
│  • Абстрактные методы: getProfile(), getTokenByCode()       │
│  • HTTP клиент, state management                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌───────────┐
   │ GoAuth  │        │ VkAuth  │        │KeycloakAuth│
   └─────────┘        └─────────┘        └───────────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌───────────┐
   │ GoUser  │        │ VkUser  │        │KeycloakUser│
   └─────────┘        └─────────┘        └───────────┘
```

### Провайдеры

| Провайдер | Auth класс | User класс | Особенности |
|-----------|------------|------------|-------------|
| Google | `GoAuth` | `GoUser` | People API для расширенных данных |
| VK | `VkAuth` | `VkUser` | Email из токена |
| Яндекс | `YaAuth` | `YaUser` | Стандартный OAuth 2.0 |
| Mail.ru | `MaAuth` | `MaUser` | Стандартный OAuth 2.0 |
| Keycloak | `KeycloakAuth` | `KeycloakUser` | Настраиваемый realm/URL |
| Telegram | `TgAuth` | `TgUser` | Web App + Login Widget |

---

## API Reference

### OAuthBase<T>

Базовый класс для всех OAuth провайдеров.

```typescript
class OAuthBase<T> extends PopUpBase<IOAuthDto> {
    constructor(logger: ILogger, applicationId: string, window?: Window);

    // Основные методы
    getCode(): Promise<IOAuthDto>;           // OAuth flow с response_type=code
    getToken(): Promise<IOAuthDto>;          // OAuth flow с response_type=token

    // Абстрактные методы (реализуются в провайдерах)
    abstract getProfile(token: string): Promise<T>;
    abstract getTokenByCode(dto: IOAuthDto, secret: string): Promise<IOAuthToken>;
    abstract popUpUrl(): string;

    // Настройки
    redirectUri: string;                     // Кастомный redirect URI

    // Свойства
    readonly state: string;                  // Случайный state для CSRF защиты
    readonly http: TransportHttp;            // HTTP клиент

    destroy(): void;                         // Освобождение ресурсов
}
```

### OAuthUser

Базовый класс пользователя с унифицированными полями.

```typescript
abstract class OAuthUser {
    raw: any;                    // Оригинальный ответ API

    id: string;                  // Уникальный ID пользователя
    name: string;                // Полное имя
    email?: string;              // Email
    phone?: string;              // Телефон
    picture?: string;            // URL аватара
    nickname?: string;           // Никнейм/username

    isMale?: boolean;            // Пол
    birthday?: Date;             // Дата рождения

    city?: string;               // Город
    country?: string;            // Страна
    locale?: string;             // Локаль

    status?: string;             // Статус
    description?: string;        // Описание/bio

    // Социальные сети
    vk?: string;
    facebook?: string;
    telegram?: string;
    instagram?: string;

    // Геттеры
    readonly location: string;   // "Country, City"
}
```

### Интерфейсы

```typescript
// Результат OAuth flow
interface IOAuthDto {
    codeOrToken: string;         // Код или токен
    redirectUri: string;         // Использованный redirect URI
}

// Токен авторизации
interface IOAuthToken {
    accessToken: string;
    expiresIn: number;

    state?: string;
    scope?: string;
    userId?: number;
    idToken?: string;
    tokenType?: string;
    refreshToken?: string;
    refreshExpiresIn?: string;
}

// Настройки Keycloak
interface IKeycloakAuthSettings {
    url: string;                 // URL сервера Keycloak
    realm: string;               // Название realm
    clientId: string;            // ID клиента
}

// Настройки Telegram
interface ITgAuthSettings {
    api: ITgApiLoader;           // Загрузчик Telegram API
    botId: number;               // ID бота
}
```

---

## Платформы

### Browser (по умолчанию)

Работает из коробки. Использует `window.open()` для pop-up и `postMessage` для коммуникации.

**Требования к redirect странице:**

```html
<!-- /oauth.html -->
<script>
    const params = new URLSearchParams(window.location.search + window.location.hash.replace('#', '&'));
    window.opener.postMessage({
        oAuthCodeOrToken: params.get('code') || params.get('access_token'),
        oAuthError: params.get('error'),
        oAuthErrorDescription: params.get('error_description')
    }, '*');
    window.close();
</script>
```

### Cordova OAuth Plugin

```typescript
import { CordovaOAuthPluginPropertiesSet } from '@ts-core/oauth';

const auth = new GoAuth(logger, 'CLIENT_ID');
CordovaOAuthPluginPropertiesSet(auth);
```

### Cordova InAppBrowser

```typescript
import { CordovaInAppBrowserPluginPropertiesSet } from '@ts-core/oauth';

const auth = new GoAuth(logger, 'CLIENT_ID');
CordovaInAppBrowserPluginPropertiesSet(auth, async (url) => {
    // Ваша логика получения токена по URL
    return { codeOrToken: 'token', redirectUri: 'uri' };
});
```

---

## Расширенные возможности

### Google People API

```typescript
const auth = new GoAuth(logger, 'CLIENT_ID');
auth.personFields = 'genders,birthdays';  // Запросить дополнительные поля

const user = await auth.getProfile(token);
console.log(user.isMale, user.birthday);
```

### Кастомные scopes

```typescript
const auth = new VkAuth(logger, 'APP_ID');
// Изменить scopes через params
auth.params.set('scope', 'friends,photos,email');
```

### Кастомный redirect URI

```typescript
const auth = new GoAuth(logger, 'CLIENT_ID');
auth.redirectUri = 'https://myapp.com/callback';
```

### События lifecycle

```typescript
import { PopUpBaseEvent } from '@ts-core/oauth';

auth.events.subscribe(event => {
    if (event.type === PopUpBaseEvent.OPENED) {
        console.log('Pop-up opened');
    }
    if (event.type === PopUpBaseEvent.CLOSED) {
        console.log('Pop-up closed');
    }
});
```

---

## Структура проекта

```
src/
├── OAuthBase.ts          # Базовый класс OAuth
├── OAuthUser.ts          # Базовый класс пользователя
├── OAuthParser.ts        # Парсер URL параметров
├── PopUpBase.ts          # Управление pop-up окнами
├── public-api.ts         # Единая точка экспорта
├── external/             # Платформенные интеграции
│   ├── browser.ts
│   ├── cordovaOAuthPlugin.ts
│   └── cordovaInAppBrowserPlugin.ts
├── go/                   # Google
├── vk/                   # VK
├── ya/                   # Яндекс
├── ma/                   # Mail.ru
├── keycloak/             # Keycloak
└── tg/                   # Telegram
```

---

## Зависимости

| Пакет | Версия | Назначение |
|-------|--------|------------|
| `@ts-core/common` | ~3.0.43 | Logger, HTTP, утилиты |

---

## Лицензия

ISC License

---

## Автор

**Renat Gubaev** — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

GitHub: [ManhattanDoctor/ts-core-oauth](https://github.com/ManhattanDoctor/ts-core-oauth)
