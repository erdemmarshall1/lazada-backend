<template>
  <div class="seller-order-chart">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()

  const labels = props.data.map(d => d._id)
  const counts = props.data.map(d => d.count || 0)

  const ctx = chartRef.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Orders',
        data: counts,
        borderColor: '#722ed1',
        backgroundColor: 'rgba(114, 46, 209, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#722ed1',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#e8e6e2',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} orders`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#999', font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
          ticks: {
            color: '#999',
            font: { size: 11 },
            stepSize: Math.max(1, Math.ceil(Math.max(...counts, 1) / 5)),
          },
        },
      },
      interaction: { intersect: false, mode: 'index' },
    },
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>

<style scoped>
.seller-order-chart { width: 100%; height: 220px; }
.seller-order-chart canvas { width: 100% !important; height: 100% !important; }
</style>
