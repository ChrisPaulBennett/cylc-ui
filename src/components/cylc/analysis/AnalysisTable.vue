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
  <v-row
    no-gutters
    class="flex-grow-1 position-relative"
  >
    <v-col
      cols="12"
      class="mh-100 position-relative"
    >
      <v-container
        fluid
        class="pa-0"
      >
        <v-data-table
          :headers="shownHeaders"
          :items="tasks"
          :sort-by.sync="sortBy"
          dense
          :footer-props="{
            itemsPerPageOptions: [10, 20, 50, 100, 200, -1],
            showFirstLastPage: true
          }"
          :options="{ itemsPerPage: 50 }"
        >
          <!-- Use custom format for values in columns that have a specified formatter: -->
          <!-- Used to make durations human readable -->
          <!-- Durations of 0 will be undefined unless allowZeros is true -->
          <template
            v-for="header in shownHeaders.filter(header => header.hasOwnProperty('formatter'))"
            v-slot:[`item.${header.value}`]="{ value }"
          >
            {{ header.formatter(value, header.allowZeros) }}
          </template>
        </v-data-table>
      </v-container>
    </v-col>
  </v-row>
</template>

<script>
import { formatDuration } from '@/utils/tasks'

export default {
  name: 'AnalysisTableComponent',

  props: {
    tasks: {
      type: Array,
      required: true
    },
    timingOption: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      sortBy: 'name',
      headers: [
        {
          text: 'Task',
          value: 'name'
        },
        {
          text: 'Platform',
          value: 'platform'
        },
        {
          text: 'Count',
          value: 'count'
        }
        // {
        //   text: 'Failure rate (%)',
        //   value: 'failureRate'
        // }
      ]
    }
  },

  computed: {
    shownHeaders () {
      let times
      if (this.timingOption === 'totalTimes') {
        times = 'Total'
      } else if (this.timingOption === 'runTimes') {
        times = 'Run'
      } else if (this.timingOption === 'queueTimes') {
        times = 'Queue'
      } else {
        return this.headers
      }
      const timingHeaders = [
        {
          title: `Mean ${times}`,
          key: `${formatHeader('mean', times)}`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        },
        {
          title: `Std Dev ${times}`,
          key: `${formatHeader('stdDev', times)}`,
          formatter: formatDuration,
          allowZeros: true,
          timingOption: this.timingOption
        },
        {
          title: `Min ${times}`,
          key: `${formatHeader('min', times)}`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        },
        {
          title: `Q1 ${times}`,
          key: `${formatHeader('quartiles', times)}Quartiles.0`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        },
        {
          title: `Median ${times}`,
          key: `${formatHeader('quartiles', times)}Quartiles.1`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        },
        {
          title: `Q3 ${times}`,
          key: `${formatHeader('quartiles', times)}Quartiles.2`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        },
        {
          title: `Max ${times}`,
          key: `${formatHeader('max', times)}`,
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        }
      ]
      if (this.timingOption === 'cpuTime') {
        timingHeaders.push({
          title: 'Total CPU Time',
          key: 'totalCpuTime',
          formatter: formatDuration,
          allowZeros: false,
          timingOption: this.timingOption
        })
      }
      return this.headers.concat(timingHeaders)
    }
  },

  methods: {
    formatCell (item, header) {
      const arrayMatch = header.key.match(/^(.+)\.(\d+)$/)
      const key = arrayMatch?.[1] ?? header.key
      let value = item[key]
      if (arrayMatch) {
        const index = arrayMatch[2]
        value = value[index]
      }
      if (header.formatter) {
        return header.formatter(value, header.allowZeros, this.timingOption)
      }
      return value
    }
  },

  itemsPerPageOptions: [
    { value: 10, title: '10' },
    { value: 20, title: '20' },
    { value: 50, title: '50' },
    { value: 100, title: '100' },
    { value: 200, title: '200' },
    { value: -1, title: 'All' }
  ],
}
</script>
