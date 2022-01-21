<template>
  <div class="rate">
    <div
      @mouseout="mouseOut"
      :class="`rate--${theme}`"
    >
      <span
        v-for="(e, index) in rate"
        :key="index"
        class="rate__star"
        @mouseover="mouseOver(index + 1)"
        @click="doConfirm(index + 1)"
      >
        {{e}}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

let props = defineProps({
  modelValue: { type: Number, required: true },
  theme: { type: String, default: "orange" },
})

const emits = defineEmits(['update:modelValue', 'change'])

const innerValue = ref(0)

watch(() => props.modelValue, nv => {
  if (nv >= 0 && nv <= 5) {
    innerValue.value = nv
  } else {
    innerValue.value = 0
  }
}, {
  immediate: true,
})

let rate = computed(() =>
  "★★★★★☆☆☆☆☆".slice(5 - innerValue.value, 10 - innerValue.value)
)

function mouseOver(value: number) {
  innerValue.value = value
}

function mouseOut() {
  innerValue.value = props.modelValue
}

function doConfirm(value: number) {
  innerValue.value = value
  emits('update:modelValue', innerValue.value)
  emits('change', innerValue.value)
}
</script>

<style lang="scss" scoped>
$themes: (
  "black": #000,
  "white": #fff,
  "red": #f5222d,
  "orange": #fa541c,
  "yellow": #fadb14,
  "green": #73d13d,
  "blue": #40a9ff,
);

.rate {
  display: inline-block;
  >div {
    display: inline-block;
  }
  &__star {
    cursor: pointer;
  }

  @each $name, $color in $themes {
    &--#{$name} {
      color: $color;
    }
  }
}
</style>
