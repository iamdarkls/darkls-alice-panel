<template>
    <section class="card conn-card" role="status" aria-live="polite">
      <div class="conn-ring" id="cs-ring"></div>
      <h1 id="cs-title">Подключение…</h1>
      <p id="cs-text"></p>
      <div class="addr" id="cs-addr"></div>
      <button class="btn" id="cs-retry" hidden>Повторить сейчас</button>
      <form class="login" id="cs-login" hidden>
        <input type="text" name="username" value="panel" autocomplete="username" hidden>
        <input type="password" class="field" id="cs-pass" autocomplete="current-password" placeholder="Пароль" aria-label="Пароль" required>
        <button class="btn primary" id="cs-login-btn">Войти</button>
        <p class="login-err" id="cs-login-err" role="alert"></p>
      </form>
      <details id="cs-log-box" hidden><summary>Лог подключения</summary><pre class="out" id="cs-log"></pre></details>
    </section>
  </template>