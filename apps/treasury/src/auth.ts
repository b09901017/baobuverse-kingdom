// 登入。畫面只用這裡的三個函式：階段 2 的 APK 殼裡 Google 會擋 WebView 登入，
// 那時只換這個檔的做法（原生登入拿到憑證再 signInWithCredential），畫面不用改。

import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { auth, onHostedDomain, useEmulators } from "./firebase";

/** 目前登入的帳號。只留畫面要的：不拿 email */
export interface Session {
  readonly uid: string;
  readonly name: string | null;
}

/** 登入狀態改變時呼叫（一開始也會呼叫一次）；回傳取消監聽 */
export function watchSession(onChange: (session: Session | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    onChange(user ? { uid: user.uid, name: user.displayName } : null);
  });
}

/**
 * Google 登入。部署的網址上用 redirect（手機的 PWA 常擋 popup）；本機開發用 popup
 * （本機跟登入的網域不同，redirect 在擋第三方儲存的瀏覽器會失敗）。
 */
export async function signIn(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  // 模擬器的假登入也用 redirect：Claude 的內建瀏覽器開不了 popup
  if (onHostedDomain || useEmulators) await signInWithRedirect(auth, provider);
  else await signInWithPopup(auth, provider);
}

/** redirect 登入回來時，把失敗的原因交給畫面（成功的話 watchSession 會收到） */
export async function redirectError(): Promise<string | null> {
  try {
    await getRedirectResult(auth);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}
