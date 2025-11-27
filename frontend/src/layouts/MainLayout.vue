<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navigation -->
    <nav class="bg-white shadow-sm no-print">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-blue-600">BackupMatrix</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path === '/' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Dashboard
              </router-link>
              <router-link
                to="/servers"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path.startsWith('/servers') ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Servers
              </router-link>
              <router-link
                to="/reports"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                :class="$route.path === '/reports' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
              >
                Reports
              </router-link>
            </div>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-4">{{ authStore.user?.username }}</span>
            <button @click="authStore.logout" class="btn btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-white py-4 mt-8 no-print">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <button
          type="button"
          class="text-gray-400 hover:text-blue-600 hover:underline focus:outline-none"
          @click="showCredits = true"
        >
          Credits
        </button>
      </div>
    </footer>

    <!-- Credits Modal -->
    <div
      v-if="showCredits"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 no-print"
    >
      <div class="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Developed By</h3>
        <p class="text-gray-800 font-medium">Mathias Chekanyanza</p>
        <p class="text-gray-600 text-sm mb-4">Software Developer</p>
        <a
          href="https://mathiaschekanyanza.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-800 hover:underline text-sm"
        >
          View Portfolio
        </a>
        <div class="mt-6 text-right">
          <button
            type="button"
            class="btn btn-secondary text-sm px-4 py-1"
            @click="showCredits = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const showCredits = ref(false)
</script>
