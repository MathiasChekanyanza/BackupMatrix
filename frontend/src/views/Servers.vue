<template>
  <div class="px-4 sm:px-0">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Servers</h1>
    </div>

    <!-- Search/Filter -->
    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            v-model="search"
            type="text"
            class="input"
            placeholder="Search server name..."
            @input="loadServers"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Shop</label>
          <input
            v-model="shop"
            type="text"
            class="input"
            placeholder="Filter by shop..."
            @input="loadServers"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="activeFilter" @change="loadServers" class="input">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Servers Table -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
      <div v-else-if="servers.length === 0" class="text-center py-8 text-gray-500">
        No servers found
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Database</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Backup</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="server in servers" :key="server.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ server.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ server.shopName || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ server.databaseName || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ server.ip || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ server.lastBackupTime ? formatDate(server.lastBackupTime) : 'Never' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="server.lastBackupStatus" :class="getBadgeClass(server.lastBackupStatus)">
                  {{ server.lastBackupStatus }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link
                  :to="`/servers/${server.id}`"
                  class="text-blue-600 hover:text-blue-800"
                >
                  View Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="mt-6 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to 
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
          {{ pagination.total }} servers
        </div>
        <div class="flex space-x-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="btn btn-secondary text-sm"
            :class="{ 'opacity-50 cursor-not-allowed': pagination.page === 1 }"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page === pagination.pages"
            class="btn btn-secondary text-sm"
            :class="{ 'opacity-50 cursor-not-allowed': pagination.page === pagination.pages }"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import api from '@/services/api'

const loading = ref(false)
const servers = ref([])
const search = ref('')
const shop = ref('')
const activeFilter = ref('true')
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 1
})

onMounted(() => {
  loadServers()
})

async function loadServers() {
  loading.value = true
  try {
    const response = await api.getServers({
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value,
      shop: shop.value,
      active: activeFilter.value
    })
    servers.value = response.data.servers
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to load servers:', error)
  } finally {
    loading.value = false
  }
}

function changePage(newPage) {
  if (newPage >= 1 && newPage <= pagination.value.pages) {
    pagination.value.page = newPage
    loadServers()
  }
}

function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
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
