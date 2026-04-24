# IIDX Memo

beatmania IIDX のプレイメモ管理アプリ。楽曲一覧の閲覧、オプション・備考の記録、プレイリスト管理、譜面ビューアをスマートフォンに最適化した PWA として提供する。

## 主な機能

- **曲リスト閲覧** — BEMANI Wiki から最新の曲データを取得。タイトル・アーティスト名検索、難易度・レベル・バージョンによる絞り込み、ページスワイプに対応
- **プレイメモ** — ANOTHER / LEGGENDARIA ごとにオプション（正規・鏡・乱・R乱・S乱）と備考を端末に保存
- **譜面ビューア** — textage.cc の譜面を in-app で表示。R乱シフト確認、S乱シャッフル、カスタム配置入力に対応
- **プレイリスト** — BPL Season 5 決勝課題曲をカテゴリ・レベル別に収録した固定プレイリストと、自由に作成できるカスタムプレイリストを管理
- **BPL カテゴリ表示** — 曲一覧カードの色ドット・曲詳細のバッジで BPL カテゴリ（NOTES・CHORD・PEAK・CHARGE・SCRATCH・SOF-LAN）を可視化

## 技術スタック

| 用途 | 採用技術 |
|------|----------|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 18 + Tailwind CSS |
| 状態管理 | Zustand |
| スクレイピング | Cheerio (サーバーサイド) |
| デプロイ | Render (Docker) |

## ディレクトリ構成

```
app/
  page.tsx               曲一覧・フィルタ・ページネーション
  songs/[id]/page.tsx    曲詳細・メモ入力・譜面ビューア
  settings/              テーマ設定
  api/songs/             BEMANI Wiki スクレイピング API
  api/textage-chart/     textage.cc 譜面取得 API
components/
  SongCard.tsx           曲カード（BPL ドット表示含む）
  DifficultyBadge.tsx    難易度バッジ
  FilterPanel.tsx        フィルタ・ソートパネル
  PlaylistModal.tsx      プレイリスト一覧モーダル
  PlaylistPicker.tsx     曲をプレイリストに追加するボトムシート
  TextageChart.tsx       譜面ビューアコンポーネント
lib/
  store.ts               Zustand グローバルストア
  storage.ts             localStorage 読み書き
  filter.ts              フィルタ・ソートロジック
  scraper.ts             Wiki HTML パーサー
  bpl.ts                 BPL プレイリスト定義・課題曲マッチング
  bpl-songs.ts           BPL Season 5 決勝課題曲の静的データ
  textage.ts             textage ノーツ取得
  textage-chart-parser.ts 譜面データパーサー
types/
  index.ts               型定義
```

## データフロー

### 曲データ
1. `GET /api/songs` でサーバーが BEMANI Wiki の新曲・旧曲リストを取得
2. パース結果を localStorage にキャッシュ（次回起動時はキャッシュを使用）
3. 初回起動時または「更新」ボタン押下時のみネットワークリクエストが発生する

### BPL プレイリスト
1. `lib/bpl-songs.ts` に BPL S5 決勝課題曲をカテゴリ・レベル別に静的データとして保持
2. `initSongs` / `fetchSongs` の完了時に `buildBplEntries()` でタイトル正規化マッチングを実行
3. マッチした楽曲を固定プレイリスト（`isFixed: true`）のエントリとして localStorage に保存

### メモ・カスタムプレイリスト
- すべて localStorage に保存。サーバーへの送信は行わない

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:3000` で起動する。

## デプロイ

Render の Web Service（Docker）で動作する。`render.yaml` に設定を記述済み。

```bash
# Docker でのビルド確認
docker build -t iidx-memo .
docker run -p 3000:3000 iidx-memo
```
