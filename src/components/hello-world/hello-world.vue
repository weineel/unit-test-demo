<script setup lang="ts">
import { ref } from 'vue'
import { Counter } from '../counter'
import Ide from './ide.vue'
import Docs from './docs.vue'

withDefaults(
  defineProps<{ msg: string }>(),
  { msg: 'wn...' }
)

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <Ide ide="vscode" />

  <Docs />

  <Counter />
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}
</style>
