# Rillora

Rillora is a digital legacy and estate continuity product. It helps people map their online accounts, assets, and devices, and record who should handle each one.

The product is early stage. Customer access is closed. This public repository is not a signup page, and it does not mean the service is open for general use.

Rillora does not produce a will that is automatically valid worldwide. It is a map of what exists and who should deal with it. It is not a place to store bank-card passwords, full recovery phrases, or any single secret that can transfer assets by itself.

## Architecture

- **Web** (`apps/web`): a Vite and React app for editing, organization, and the recipient portal.
- **iOS** (`apps/ios`): a SwiftUI app for quick capture, review, and device authentication. `apps/ios-prototype` is a browser prototype of the mobile interaction. It is not the shipping app.
- **API** (`apps/api`): a TypeScript service on Node.js, backed by PostgreSQL.
- **Infrastructure** (`infra/aws`): AWS resources defined with the AWS CDK.
- **Identity** (`infra/auth0`): Auth0 assets for sign-in.

The clients share domain language, permissions, and the API. They do not share one screen layout.

## Repository layout

| Path | Contents |
| --- | --- |
| `apps/` | Web app, iOS app, TypeScript API, and the iOS browser prototype |
| `infra/` | AWS CDK app, Auth0 assets, and an AI candidate stack |
| `docs/` | Product and engineering records, including the [project log](docs/PROJECT_LOG.md) |
| `tools/` | Local verification, release, and operator helpers |
| `config/` | Shared configuration |
| `assets/` | Brand and illustration files |
| `integrations/` | AI integration packages |
| `collaboration/` | Publication records and encrypted work archives |

Root files that are part of the public tree include [SECURITY.md](SECURITY.md), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), `DESIGN.md`, and `AGENTS.md`.

## Local development

There is no root installer. The API and the AWS CDK package expect Node.js 22 or newer. Each package has its own `package-lock.json`; install with `npm ci` in that directory. Do not commit `.env` files. Samples live in [apps/api/.env.example](apps/api/.env.example) and [apps/web/.env.example](apps/web/.env.example).

### Web

```sh
cd apps/web
npm ci
npm run dev
```

Vite binds to `127.0.0.1` and proxies `/api` to `http://127.0.0.1:4180`. There is no single `npm test` script. The scripts that exist are:

- `npm run test:api-client`
- `npm run test:first-use`
- `npm run test:mobile-navigation`
- `npm run test:commercial-access`
- `npm run test:product-truth`
- `npm run test:crypto`
- `npm run test:sites`
- `npm run test:legal-sites`
- `npm run test:browser` (Playwright)

### API

```sh
cd apps/api
npm ci
npm run dev
```

Copy `apps/api/.env.example` to an untracked `.env` and set `DATABASE_URL` to a local PostgreSQL database. The sample uses `postgresql:///continuity_dev`, listens on `127.0.0.1`, and uses port `4180`. The process reads that file through `dotenv`. It does not create the database.

`npm run migrate` applies the SQL migrations in `apps/api/migrations` to `DATABASE_URL`. `npm run seed:dev` inserts a local development fixture and refuses to run when `NODE_ENV` is `production`.

```sh
cd apps/api
npm test
```

`npm test` runs Vitest. The tests require a dedicated disposable PostgreSQL database on localhost. The default name is `continuity_test`. They refuse any other database. The local check runner and its prerequisites are described in [tools/ci/README.md](tools/ci/README.md).

### iOS

The shipping app is an Xcode project at `apps/ios/Rillora.xcodeproj`, generated from `apps/ios/project.yml`. On a Mac with Xcode, test the `Rillora` scheme (`RilloraTests`). Commands for the separate next-version content package are in [apps/ios/NextVersionContent/README.md](apps/ios/NextVersionContent/README.md).

The browser prototype:

```sh
cd apps/ios-prototype
npm ci
npm run dev
```

### AWS CDK

```sh
cd infra/aws
npm ci
npm test
```

`npm run synth` renders CloudFormation from the CDK app. Applying those templates needs AWS credentials and is separate from a local checkout. Scope and current limits are in [infra/aws/README.md](infra/aws/README.md).

### Checks

GitHub Actions is not the current verification path. Run the local checks in [tools/ci/README.md](tools/ci/README.md). A selected group is only evidence for that group.

## License

This repository is source-available, and all rights are reserved. The terms are in [LICENSE](LICENSE).

Copyright 2026 tantalum666 (Yuchen Yuan). You may view the source code. You may not copy, modify, redistribute, or use it commercially without the copyright holder's prior written permission.

Third-party components keep the notices in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Security

The repository threat model is in [SECURITY.md](SECURITY.md).

A map of accounts and assets is not access to those accounts, and it is not a transfer of ownership. Do not send passwords, recovery phrases, private keys, or access tokens to the project.

Report a security issue to `security@rillora.xyz`. That is the security contact used for the public legal pages. Do not include secret material in a public issue.

Customer access is closed.

## 简体中文

Rillora 是一个数字遗产与事务连续性产品。它帮助人们整理自己的线上账号、资产和设备，并写明每一项应由谁来处理。

项目仍处于早期阶段，客户访问尚未开放。公开这个仓库并不表示服务已经可以注册，也不表示已经正式提供给客户使用。

本仓库采用“可以查看源码、保留全部权利”的许可。你可以查看代码。未经版权人 tantalum666 (Yuchen Yuan) 事先书面许可，不得复制、修改、再分发或用于商业用途。全文见 [LICENSE](LICENSE)。

原来的根目录说明是一份内部项目日志，现已原样移到 [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md)（仅调整了相对链接的路径）。

## Project log

The previous root README is preserved in [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md). The wording is unchanged. Relative links were rewritten so they still point at the same files from `docs/`.
