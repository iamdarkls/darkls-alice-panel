<script setup lang="ts">
type Kind = 'volume' | 'ring' | 'ring-reset' | 'wait' | 'alice' | 'if-weekend'
type Step = {kind: Kind; value: number | string | null | Step[]}
const props = defineProps<{steps: Step[]; depth: number}>()
const actions: [Kind, string, Step['value']][] = [
  ['volume','Громкость (%)',35], ['ring','Цвет кольца','#8b5cf6'],
  ['ring-reset','Вернуть кольцо Алисе',null], ['wait','Пауза (сек.)',2],
  ['alice','Команда Алисе',''], ['if-weekend','Если сегодня выходной',null],
]
function change(step: Step, event: Event) {
  const option = actions.find(([kind]) => kind === (event.target as HTMLSelectElement).value)
  if (!option) return
  step.kind = option[0]
  step.value = step.kind === 'if-weekend' ? [{kind:'wait', value:2}] : option[2]
}
function move(index: number, offset: number) {
  const [step] = props.steps.splice(index, 1)
  if (step) props.steps.splice(index + offset, 0, step)
}
</script>

<template>
  <ol class="scene-steps">
    <li v-for="(step,index) in steps" :key="index">
      <div class="row">
        <select :value="step.kind" aria-label="Действие" @change="change(step,$event)">
          <template v-for="[kind,label] in actions" :key="kind"><option v-if="kind !== 'if-weekend' || depth < 2" :value="kind">{{ label }}</option></template>
        </select>
        <input v-if="step.kind === 'ring'" v-model="step.value" aria-label="Цвет кольца" type="color">
        <input v-else-if="step.kind === 'alice'" v-model="step.value" aria-label="Текст команды" maxlength="200" required>
        <input v-else-if="step.kind === 'volume' || step.kind === 'wait'" v-model.number="step.value" aria-label="Значение" type="number" min="0" :max="step.kind === 'volume' ? 100 : 300" required>
        <button type="button" class="btn sm" aria-label="Выше" :disabled="!index" @click="move(index,-1)">↑</button>
        <button type="button" class="btn sm" aria-label="Ниже" :disabled="index === steps.length - 1" @click="move(index,1)">↓</button>
        <button type="button" class="btn sm" :disabled="steps.length === 1" @click="steps.splice(index,1)">Удалить шаг</button>
      </div>
      <div v-if="step.kind === 'if-weekend' && Array.isArray(step.value)" class="scene-branch">
        <SceneSteps :steps="step.value" :depth="depth+1"/>
      </div>
    </li>
  </ol>
  <button type="button" class="btn" :disabled="steps.length >= 24" @click="steps.push({kind:'wait',value:2})">Добавить шаг</button>
</template>
