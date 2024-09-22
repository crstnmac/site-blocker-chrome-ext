import {browser} from 'wxt/browser/chrome'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

interface Session {
  startTime: number
  duration: number
  type: string
}

function createFocusTimeChart(sessions: Session[]): void {
  const ctx = (
    document.getElementById('focusTimeChart') as HTMLCanvasElement
  )?.getContext('2d')
  if (!ctx) return
  const dailyFocusTime = calculateDailyFocusTime(sessions)

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dailyFocusTime),
      datasets: [
        {
          label: 'Daily Focus Time',
          data: Object.values(dailyFocusTime),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes',
          },
        },
      },
    },
  })
}

function createSessionDistributionChart(sessions: Session[]): void {
  const ctx = (
    document.getElementById('sessionDistributionChart') as HTMLCanvasElement
  )?.getContext('2d')
  if (!ctx) return
  const sessionTypes = sessions.reduce(
    (acc: Record<string, number>, session: Session) => {
      acc[session.type] = (acc[session.type] || 0) + session.duration
      return acc
    },
    {}
  )

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(sessionTypes),
      datasets: [
        {
          data: Object.values(sessionTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
    },
  })
}

function createProductivityTrendChart(sessions: Session[]): void {
  const ctx = (
    document.getElementById('productivityTrendChart') as HTMLCanvasElement
  )?.getContext('2d')
  if (!ctx) return
  const productivityTrend = calculateProductivityTrend(sessions)

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(productivityTrend),
      datasets: [
        {
          label: 'Productivity Score',
          data: Object.values(productivityTrend),
          borderColor: 'rgba(153, 102, 255, 1)',
          tension: 0.1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  })
}

function updateSummaryStats(sessions: Session[]): void {
  const totalFocusTime = sessions.reduce(
    (sum: number, session: Session) => sum + session.duration,
    0
  )
  const averageSessionLength = sessions.length ? totalFocusTime / sessions.length : 0
  const longestSession = sessions.length ? Math.max(...sessions.map((s) => s.duration)) : 0

  const summaryStats = document.getElementById('summaryStats')
  if (!summaryStats) return
  summaryStats.innerHTML = `
    <li>Total Focus Time: ${formatTime(totalFocusTime)}</li>
    <li>Average Session Length: ${formatTime(averageSessionLength)}</li>
    <li>Longest Session: ${formatTime(longestSession)}</li>
    <li>Total Sessions: ${sessions.length}</li>
  `
}

function calculateDailyFocusTime(sessions: Session[]): Record<string, number> {
  return sessions.reduce((acc: Record<string, number>, session: Session) => {
    const date = new Date(session.startTime).toLocaleDateString()
    acc[date] = (acc[date] || 0) + session.duration
    return acc
  }, {})
}

function calculateProductivityTrend(
  sessions: Session[]
): Record<string, number> {
  const dailyProductivity: Record<
    string,
    {totalDuration: number; count: number}
  > = {}
  sessions.forEach((session) => {
    const date = new Date(session.startTime).toLocaleDateString()
    if (!dailyProductivity[date]) {
      dailyProductivity[date] = {totalDuration: 0, count: 0}
    }
    dailyProductivity[date].totalDuration += session.duration
    dailyProductivity[date].count++
  })

  return Object.keys(dailyProductivity).reduce(
    (acc: Record<string, number>, date) => {
      const {totalDuration, count} = dailyProductivity[date]
      acc[date] = count ? (totalDuration / count) * (count / 8) * 100 : 0
      return acc
    },
    {}
  )
}

browser.storage.local.get(['sessions'], (result: {sessions: Session[]}) => {
  const sessions = result.sessions || []
  createFocusTimeChart(sessions)
  createSessionDistributionChart(sessions)
  createProductivityTrendChart(sessions)
  updateSummaryStats(sessions)
})
