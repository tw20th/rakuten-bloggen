This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ✅ 開発前チェックリスト

- Firestore の構造と必須フィールドを確認する
- 画像ドメイン設定（next.config.mjs）を確認する
- Firebase Admin 初期化済みか確認する
- 各ページが想定データで動作するか確認する

🛠 Vercel で Firebase Functions を除外する
このプロジェクトでは functions/ 以下に Firebase Functions を配置していますが、Vercel のビルド対象に含める必要はありません。

✅ 対応方法
プロジェクトルートに .vercelignore を作成し、以下を記述します：

functions/
これで Vercel のデプロイ時に functions/ ディレクトリが無視され、不要なビルドエラーを防げます。

❌ 注意
vercel.json に excludeFiles を書くのは非対応なので使わないでください。
