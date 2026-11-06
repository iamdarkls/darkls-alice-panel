<template><div class="minibar" id="minibar" hidden>
  <div class="mb-track">
    <a class="mb-cover mu-cover" href="#player" title="Открыть плеер"><svg width="22" height="22" aria-hidden="true"><use href="#i-music"/></svg></a>
    <a class="mb-text" href="#player" title="Открыть плеер"><b class="mu-title">—</b><span class="mu-artist"></span></a>
    <button class="cbtn" data-mu="like" aria-label="Лайк"><svg width="18" height="18" aria-hidden="true"><use href="#i-like"/></svg></button>
  </div>
  <div class="mb-center">
    <div class="controls" data-mu-controls="bar"></div>
    <div class="progress"><span class="mu-pos">0:00</span><input type="range" class="mu-seek" min="0" max="100" value="0" step="1" aria-label="Позиция в треке"><span class="mu-dur">0:00</span></div>
  </div>
  <div class="mb-right">
    <svg width="18" height="18" aria-hidden="true"><use href="#i-vol"/></svg>
    <input type="range" class="mu-vol" min="0" max="100" step="5" aria-label="Громкость">
    <a class="cbtn" href="#player" aria-label="Открыть плеер"><svg width="18" height="18" aria-hidden="true"><use href="#i-expand"/></svg></a>
  </div>
</div>
<div id="toast" role="status" aria-live="polite"></div>
<div id="alarm-bar" role="alert" hidden>
  <svg class="ring-ic" width="22" height="22" aria-hidden="true"><use href="#i-alarm"/></svg>
  <div><b id="ab-title">Будильник звенит</b><div style="font-size:12.5px;opacity:.85" id="ab-sub"></div></div>
  <div class="actions"><button class="btn sm" id="ab-snooze">Отложить</button><button class="btn sm primary" id="ab-stop">Выключить</button></div>
</div>
</template>