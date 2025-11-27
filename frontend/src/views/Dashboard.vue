<template>
  <div class="px-4 sm:px-0">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="text-sm font-medium text-gray-500">Total Servers</div>
        <div class="mt-2 text-3xl font-semibold text-gray-900">{{ stats.totalServers }}</div>
      </div>
      <div class="card">
        <div class="text-sm font-medium text-gray-500">Reported Today</div>
        <div class="mt-2 text-3xl font-semibold text-green-600">{{ stats.reportedToday }}</div>
      </div>
      <div class="card">
        <div class="text-sm font-medium text-gray-500">Failed Today</div>
        <div class="mt-2 text-3xl font-semibold text-red-600">{{ stats.failedToday }}</div>
      </div>
      <div class="card">
        <div class="text-sm font-medium text-gray-500">Missing Today</div>
        <div class="mt-2 text-3xl font-semibold text-yellow-600">{{ stats.missingToday }}</div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Backup Activity (Last 7 Days)</h2>
      <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
      <div v-else-if="recentEvents.length === 0" class="text-center py-8 text-gray-500">
        No recent activity
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="event in recentEvents.slice(0, 20)" :key="event.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ event.serverName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ event.shopName || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(event.backupTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getBadgeClass(event.status)">
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatSize(event.sizeBytes) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDuration(event.durationSeconds) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import api from '@/services/api'

const loading = ref(false)
const stats = ref({
  totalServers: 0,
  reportedToday: 0,
  failedToday: 0,
  missingToday: 0
})
const recentEvents = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.getDashboardStats()
    stats.value = response.data.summary
    recentEvents.value = response.data.recentEvents
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  } finally {
    loading.value = false
  }
})

function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, HH:mm')
}

function formatSize(bytes) {
  if (!bytes) return '-'
  const gb = bytes / (1024 ** 3)
  return `${gb.toFixed(2)} GB`
}

function formatDuration(seconds) {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function getBadgeClass(status) {
  const classes = {
    success: 'badge badge-success',
    failed: 'badge badge-failed',
    partial: 'badge badge-missing'
  }
  return classes[status] || 'badge'
}
</script>
