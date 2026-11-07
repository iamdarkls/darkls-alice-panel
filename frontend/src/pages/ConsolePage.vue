<template>
    <header class="page-head">
      <div><h1>Консоль</h1><div class="sub">Интерактивная оболочка на колонке, от root</div></div>
      <div class="actions"><span class="badge" id="term-state">—</span><button class="btn sm" id="term-new">Новый сеанс</button></div>
    </header>
    <section class="card term-card"><div class="term-keys" aria-label="Клавиши терминала">
      <button v-for="[key,label] in [['esc','Esc'],['tab','Tab'],['up','↑'],['down','↓'],['left','←'],['right','→'],['interrupt','Ctrl+C'],['eof','Ctrl+D']]" :key="key" class="btn sm" type="button" :data-term-key="key">{{ label }}</button>
    </div><div class="term" id="term"></div></section>
    <p class="hint">Работает как обычный терминал: Tab — дополнение, ↑ / ↓ — история, Ctrl+C — прервать, Ctrl+D или <code>exit</code> — закрыть.
      Копировать — выделить мышью (или Ctrl+C при выделении), вставить — Ctrl+Shift+V. Программы из пакетов yam доступны по имени.</p>
  </template>