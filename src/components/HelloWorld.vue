<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
})

const count = ref(0)
</script>

<template>
  <section class="card">
    <p class="eyebrow">Vue.js + JavaScript</p>
    <h1>{{ title }}</h1>
    <p>Môi trường phát triển đã sẵn sàng.</p>
    <button type="button" @click="count++">Đã nhấn {{ count }} lần</button>
  </section>
</template>
