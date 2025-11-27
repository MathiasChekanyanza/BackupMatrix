<template>
  <div class="px-4 sm:px-0">
    <div class="mb-6">
      <router-link to="/servers" class="text-blue-600 hover:text-blue-800 text-sm">
        ← Back to Servers
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    
    <div v-else-if="server">
      <!-- Server Info -->
      <div class="card mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ server.name }}</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span class="text-sm font-medium text-gray-500">Shop:</span>
            <span class="ml-2 text-sm text-gray-900">{{ server.shopName || '-' }}</span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">Database:</span>
            <span class="ml-2 text-sm text-gray-900">{{ server.databaseName || '-' }}</span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">IP:</span>
            <span class="ml-2 text-sm text-gray-900">{{ server.ip || '-' }}</span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">Last Backup:</span>
            <span class="ml-2 text-sm text-gray-900">
              {{ server.lastBackupTime ? formatDate(server.lastBackupTime) : 'Never' }}
            </span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500">Last Status:</span>
            <span v-if="server.lastBackupStatus" class="ml-2" :class="getBadgeClass(server.lastBackupStatus)">
              {{ server.lastBackupStatus }}
            </span>
            <span v-else class="ml-2 text-sm text-gray-400">-</span>
          </div>
        </div>
      </div>

      <!-- Stats (Last 30 Days) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="card">
          <div class="text-sm font-medium text-gray-500">Successful (30d)</div>
          <div class="mt-2 text-2xl font-semibold text-green-600">{{ stats.success }}</div>
        </div>
        <div class="card">
          <div class="text-sm font-medium text-gray-500">Failed (30d)</div>
          <div class="mt-2 text-2xl font-semibold text-red-600">{{ stats.failed }}</div>
        </div>
        <div class="card">
          <div class="text-sm font-medium text-gray-500">Partial (30d)</div>
          <div class="mt-2 text-2xl font-semibold text-yellow-600">{{ stats.partial }}</div>
        </div>
      </div>

      <!-- Backup History -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Backup History (Last 30)</h2>
        <div v-if="backupEvents.length === 0" class="text-center py-8 text-gray-500">
          No backup history found
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="event in backupEvents" :key="event.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ event.message || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import api from '@/services/api'

const route = useRoute()
const loading = ref(false)
const server = ref(null)
const backupEvents = ref([])
const stats = ref({ success: 0, failed: 0, partial: 0 })

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.getServerDetails(route.params.id)
    server.value = response.data.server
    backupEvents.value = response.data.backupEvents
    stats.value = response.data.stats.last30Days
  } catch (error) {
    console.error('Failed to load server details:', error)
  } finally {
    loading.value = false
  }
})

function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
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
