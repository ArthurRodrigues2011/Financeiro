# Controle Financeiro Pessoal e Familiar

Sistema web em React + TypeScript para controle financeiro mensal, planejamento anual, metas, relatórios, perfis locais e PWA offline.

## Principais recursos

- Funciona como site estático e é compatível com GitHub Pages.
- Perfis locais com login individual, foto opcional e dados separados.
- Persistência em IndexedDB com fallback em localStorage.
- Dashboard com receitas, despesas, saldo, vencimentos, parcelas, economia e gráficos.
- Contas fixas, variáveis, receitas, financiamentos, metas, anexos e tags.
- Tabela anual estilo planilha, calendário financeiro e inteligência financeira local.
- Exportação JSON, CSV, Excel e PDF.
- Importação de backups JSON e planilhas XLSX/XLS.
- PWA instalável e service worker para uso offline.
- Pasta `server` com Express, JWT e PostgreSQL para evolução online futura.

## Rodando o app estático

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

O Vite está configurado com `base: "./"` para publicar em GitHub Pages sem servidor dedicado.

## Backend futuro

O app não depende do backend para funcionar. A API está em `server/` para quando houver sincronização entre dispositivos.

```bash
cd server
npm install
cp .env.example .env
psql "$DATABASE_URL" -f schema.sql
npm run dev
```

Rotas principais:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/password/request`
- `POST /auth/password/reset`
- `GET /profile/me`
- `GET /finance/records`
- `POST /finance/records`
- `GET /finance/categories`
- `POST /finance/categories`
- `GET /finance/loans`
- `POST /finance/loans`
- `GET /finance/goals`
- `POST /finance/goals`

## Hospedagem no GitHub Pages

Inclui workflow em `.github/workflows/pages.yml`. Depois de enviar para o GitHub, habilite Pages usando GitHub Actions como origem.
