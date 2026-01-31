<template>
  <div class="container">
    <div class="header">
      <h1>Flux App Analyzer</h1>
      <p>Analyze app registrations on the Flux network from any time period</p>
    </div>

    <div class="controls">
      <div class="input-group">
        <label for="startDate">Start Date & Time (UTC)</label>
        <input
          id="startDate"
          v-model="startDate"
          type="datetime-local"
          @change="validateDates"
        />
      </div>

      <div class="input-group">
        <label for="endDate">End Date & Time (UTC) - Optional</label>
        <input
          id="endDate"
          v-model="endDate"
          type="datetime-local"
          @change="validateDates"
        />
      </div>

      <button class="btn" @click="analyze" :disabled="loading || !startDate">
        {{ loading ? 'Analyzing...' : 'Analyze' }}
      </button>
    </div>

    <div v-if="error" class="error">
      <strong>Error:</strong> {{ error }}
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <div>{{ loadingMessage }}</div>
    </div>

    <template v-if="results && !loading">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card">
          <div class="card-title">New Apps</div>
          <div class="card-value">{{ results.summary.newApps }}</div>
          <div class="card-subtitle">{{ results.rates.appsPerDay }}/day</div>
        </div>

        <div class="card">
          <div class="card-title">Total Instances</div>
          <div class="card-value">{{ results.summary.totalInstances }}</div>
          <div class="card-subtitle">{{ results.rates.instancesPerDay }}/day</div>
        </div>

        <div class="card">
          <div class="card-title">Multi-Component</div>
          <div class="card-value">{{ results.summary.multiComponentApps }}</div>
          <div class="card-subtitle">{{ ((results.summary.multiComponentApps / results.summary.newApps) * 100).toFixed(1) }}% of total</div>
        </div>

        <div class="card">
          <div class="card-title">Time Period</div>
          <div class="card-value">{{ results.timeSinceStart.days }}</div>
          <div class="card-subtitle">days ({{ results.timeSinceStart.hours }} hours)</div>
        </div>

        <div class="card">
          <div class="card-title">Block Range</div>
          <div class="card-value">{{ results.heightRange.difference.toLocaleString() }}</div>
          <div class="card-subtitle">{{ results.heightRange.min }} → {{ results.heightRange.max }}</div>
          <div class="card-subtitle">Avg: {{ results.heightRange.avgBlockTime }}s/block</div>
        </div>

        <div class="card">
          <div class="card-title">Orbit Apps</div>
          <div class="card-value">{{ results.summary.orbitApps }}</div>
          <div class="card-subtitle">{{ ((results.summary.orbitApps / results.summary.newApps) * 100).toFixed(1) }}% of total</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts">
        <div class="chart-container">
          <h3>Apps by Owner (Top 10)</h3>
          <Bar :data="ownerChartData" :options="chartOptions" />
        </div>

        <div class="chart-container">
          <h3>Instances Distribution (Top 10)</h3>
          <Doughnut :data="instancesChartData" :options="doughnutOptions" />
        </div>

        <div class="chart-container">
          <h3>Apps Over Time</h3>
          <Line :data="timelineChartData" :options="timelineOptions" />
        </div>

        <div class="chart-container">
          <h3>App Categories</h3>
          <Pie :data="categoryChartData" :options="doughnutOptions" />
        </div>

        <div v-if="orbitChartData" class="chart-container">
          <h3>Orbit vs Non-Orbit Apps</h3>
          <Doughnut :data="orbitChartData" :options="doughnutOptions" />
        </div>

        <div v-if="multiComponentChartData" class="chart-container">
          <h3>Multi-Component Apps</h3>
          <Pie :data="multiComponentChartData" :options="doughnutOptions" />
        </div>

      </div>

      <!-- High Instance Apps List -->
      <div v-if="highInstanceApps.length > 0" class="section">
        <h2>Apps with >10 Instances ({{ highInstanceApps.length }})</h2>
        <div class="high-instance-grid">
          <div v-for="(app, index) in highInstanceApps" :key="app.name" class="high-instance-card">
            <div class="high-instance-header">
              <div class="high-instance-rank">#{{ index + 1 }}</div>
              <div class="high-instance-name">{{ app.name }}</div>
            </div>
            <div class="high-instance-chips">
              <div class="chip chip-instances">
                <span class="chip-icon">🖥️</span>
                <span class="chip-label">{{ app.instances }} instance{{ app.instances > 1 ? 's' : '' }}</span>
              </div>
              <div class="chip chip-components">
                <span class="chip-icon">📦</span>
                <span class="chip-label">{{ app.components }} component{{ app.components > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="app.isOrbitApp" class="chip chip-orbit">
                <span class="chip-icon">🚀</span>
                <span class="chip-label">Orbit</span>
              </div>
            </div>
            <div class="high-instance-owner">
              <span class="owner-icon">👤</span>
              <span class="owner-text">{{ app.owner.substring(0, 24) }}...</span>
            </div>
            <div v-if="app.repotags && app.repotags.length > 0" class="high-instance-repotags">
              <div class="repotag-label">🏷️ Docker Images:</div>
              <div class="repotag-chips">
                <div v-for="tag in app.repotags" :key="tag" class="repotag-chip">
                  {{ tag }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Owners -->
      <div class="section">
        <h2>Top 10 App Owners</h2>
        <div class="top-owners-grid">
          <div v-for="(owner, index) in results.topOwners.slice(0, 10)" :key="owner.owner" class="top-owner-card">
            <div class="top-owner-header">
              <div class="top-owner-rank">#{{ index + 1 }}</div>
              <div class="top-owner-address">{{ owner.owner }}</div>
            </div>
            <div class="top-owner-chips">
              <div class="chip chip-apps">
                <span class="chip-icon">📱</span>
                <span class="chip-label">{{ owner.apps }} app{{ owner.apps > 1 ? 's' : '' }}</span>
              </div>
              <div class="chip chip-total-instances">
                <span class="chip-icon">💻</span>
                <span class="chip-label">{{ owner.instances }} instance{{ owner.instances > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Orbit Apps List -->
      <div v-if="results.orbitApps.length > 0" class="section">
        <h2>Orbit Apps ({{ results.orbitApps.length }})</h2>
        <RecycleScroller
          class="app-scroller"
          :items="results.orbitApps"
          :item-size="140"
          key-field="name"
          v-slot="{ item, index }"
        >
          <div class="app-item">
            <div class="app-header">
              <div class="app-name">
                {{ index + 1 }}. {{ item.name }}
                <span v-if="item.isMultiComponent" class="app-badge">{{ item.components }} components</span>
              </div>
            </div>
            <div class="app-details">
              <div class="app-detail">
                <span class="app-detail-label">Date</span>
                <span>{{ formatDate(item.date) }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Height</span>
                <span>{{ item.height.toLocaleString() }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Instances</span>
                <span>{{ item.instances }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Owner</span>
                <span style="font-family: monospace; font-size: 0.8rem;">{{ item.owner }}</span>
              </div>
              <div v-if="item.repotags && item.repotags.length > 0" class="app-detail" style="grid-column: 1 / -1;">
                <span class="app-detail-label">Repotags</span>
                <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">{{ item.repotags.join(', ') }}</span>
              </div>
            </div>
          </div>
        </RecycleScroller>
      </div>

      <!-- All Apps List -->
      <div class="section">
        <h2>All New Apps ({{ results.newApps.length }})</h2>
        <RecycleScroller
          class="app-scroller"
          :items="results.newApps"
          :item-size="140"
          key-field="name"
          v-slot="{ item, index }"
        >
          <div class="app-item">
            <div class="app-header">
              <div class="app-name">
                {{ index + 1 }}. {{ item.name }}
                <span v-if="item.isMultiComponent" class="app-badge">{{ item.components }} components</span>
                <span v-if="item.isOrbitApp" class="app-badge orbit-badge">Orbit</span>
              </div>
            </div>
            <div class="app-details">
              <div class="app-detail">
                <span class="app-detail-label">Date</span>
                <span>{{ formatDate(item.date) }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Height</span>
                <span>{{ item.height.toLocaleString() }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Instances</span>
                <span>{{ item.instances }}</span>
              </div>
              <div class="app-detail">
                <span class="app-detail-label">Owner</span>
                <span style="font-family: monospace; font-size: 0.8rem;">{{ item.owner }}</span>
              </div>
              <div v-if="item.repotags && item.repotags.length > 0" class="app-detail" style="grid-column: 1 / -1;">
                <span class="app-detail-label">Repotags</span>
                <span style="font-family: monospace; font-size: 0.75rem; word-break: break-all;">{{ item.repotags.join(', ') }}</span>
              </div>
            </div>
          </div>
        </RecycleScroller>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Bar, Doughnut, Line, Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const API_BASE = 'https://api.runonflux.io'

// Fork constants - PON fork where chain became 4x faster
const FORK_BLOCK_HEIGHT = 2020000
const BLOCK_TIME_PRE_FORK = 120 // seconds (2 minutes)
const BLOCK_TIME_POST_FORK = 30 // seconds (0.5 minutes)

// Reactive state
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const loadingMessage = ref('')
const error = ref('')
const results = ref(null)

// Set default date (AMA date)
const now = new Date()
startDate.value = '2026-01-28T17:00'

// Validate dates
const validateDates = () => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    if (end <= start) {
      error.value = 'End date must be after start date'
      return false
    }
  }
  error.value = ''
  return true
}

// Format date helper
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  })
}

// Calculate fork-aware average block time
const calculateAverageBlockTime = (minHeight, maxHeight) => {
  if (minHeight === maxHeight) return 0

  const totalBlocks = maxHeight - minHeight

  // Case 1: Both heights are pre-fork
  if (maxHeight <= FORK_BLOCK_HEIGHT) {
    return BLOCK_TIME_PRE_FORK
  }

  // Case 2: Both heights are post-fork
  if (minHeight >= FORK_BLOCK_HEIGHT) {
    return BLOCK_TIME_POST_FORK
  }

  // Case 3: Height range spans the fork
  const preForkBlocks = FORK_BLOCK_HEIGHT - minHeight
  const postForkBlocks = maxHeight - FORK_BLOCK_HEIGHT

  const preForkTime = preForkBlocks * BLOCK_TIME_PRE_FORK
  const postForkTime = postForkBlocks * BLOCK_TIME_POST_FORK
  const totalTime = preForkTime + postForkTime

  return totalTime / totalBlocks
}

// Categorize apps
const categorizeApp = (appName) => {
  const name = appName.toLowerCase()
  if (name.includes('wordpress')) return 'WordPress'
  if (name.includes('conduit')) return 'Conduit'
  if (name.includes('presearch')) return 'Presearch'
  if (name.includes('flux') || name.includes('terraria') || name.includes('valheim') ||
      name.includes('rust') || name.includes('zomboid') || name.includes('enshrouded') ||
      name.includes('soulmask') || name.includes('forest')) return 'Game Servers'
  if (name.includes('node')) return 'Blockchain Nodes'
  return 'Other'
}

// Check if app uses Orbit images
const usesOrbitImage = (compose) => {
  if (!Array.isArray(compose)) return false

  return compose.some(component => {
    const repotag = component.repotag || ''
    return repotag.toLowerCase().includes('orbit')
  })
}

// Fetch and analyze data
const analyze = async () => {
  if (!validateDates()) return

  loading.value = true
  error.value = ''
  results.value = null

  try {
    loadingMessage.value = 'Fetching permanent messages from Flux API...'

    const response = await fetch(`${API_BASE}/apps/permanentmessages`)
    const data = await response.json()

    if (data.status !== 'success') {
      throw new Error('Failed to fetch data from API')
    }

    const messages = data.data

    loadingMessage.value = 'Filtering fluxappregister messages...'

    // Filter for fluxappregister messages
    const registerMessages = messages.filter(msg => msg.type === 'fluxappregister')

    // Convert dates to timestamps
    const startTimestamp = new Date(startDate.value + ':00Z').getTime()
    const endTimestamp = endDate.value
      ? new Date(endDate.value + ':00Z').getTime()
      : Date.now()

    const MAX_REASONABLE_TIMESTAMP = Date.now() + (365 * 24 * 60 * 60 * 1000)

    // Filter by timestamp range
    const newRegistrations = registerMessages.filter(msg =>
      msg.timestamp >= startTimestamp &&
      msg.timestamp <= endTimestamp &&
      msg.timestamp < MAX_REASONABLE_TIMESTAMP
    )

    loadingMessage.value = 'Processing app data...'

    // Process registrations
    const uniqueApps = new Map()
    const allRegistrations = []
    const ownerStats = new Map()

    newRegistrations.forEach(msg => {
      const specs = msg.appSpecifications
      if (!specs || !specs.name) return

      const appName = specs.name
      const owner = specs.owner
      const height = msg.height
      const timestamp = msg.timestamp
      const instances = specs.instances || 0
      const compose = specs.compose
      const isMultiComponent = Array.isArray(compose) && compose.length > 1
      const components = Array.isArray(compose) ? compose.length : 1
      const isOrbitApp = usesOrbitImage(compose)

      // Extract repotags
      const repotags = Array.isArray(compose)
        ? compose.map(c => c.repotag || '').filter(r => r)
        : []

      allRegistrations.push({
        name: appName,
        owner,
        height,
        timestamp,
        date: new Date(timestamp),
        instances,
        isMultiComponent,
        components,
        category: categorizeApp(appName),
        isOrbitApp,
        repotags,
      })

      if (!uniqueApps.has(appName)) {
        uniqueApps.set(appName, {
          name: appName,
          owner,
          height,
          timestamp,
          date: new Date(timestamp),
          instances,
          isMultiComponent,
          components,
          category: categorizeApp(appName),
          isOrbitApp,
          repotags,
        })

        if (!ownerStats.has(owner)) {
          ownerStats.set(owner, { apps: 0, instances: 0 })
        }
        const stats = ownerStats.get(owner)
        stats.apps += 1
        stats.instances += instances
      }
    })

    allRegistrations.sort((a, b) => a.timestamp - b.timestamp)

    // Calculate statistics
    const totalNewApps = uniqueApps.size
    const totalRegistrations = allRegistrations.length
    const totalInstances = Array.from(uniqueApps.values()).reduce((sum, app) => sum + app.instances, 0)
    const multiComponentApps = Array.from(uniqueApps.values()).filter(app => app.isMultiComponent)
    const orbitApps = Array.from(uniqueApps.values()).filter(app => app.isOrbitApp)

    const timeDiff = endTimestamp - startTimestamp
    const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hoursSinceStart = Math.floor(timeDiff / (1000 * 60 * 60))

    const minHeight = allRegistrations.length > 0 ? Math.min(...allRegistrations.map(r => r.height)) : 0
    const maxHeight = allRegistrations.length > 0 ? Math.max(...allRegistrations.map(r => r.height)) : 0

    // Calculate fork-aware average block time
    const avgBlockTime = calculateAverageBlockTime(minHeight, maxHeight)

    const topOwners = Array.from(ownerStats.entries())
      .sort((a, b) => b[1].apps - a[1].apps)
      .map(([owner, stats]) => ({ owner, apps: stats.apps, instances: stats.instances }))

    // Find app with highest instances
    const highestInstanceApp = Array.from(uniqueApps.values()).reduce((max, app) =>
      app.instances > max.instances ? app : max
    , { name: 'N/A', instances: 0 })

    results.value = {
      summary: {
        newApps: totalNewApps,
        totalRegistrations,
        totalInstances,
        multiComponentApps: multiComponentApps.length,
        orbitApps: orbitApps.length,
      },
      highestInstanceApp: {
        name: highestInstanceApp.name,
        instances: highestInstanceApp.instances,
        owner: highestInstanceApp.owner,
      },
      timeSinceStart: {
        days: daysSinceStart,
        hours: hoursSinceStart,
      },
      heightRange: {
        min: minHeight,
        max: maxHeight,
        difference: maxHeight - minHeight,
        avgBlockTime: avgBlockTime.toFixed(1),
      },
      rates: {
        appsPerDay: daysSinceStart > 0 ? (totalNewApps / daysSinceStart).toFixed(2) : '0',
        instancesPerDay: daysSinceStart > 0 ? (totalInstances / daysSinceStart).toFixed(2) : '0',
      },
      topOwners,
      newApps: Array.from(uniqueApps.values()).sort((a, b) => a.timestamp - b.timestamp),
      allRegistrations,
      orbitApps,
    }

  } catch (err) {
    error.value = err.message || 'Failed to analyze data'
    console.error(err)
  } finally {
    loading.value = false
    loadingMessage.value = ''
  }
}

// Chart data
const ownerChartData = computed(() => {
  if (!results.value) return null

  const top10 = results.value.topOwners.slice(0, 10)

  return {
    labels: top10.map(o => o.owner.substring(0, 10) + '...'),
    datasets: [{
      label: 'Apps',
      data: top10.map(o => o.apps),
      backgroundColor: 'rgba(102, 126, 234, 0.8)',
    }]
  }
})

const instancesChartData = computed(() => {
  if (!results.value) return null

  const top10 = results.value.topOwners.slice(0, 10)

  return {
    labels: top10.map(o => o.owner.substring(0, 12) + '...'),
    datasets: [{
      data: top10.map(o => o.instances),
      backgroundColor: [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0',
        '#a8edea', '#fed6e3'
      ],
    }]
  }
})

const timelineChartData = computed(() => {
  if (!results.value || results.value.allRegistrations.length === 0) return null

  // Group by day
  const appsByDay = new Map()

  results.value.allRegistrations.forEach(app => {
    const day = app.date.toISOString().split('T')[0]
    appsByDay.set(day, (appsByDay.get(day) || 0) + 1)
  })

  const sortedDays = Array.from(appsByDay.keys()).sort()

  return {
    labels: sortedDays.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'New Apps',
      data: sortedDays.map(d => appsByDay.get(d)),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }
})

const categoryChartData = computed(() => {
  if (!results.value) return null

  const categories = new Map()

  results.value.newApps.forEach(app => {
    const cat = app.category
    categories.set(cat, (categories.get(cat) || 0) + 1)
  })

  return {
    labels: Array.from(categories.keys()),
    datasets: [{
      data: Array.from(categories.values()),
      backgroundColor: [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a'
      ],
    }]
  }
})

const orbitChartData = computed(() => {
  if (!results.value || !results.value.summary) return null

  const orbitCount = results.value.summary.orbitApps || 0
  const nonOrbitCount = results.value.summary.newApps - orbitCount

  return {
    labels: ['Orbit Apps', 'Non-Orbit Apps'],
    datasets: [{
      data: [orbitCount, nonOrbitCount],
      backgroundColor: [
        '#f093fb',
        '#667eea'
      ],
    }]
  }
})

const multiComponentChartData = computed(() => {
  if (!results.value || !results.value.summary) return null

  const multiCount = results.value.summary.multiComponentApps || 0
  const singleCount = results.value.summary.newApps - multiCount

  return {
    labels: ['Multi-Component', 'Single Component'],
    datasets: [{
      data: [multiCount, singleCount],
      backgroundColor: [
        '#43e97b',
        '#667eea'
      ],
    }]
  }
})

const highInstanceApps = computed(() => {
  if (!results.value || !results.value.newApps) return []

  return results.value.newApps
    .filter(app => app.instances > 10)
    .sort((a, b) => b.instances - a.instances)
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

const timelineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}
</script>
