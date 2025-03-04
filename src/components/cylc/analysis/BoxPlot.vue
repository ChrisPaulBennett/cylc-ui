<!--
Copyright (C) NIWA & British Crown (Met Office) & Contributors.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->

<template>
  <v-container>
    <apexchart type='boxPlot' width='90%' height='250%' :options="this.chartOptions" :series="this.boxPlot"></apexchart>
  </v-container>
</template>

<script>
import Vue from 'vue'
import VueApexCharts from 'vue-apexcharts'

Vue.use(VueApexCharts)
Vue.component('apexchart', VueApexCharts)

export default {

  name: 'BoxPlot',
  props: {
    tasks: {
      type: Array,
      required: true
    },
    timingOption: {
      type: String,
      required: true
    },
    workflowName: {
      type: String,
      default: null,
    },
  },

  setup (props, { emit }) {
    /**
     * The 'sort by' state.
     * @type {import('vue').Ref<string>}
     */
    const sortBy = useInitialOptions('sortBy', { props, emit }, 'name')

    /**
     * The page number state.
     * @type {import('vue').Ref<number>}
     */
    const page = useInitialOptions('page', { props, emit }, 1)

    /**
     * The sort descending/sscending state.
     * @type {import('vue').Ref<boolean>}
     */
    const sortDesc = useInitialOptions('sortDesc', { props, emit }, false)

    const reducedAnimation = useReducedAnimation()

    const chartOptions = computed(() => ({
      chart: {
        defaultLocale: 'en',
        locales: [
          {
            name: 'en',
            options: {
              toolbar: {
                exportToSVG: 'Download SVG',
                exportToPNG: 'Download PNG',
                menu: 'Download'
              }
            }
          }
        ],
        animations: {
          enabled: reducedAnimation.value ? false : props.animate,
          easing: 'easeinout',
          speed: 300,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        fontFamily: 'inherit',
        toolbar: {
          tools: {
            download: `<svg class="w-100 h-100"><path d="${mdiDownload}"></path></svg>`,
          },
        },
      },
      tooltip: {
        custom ({ seriesIndex, dataPointIndex, w }) {
          const max = formatDuration(w.globals.seriesCandleC[seriesIndex][dataPointIndex], true, props.timingOption)
          const q3 = formatDuration(w.globals.seriesCandleL[seriesIndex][dataPointIndex], true, props.timingOption)
          const med = formatDuration(w.globals.seriesCandleM[seriesIndex][dataPointIndex], true, props.timingOption)
          const q1 = formatDuration(w.globals.seriesCandleH[seriesIndex][dataPointIndex], true, props.timingOption)
          const min = formatDuration(w.globals.seriesCandleO[seriesIndex][dataPointIndex], true, props.timingOption)
          return `
            <div class="pa-2">
              <div>Maximum: ${max}</div>
              <div>Q3: ${q3} </div>
              <div>Median: ${med}</div>
              <div>Q1: ${q1}</div>
              <div>Minimum: ${min}</div>
            </div>
          `
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
        boxPlot: {
          colors: {
            upper: '#6DD5C2',
            lower: '#6AA4F1',
          },
        },
      },
      xaxis: {
        title: {
          text: `${formatChartLabels(props.timingOption)}`,
        },
        labels: {
          formatter: (value) => formatDuration(value, true, props.timingOption)
        },
      },
    }))

    return {
      sortBy,
      page,
      sortDesc,
      chartOptions,
    }
  },

  computed: {
    series () {
      const sortedTasks = [...this.tasks].sort(this.compare)
      const startIndex = Math.max(0, this.itemsPerPage * (this.page - 1))
      const endIndex = Math.min(sortedTasks.length, startIndex + this.itemsPerPage)

      const data = []
      for (let i = startIndex; i < endIndex; i++) {
        data.push({
          x: sortedTasks[i].name,
          y: [
            sortedTasks[i][`min${upperFirst(getTimingOption(this.timingOption))}`],
            sortedTasks[i][`${this.timingOption}Quartiles`][0],
            sortedTasks[i][`${this.timingOption}Quartiles`][1],
            sortedTasks[i][`${this.timingOption}Quartiles`][2],
            sortedTasks[i][`max${upperFirst(getTimingOption(this.timingOption))}`],
          ],
        })
      }
      return chartOptions
    }
  },
  methods: {
    compare (a, b) {
      let returnValue = 0
      if (this.configOptions.sortBy === 'name') {
        if (a.name < b.name) {
          returnValue = -1
        }
        if (a.name > b.name) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'platform') {
        if (a.platform < b.platform) {
          returnValue = -1
        }
        if (a.platform > b.platform) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'count') {
        if (a.count < b.count) {
          returnValue = -1
        }
        if (a.count > b.count) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'meanTotalTime') {
        if (a.meanTotalTime < b.meanTotalTime) {
          returnValue = -1
        }
        if (a.meanTotalTime > b.meanTotalTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'stdDevTotalTime') {
        if (a.stdDevTotalTime < b.stdDevTotalTime) {
          returnValue = -1
        }
        if (a.stdDevTotalTime > b.stdDevTotalTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'minTotalTime') {
        if (a.minTotalTime < b.minTotalTime) {
          returnValue = -1
        }
        if (a.minTotalTime > b.minTotalTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'firstQuartileTotal') {
        if (a.firstQuartileTotal < b.firstQuartileTotal) {
          returnValue = -1
        }
        if (a.firstQuartileTotal > b.firstQuartileTotal) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'secondQuartileTotal') {
        if (a.secondQuartileTotal < b.secondQuartileTotal) {
          returnValue = -1
        }
        if (a.secondQuartileTotal > b.secondQuartileTotal) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'thirdQuartileTotal') {
        if (a.thirdQuartileTotal < b.thirdQuartileTotal) {
          returnValue = -1
        }
        if (a.thirdQuartileTotal > b.thirdQuartileTotal) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'maxTotalTime') {
        if (a.maxTotalTime < b.maxTotalTime) {
          returnValue = -1
        }
        if (a.maxTotalTime > b.maxTotalTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'meanRunTime') {
        if (a.meanRunTime < b.meanRunTime) {
          returnValue = -1
        }
        if (a.meanRunTime > b.meanRunTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'stdDevRunTime') {
        if (a.stdDevRunTime < b.stdDevRunTime) {
          returnValue = -1
        }
        if (a.stdDevRunTime > b.stdDevRunTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'minRunTime') {
        if (a.minRunTime < b.minRunTime) {
          returnValue = -1
        }
        if (a.minRunTime > b.minRunTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'firstQuartileRun') {
        if (a.firstQuartileRun < b.firstQuartileRun) {
          returnValue = -1
        }
        if (a.firstQuartileRun > b.firstQuartileRun) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'secondQuartileRun') {
        if (a.secondQuartileRun < b.secondQuartileRun) {
          returnValue = -1
        }
        if (a.secondQuartileRun > b.secondQuartileRun) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'thirdQuartileRun') {
        if (a.thirdQuartileRun < b.thirdQuartileRun) {
          returnValue = -1
        }
        if (a.thirdQuartileRun > b.thirdQuartileRun) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'maxRunTime') {
        if (a.maxRunTime < b.maxRunTime) {
          returnValue = -1
        }
        if (a.maxRunTime > b.maxRunTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'meanQueueTime') {
        if (a.meanQueueTime < b.meanQueueTime) {
          returnValue = -1
        }
        if (a.meanQueueTime > b.meanQueueTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'stdDevQueueTime') {
        if (a.stdDevQueueTime < b.stdDevQueueTime) {
          returnValue = -1
        }
        if (a.stdDevQueueTime > b.stdDevQueueTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'minQueueTime') {
        if (a.minQueueTime < b.minQueueTime) {
          returnValue = -1
        }
        if (a.minQueueTime > b.minQueueTime) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'firstQuartileQueue') {
        if (a.firstQuartileQueue < b.firstQuartileQueue) {
          returnValue = -1
        }
        if (a.firstQuartileQueue > b.firstQuartileQueue) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'secondQuartileQueue') {
        if (a.secondQuartileQueue < b.secondQuartileQueue) {
          returnValue = -1
        }
        if (a.secondQuartileQueue > b.secondQuartileQueue) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'thirdQuartileQueue') {
        if (a.thirdQuartileQueue < b.thirdQuartileQueue) {
          returnValue = -1
        }
        if (a.thirdQuartileQueue > b.thirdQuartileQueue) {
          returnValue = 1
        }
      } else if (this.configOptions.sortBy === 'maxQueueTime') {
        if (a.maxQueueTime < b.maxQueueTime) {
          returnValue = -1
        }
        if (a.maxQueueTime > b.maxQueueTime) {
          returnValue = 1
        }
      }
      if (this.configOptions.sortDesc === true) {
        if (returnValue === 1) {
          returnValue = -1
        } else if (returnValue === -1) {
          returnValue = 1
        }
      }
      return returnValue
    }
  }
}
</script>
