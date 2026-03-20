# My Virtual Pet (3D バーチャルペット)

Three.js を使用した、ブラウザ上で動作する 3D バーチャルペット育成アプリケーションです。
ペットのお世話をしたり、外見や性格をカスタマイズして自分だけのペットを育てることができます。

## 概要

このプロジェクトは、Webブラウザ上で直感的に操作できるインタラクティブな3Dペットアプリです。
HTML, CSS, JavaScript (Vanilla API) と 3Dグラフィックライブラリである Three.js を活用して構築されています。

## 主な機能 (Features)

- **3D レンダリングとアニメーション**: Three.js を用いた 3D 表現。ペットとのインタラクションによって様々なアニメーションが楽しめます。
- **お世話システム**: 
  - 🍖 **Feed (ごはん)**: 空腹度 (Hunger) を回復します。
  - 🎾 **Play (あそぶ)**: 幸福度 (Happiness) を回復します。
  - 💤 **Sleep (すいみん)**: 体力 (Energy) を回復します。
- **ステータス管理**: 各ステータスは時間経過とともに自動的に減少していきます。
- **性格 (Personality) カスタマイズ**: 性格を選ぶことで、ステータスの減少速度や変化量が変化します。
  - Normal (普通)
  - Energetic (元気)
  - Lazy (のんびり)
  - Glutton (くいしんぼう)
- **体型のカスタマイズ (Shape Customization)**: スライダー操作でペットの見た目をリアルタイムに変更可能です。
  - Body Length (胴体の長さ)
  - Head Size (頭の大きさ)
  - Ear Length (耳の長さ)
  - Leg Length (足の長さ)

## 使い方 (Usage)

1. ローカル開発環境でプロジェクトを開きます。
2. 簡易サーバー（例: VSCode の `Live Server` 拡張機能や、Python の `python -m http.server` など）を使用して `index.html` をホストします。
   - ※ Three.js を使用しているため、ローカルファイルの直接読み込み(`file://`)では CORS エラー等の制限がかかる場合があります。
3. ブラウザでアクセスし、ペットのお世話やカスタマイズをお楽しみください。

## ファイル構成

- `index.html` - アプリケーションのメインHTML。UIの構造が定義されています。
- `style.css` - UIのスタイリング情報を定義するCSS。
- `app.js` - UIへのイベントリスナーや、ステータス(Hunger, Happiness, Energy)の管理、および性格に応じたロジックを制御します。
- `pet3d.js` - Three.js を用いたペットの 3D モデル生成、レンダリング、アニメーション、および体型変更ロジックを管理します。

## 技術スタック (Tech Stack)

- HTML5
- CSS3
- JavaScript (ES6+)
- [Three.js](https://threejs.org/) (v128)
