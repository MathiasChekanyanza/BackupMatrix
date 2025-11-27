<template>
  <div class="px-4 sm:px-0">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Backup Reports</h1>

    <!-- Date Range Selection -->
    <div class="card mb-6 no-print">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input v-model="fromDate" type="date" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input v-model="toDate" type="date" class="input" />
        </div>
        <div>
          <button @click="generateReport" class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? 'Generating...' : 'Generate Report' }}
          </button>
        </div>
      </div>
      <div class="flex space-x-4 mt-4">
        <button @click="setLastWeek" class="text-sm text-blue-600 hover:text-blue-800">Last 7 Days</button>
        <button @click="setLastMonth" class="text-sm text-blue-600 hover:text-blue-800">Last 30 Days</button>
        <button @click="setThisMonth" class="text-sm text-blue-600 hover:text-blue-800">This Month</button>
      </div>
    </div>

    <!-- Export Buttons -->
    <div v-if="matrixData" class="mb-6 no-print flex space-x-4">
      <button @click="exportPDF" class="btn btn-primary">
        📄 Export PDF
      </button>
      <button @click="exportExcel" class="btn btn-success">
        📊 Export Excel
      </button>
      <button @click="handlePrint" class="btn btn-secondary">
        🖨️ Print
      </button>
    </div>

    <!-- Matrix Display -->
    <div v-if="matrixData" class="card overflow-x-auto">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Backup Matrix: {{ formatDate(matrixData.fromDate) }} to {{ formatDate(matrixData.toDate) }}
      </h2>
      
      <table class="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-700 text-white">
            <th class="border border-gray-300 px-4 py-2 text-left">Shop</th>
            <th class="border border-gray-300 px-4 py-2 text-left">Server</th>
            <th
              v-for="date in matrixData.dates"
              :key="date"
              class="border border-gray-300 px-2 py-2 text-center text-xs"
            >
              {{ formatDateHeader(date) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="server in matrixData.servers" :key="server.serverId" class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-2 bg-gray-100 font-medium">
              {{ server.shopName || server.serverName }}
            </td>
            <td class="border border-gray-300 px-4 py-2 bg-gray-50 text-sm">
              {{ server.serverName }}
            </td>
            <td
              v-for="date in matrixData.dates"
              :key="`${server.serverId}-${date}`"
              class="border border-gray-300 px-2 py-2 text-center"
              :class="getCellClass(server.days[formatDateKey(date)]?.status)"
            >
              {{ getCellSymbol(server.days[formatDateKey(date)]?.status) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Legend -->
      <div class="mt-6 flex items-center space-x-6 text-sm">
        <div class="flex items-center">
          <div class="w-6 h-6 bg-green-200 border border-gray-300 mr-2"></div>
          <span>✓ Success</span>
        </div>
        <div class="flex items-center">
          <div class="w-6 h-6 bg-red-200 border border-gray-300 mr-2"></div>
          <span>✗ Failed</span>
        </div>
        <div class="flex items-center">
          <div class="w-6 h-6 bg-yellow-100 border border-gray-300 mr-2"></div>
          <span>— No Report</span>
        </div>
      </div>
    </div>

    <!-- Compliance Summary -->
    <div v-if="compliance" class="card mt-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Compliance Summary</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Success Days</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Days</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in compliance" :key="item.serverName">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ item.serverName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ item.shopName || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                <span
                  class="font-semibold"
                  :class="item.compliancePercent >= 90 ? 'text-green-600' : item.compliancePercent >= 70 ? 'text-yellow-600' : 'text-red-600'"
                >
                  {{ item.compliancePercent }}%
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {{ item.successDays }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {{ item.totalDays }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import api from '@/services/api'

const loading = ref(false)
const fromDate = ref(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
const toDate = ref(format(new Date(), 'yyyy-MM-dd'))
const matrixData = ref(null)
const compliance = ref(null)

async function generateReport() {
  loading.value = true
  try {
    const response = await api.getMatrixData(fromDate.value, toDate.value)
    matrixData.value = response.data.matrix
    compliance.value = response.data.compliance
  } catch (error) {
    console.error('Failed to generate report:', error)
    alert('Failed to generate report')
  } finally {
    loading.value = false
  }
}

async function exportPDF() {
  try {
    const response = await api.exportPDF(fromDate.value, toDate.value, `Backup Report ${fromDate.value} to ${toDate.value}`)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup-report-${fromDate.value}-to-${toDate.value}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    alert('Failed to export PDF')
  }
}

async function exportExcel() {
  try {
    const response = await api.exportExcel(fromDate.value, toDate.value, `Backup Report ${fromDate.value} to ${toDate.value}`)
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup-report-${fromDate.value}-to-${toDate.value}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export Excel:', error)
    alert('Failed to export Excel')
  }
}

function handlePrint() {
  try {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print()
    } else {
      alert('Printing is not supported in this environment')
    }
  } catch (error) {
    console.error('Failed to trigger print:', error)
    alert('Failed to trigger print')
  }
}

function setLastWeek() {
  fromDate.value = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  toDate.value = format(new Date(), 'yyyy-MM-dd')
}

function setLastMonth() {
  fromDate.value = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  toDate.value = format(new Date(), 'yyyy-MM-dd')
}

function setThisMonth() {
  const now = new Date()
  fromDate.value = format(startOfMonth(now), 'yyyy-MM-dd')
  toDate.value = format(endOfMonth(now), 'yyyy-MM-dd')
}

function formatDate(dateString) {
  return format(new Date(dateString), 'MMM dd, yyyy')
}

function formatDateHeader(dateString) {
  return format(new Date(dateString), 'MMM dd')
}

function formatDateKey(dateString) {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCellClass(status) {
  if (status === 'success') return 'bg-green-200'
  if (status === 'failed') return 'bg-red-200'
  return 'bg-yellow-100'
}

function getCellSymbol(status) {
  if (status === 'success') return '✓'
  if (status === 'failed') return '✗'
  return '—'
}
</script>
