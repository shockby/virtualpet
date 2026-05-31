# 🐶 My Virtual Pet (3D AI バーチャルペット)

Three.js を使用した、ブラウザ上で動作するインタラクティブな **3D AI バーチャルペット育成アプリケーション** です。  
Google Gemini API と Web Speech API を組み合わせることで、ペットとの音声での自然な対話が楽しめます。また、ペットの体型や性格を細かくカスタマイズできます。

---

## ✨ 主な機能 (Features)

### 1. 🤖 AI対話と高度な感情ロジック (Gemini AI 連携)
- **自然な日本語会話**: Google Gemini API (`gemini-2.0-flash-lite`等) を使用し、ペットとテキストや音声で自由に対話ができます。
- **感情とアニメーションの連動**: AIが会話の内容や飼い主の指示を解釈し、発言に最適な3Dアクション（喜ぶ、お座り、お手など）を自動で実行します。
- **体型への影響**: AIが「大きくなーれ！」といった言葉を理解し、体型を自動で変化させます。
- **お世話効果**: AIが「ご飯あげる」といった言葉に反応し、空腹度などのステータスを自動回復します。

### 2. 🗣️ 音声機能 (Speech-to-Text & Text-to-Speech)
- **音声入力**: 音声認識により、マイクを使ってハンズフリーでペットに話しかけられます。
- **音声読み上げ**: ペットの返答を音声で読み上げます。ペットの性格タイプ（normal, energetic, lazy, glutton）に合わせて、声のピッチ（高低）や読み上げ速度が変化します。

### 3. 🍖 インタラクティブな3Dアクション & お世話
- **骨投げ (Fetch)**: 「骨を投げる」と指示するか、骨投げボタンを押すと、3D空間に投げられた骨をペットが自ら走って追いかけ、くわえて戻ってくる高度な物理アニメーションが楽しめます。
- **お世話コマンド**: ごはん (Feed)、あそぶ (Play)、すいみん (Sleep) でペットのお腹、幸福度、体力をケア。
- **ステータス管理**: 時間の経過とともに減少するお腹や体力を適切に維持する必要があります。

### 4. ⚙️ クォータ節約設計 & フォールバック（APIの無駄使い防止）
APIの無料枠制限（429エラー）を安全に回避するための堅牢な仕組みを実装しています。
- **モデル自動フォールバックチェーン**: `gemini-2.0-flash-lite` ＞ `gemini-1.5-flash` ＞ `gemini-1.5-pro` の順に自動で切り替え、指数バックオフで再試行します。
- **インテリジェントな「ひとりごと」**: 放置時にペットが自発的に思考を表示する際、APIリクエストの間隔を制限（最低10分に1回）。APIを使わない「ローカル定型文」と組み合わせて、トークン消費を最小限に抑えます。
- **1日のAPI制限機能**: 1日のリクエスト上限（50回）をブラウザ側でカウント。上限超過時は安全にAPIアクセスをブロックし、ペットがおやすみモードに入ります。

### 5. 🎨 洗練されたグラスモーフィックUI
- 画面を3Dキャンバスとチャットログのみに絞り込み、極限までクリーンに。
- お世話、性格設定、体型スライダーなどのカスタマイズ要素は、美しい半透明のグラスモーフィックモーダルへ集約し、没入感を高めました。
- **ペットの名前設定**: ペットの名前をカスタマイズでき、「○○の部屋」としてUI全体およびAIのシステムプロンプトにリアルタイムで同期・永続化（`localStorage`）されます。

---

## 🔑 APIキーの設定とセキュリティについて

本アプリは、ブラウザ側から直接 Google AI Studio の Gemini API を呼び出します。

1. [Google AI Studio](https://aistudio.google.com/) で無料のAPIキーを取得します。
2. 画面右上の **🔑 Config Key** よりAPIキーを入力して「Save」してください。

> [!WARNING]
> **セキュリティ上の重要事項**  
> 入力されたAPIキーは、ブラウザの `localStorage` に平文で保存されます。  
> 外部サーバーへキーが送信されることはありませんが、**学校やカフェなどの共有PC、他人と共有するブラウザ環境では絶対に入力しないでください**。

---

## 🚀 デプロイ方法 (Cloudflare Pages)

本プロジェクトはビルドステップがないため、非常に簡単に Cloudflare Pages にデプロイできます。

### 方法1: GitHub 連携 (推奨)
1. Cloudflare ダッシュボードで **[Workers & Pages]** ＞ **[Create application]** ＞ **[Pages]** タブを開き、**[Connect to Git]** をクリックします。
2. 本リポジトリを選択し、以下のビルド設定を適用します。
   - **Framework preset**: `None`
   - **Build command**: *(空欄)*
   - **Build output directory**: `.` (ルート)
3. **[Save and Deploy]** をクリックするだけで、以降は `main` へのマージのたびに自動的に全世界へリリースされます。

### 方法2: CLIから直接デプロイ
Wrangler CLI を利用して直接デプロイすることもできます。
```bash
npx wrangler pages deploy .
```

---

## 📂 ファイル構成

- `index.html` - 美しいグラスモーフィックUIと各種設定モーダルを備えたメインHTML。
- `style.css` - ガラスエフェクト（backdrop-filter）、ダークモード、洗練されたアニメーションを定義するCSS。
- `app.js` - UIイベント、ステータス減衰ループ、APIキー管理、音声認識/合成、AIリクエストおよびフォールバック制御などを司るメインロジック。
- `pet3d.js` - Three.js を用いたペットモデルの組み立て、ボーン駆動型アニメーション（fetch, paw, sit, idle, happy, sleep）、体型パラメトリック変形処理の制御。
- `wrangler.toml` - Cloudflare Pagesの直接デプロイ設定。

---

## 🛠️ 技術スタック (Tech Stack)

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ Vanilla)
- **3D Graphics**: [Three.js](https://threejs.org/) (v128)
- **AI Integration**: Google Generative AI (Gemini API v1beta)
- **Voice Control**: Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Platform**: Cloudflare Pages / Wrangler
