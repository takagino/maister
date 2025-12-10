// 必要な「道具（ライブラリ）」を読み込む
import { Hono } from 'hono'; // Webサーバーを作るためのフレームワーク
import { cors } from 'hono/cors'; // 異なる場所（URL）からの通信を許可する機能
import { GoogleGenAI } from '@google/genai'; // GoogleのAI「Gemini」を使うための公式ツール

// 環境変数（秘密の鍵など）の型（タイプ）を定義する
// TypeScriptでは「c.envの中にはこれが入っているはずだ」と教えてあげる必要があります
type Bindings = {
  GEMINI_API_KEY: string;
};

// アプリケーション（サーバー）の作成
// <{ Bindings: Bindings }> は「このサーバーは上記の環境変数を使います」という宣言
const app = new Hono<{ Bindings: Bindings }>();

// 【CORSの設定】
// どのサイトからでもアクセスできるように許可証を発行する（授業用なので全許可 '*'）
app.use('/*', cors());

// 【生存確認用のルート】
// ブラウザでこのURLにアクセスした時に「動いてるよ！」と返事をするだけの場所
app.get('/', (c) => c.text('Gemini Worker is running!'));

// --- 便利関数 ---
// 【JSON抽出関数】
// AIがおしゃべりで「答えは { ... } です」のように余計な文字をつけてきた時に、
// データの本体である「{ ... }」の部分だけを綺麗に切り抜く関数
const extractJson = (rawString: string): string => {
  // 1. 最初の波カッコ '{' が何文字目にあるか探す
  const start = rawString.indexOf('{');

  // もし '{' が見つからなかったら、そのまま返す（諦める）
  if (start === -1) return rawString;

  // 2. カッコの対応を数えて、正しい終わりの '}' を見つける
  let depth = 0; // カッコの深さ（開いたら+1、閉じたら-1）

  for (let i = start; i < rawString.length; i++) {
    if (rawString[i] === '{') depth++; // 開くカッコがあったら深くなる
    if (rawString[i] === '}') depth--; // 閉じるカッコがあったら浅くなる

    // 深さが0に戻った瞬間＝そこがJSONの終わり！
    if (depth === 0) {
      // 最初からそこまでを切り取って返す
      return rawString.substring(start, i + 1);
    }
  }

  // 最後まで終わりのカッコが見つからなかったら、そのまま返す
  return rawString;
};

// --- メインの処理 ---
// 【AI分析の窓口】
// ゲーム画面からデータ（POSTリクエスト）が届いたらここが動く
app.post('/api/gemini', async (c) => {
  try {
    // 1. ゲームから送られてきたデータ（リクエストボディ）を受け取る
    // <{ prompt: string; instruction?: string }> はデータの形を定義している
    const body = await c.req.json<{ prompt: string; instruction?: string }>();

    const userPrompt = body.prompt; // ユーザーの入力（例：「月面」）

    // システムへの指示（キャラ設定）。もし送られてこなかったらデフォルト値を使う
    const systemInstruction =
      body.instruction || 'あなたは有能なアシスタントです。';

    // 2. 入力チェック：もしプロンプトが空っぽだったらエラーを返す
    if (!userPrompt) {
      return c.json({ error: 'プロンプトが必要です' }, 400);
    }

    // 3. 秘密のAPIキーを環境変数から取り出す
    const apiKey = c.env.GEMINI_API_KEY;

    // キーが設定されていなかったらエラー（先生の設定ミスなどを検知）
    if (!apiKey) {
      return c.json({ error: 'APIキーが設定されていません' }, 500);
    }

    // 4. Geminiを起動する（キーをセット）
    const genai = new GoogleGenAI({ apiKey: apiKey });

    // 5. AIに願い事（リクエスト）を送る
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash-lite', // モデル名
      config: {
        responseMimeType: 'application/json', // 「必ずJSON形式で返してね」という指示
        systemInstruction: systemInstruction, // AIへのキャラ設定
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }], // ユーザーの言葉
        },
      ],
    });

    // 6. AIからの返事を受け取る
    // .text() メソッドを使ってテキストを取り出す
    const responseText = result.text;

    // 7. 余計な文字を取り除いて、綺麗なJSONデータにする
    const cleanText = extractJson(responseText);

    // 8. 文字列をプログラムで使えるオブジェクトに変換（パース）する
    const jsonResponse = JSON.parse(cleanText);

    // 9. 完成したデータをゲームに送り返す
    return c.json({ result: jsonResponse });
  } catch (error) {
    // 何か予期せぬエラーが起きたら、ログを出してエラーメッセージを返す
    console.error(error);
    return c.json({ error: 'AIエラーが発生しました' }, 500);
  }
});

// このアプリを公開する
export default app;
