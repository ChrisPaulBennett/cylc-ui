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
  <div class="c-analysis">
    <v-skeleton-loader
      v-if="!Object.keys(callback.tasks).length"
      type="table"
      class="align-content-start"
    />
    <v-container
    fluid
    class="c-table ma-0 pa-2 h-100 flex-column d-flex"
    >
      <!-- Filters -->
      <v-row
        class="d-flex flex-wrap table-option-bar no-gutters flex-grow-0"
      >
        <v-col
          cols="12"
          md="4"
          class="pr-md-2 mb-2 mb-md-0"
        >
          <v-text-field
            id="c-analysis-filter-task-name"
            clearable
            dense
            flat
            hide-details
            outlined
            placeholder="Filter by task name"
            v-model.trim="tasksFilter.name"
            ref="filterNameInput"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
          class="mb-2 mb-md-0"
        >
          <v-select
            id="c-analysis-filter-task-timings"
            :items="timingOptions"
            dense
            flat
            hide-details
            outlined
            prefix="Displaying: "
            v-model="tasksFilter.timingOption"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
          class="pl-md-2 mb-2 mb-md-0"
        >
          <v-select
            id="c-analysis-filter-task-platforms"
            :items="platformOptions"
            dense
            flat
            hide-details
            outlined
            prefix="Platform: "
            v-model="tasksFilter.platformOption"
          />
        </v-col>
      </v-row>
      <div
        ref="toolbar"
        id="analysis-toolbar"
        class="d-flex align-center flex-wrap my-2 col-gap-2 row-gap-4"
      >
        <!-- Toolbar -->
        <v-defaults-provider
          :defaults="{
            VBtn: { icon: true, variant: 'text' },
          }"
        >
          <v-btn-toggle
            v-model="chartType"
            mandatory
            variant="outlined"
            color="primary"
          >
            <v-btn
              :value="'table'"
              data-cy="table-toggle"
            >
              <v-icon :icon="$options.icons.mdiTable" />
              <v-tooltip>Table view</v-tooltip>
            </v-btn>
            <v-btn
              :value="'box'"
              data-cy="box-plot-toggle"
            >
              <v-icon :icon="$options.icons.mdiChartTimeline" />
              <v-tooltip>Box &amp; whiskers view</v-tooltip>
            </v-btn>
            <v-btn
              :value="'timeSeries'"
              data-cy="time-series-toggle"
            >
              <v-icon :icon="$options.icons.mdiChartTimelineVariant" />
              <v-tooltip>Time series view</v-tooltip>
            </v-btn>
          </v-btn-toggle>
          <v-btn
            v-if="chartType === 'table' || chartType === 'box'"
            @click="tasksQuery"
            data-cy="analysis-refresh-btn"
          >
            <v-icon :icon="$options.icons.mdiRefresh" />
            <v-tooltip>Refresh data</v-tooltip>
          </v-btn>
          <v-chip
            location="right"
            v-if="timingOption === 'cpuTime'"
          >
            Total CPU Time Of Suite {{ formatDuration(tasks[0].totalOfTotals, false, 'cpuTime') }}
          </v-chip>
          <!-- Box plot sort input teleports here -->
        </v-defaults-provider>
      </div>
      <AnalysisTable
        v-if="table"
        :tasks="filteredTasks"
        :timingOption="tasksFilter.timingOption"
        />
      <BoxPlot
        v-else
        :configOptions="configOptions"
        :workflowName="workflowName"
        :tasks="filteredTasks"
        :timingOption="tasksFilter.timingOption">
      </BoxPlot>
      <v-pagination
        v-if="!table"
        v-model="page"
        :length="Math.ceil(filteredTasks.length/itemsPerPage)"
        :total-visible="7"/>
    </v-container>
  </div>
</template>

<script>
import pick from 'lodash/pick'
import Vue from 'vue'
import gql from 'graphql-tag'
import { formatDuration } from '@/utils/tasks'
import graphqlMixin from '@/mixins/graphql'
import ViewToolbar from '@/components/cylc/ViewToolbar'
import BoxPlot from '@/components/cylc/analysis/BoxPlot'
import {
  mdiChartLine,
  mdiRefresh,
  mdiTable
} from '@mdi/js'
import AnalysisTable from '@/components/cylc/analysis/AnalysisTable'
import {
  matchTask,
  platformOptions
} from '@/components/cylc/analysis/filter'

/** List of fields to request for task for each task */
const taskFields = [
  'name',
  'platform',
  'count',
  'meanTotalTime',
  'stdDevTotalTime',
  'minTotalTime',
  'firstQuartileTotal',
  'secondQuartileTotal',
  'thirdQuartileTotal',
  'maxTotalTime',
  'meanRunTime',
  'stdDevRunTime',
  'minRunTime',
  'firstQuartileRun',
  'secondQuartileRun',
  'thirdQuartileRun',
  'maxRunTime',
  'meanQueueTime',
  'stdDevQueueTime',
  'minQueueTime',
  'queueQuartiles',
  'maxQueueTime',
  'maxMaxRss',
  'meanMaxRss',
  'stdDevMaxRss',
  'minMaxRss',
  'maxRssQuartiles',
  'maxCpuTime',
  'meanCpuTime',
  'stdDevCpuTime',
  'minCpuTime',
  'totalCpuTime',
  'cpuTimeQuartiles',
  'totalOfTotals'
]

/** The one-off query which retrieves historical task timing statistics */
const QUERY = gql`
query analysisQuery ($workflows: [ID]) {
  tasks(live: false, workflows: $workflows) {
    ${taskFields.join('\n')}
  }
}
`

/** The callback which gets called when data comes in from the query */
class AnalysisCallback {
  constructor (tasks) {
    this.tasks = tasks
  }

  add (data) {
    // add tasks contained in data to this.tasks
    for (const task of data.tasks) {
      // add new entry
      Vue.set(
        this.tasks,
        this.tasks.length,
        pick(task, taskFields)
      )
    }
  }

  // called when new objects are added
  // NOTE: we manually call this to add items which come through on the query
  onAdded (added, store, errors) {
    this.add(added)
  }

  // called when existing objects are updated
  onUpdated (updated, store, errors) {
    this.add(updated)
  }

  // other hooks we don't need but must declare (for now)
  before () {}
  after () {}
  onPruned () {}
  commit () {}
  tearDown () {}
}

export default {
  mixins: [
    pageMixin,
    graphqlMixin
  ],

  name: 'Analysis',

  components: {
    ViewToolbar,
    AnalysisTable,
    BoxPlot
  },

  metaInfo () {
    return {
      title: this.getPageTitle('App.workflow', { name: this.workflowName })
    }
  },

  beforeMount () {
    this.historicalQuery()
  },

  data () {
    const tasks = []
    return {
      // defines how the view view appears in the "add view" dropdown
      widget: {
        title: 'analysis',
        icon: mdiChartLine
      },
      table: true,
      /** Defines controls which get added to the toolbar */
      groups: [
        {
          title: 'Analysis',
          controls: [
            {
              title: 'Refresh data',
              icon: mdiRefresh,
              action: 'callback',
              callback: this.historicalQuery
            },
            {
              title: 'Toggle',
              icon: mdiTable,
              action: 'toggle',
              key: 'table',
              value: true
            }
          ]
        }
      ],
      // instance of the callback class
      callback: new AnalysisCallback(tasks),
      // object containing all of the tasks added by the callback
      tasks,
      sortBy: 'name',
      page: 1,
      sortDesc: false,
      itemsPerPage: 20,
      timingOptions: [
        { text: 'Total times', value: 'totalTimes' },
        { text: 'Run times', value: 'runTimes' },
        { text: 'Queue times', value: 'queueTimes' }
      ],
      tasksFilter: {
        name: '',
        timingOption: 'totalTimes',
        platformOption: null
      }
    }
  },

  computed: {
    /** List of the workflow IDs this view is "viewing" */
    workflowIDs () {
      return [this.workflowId]
    },
    configOptions () {
      return {
        sortBy: this.sortBy,
        page: this.page,
        sortDesc: this.sortDesc,
        itemsPerPage: this.itemsPerPage
      }
    },
    filteredTasks () {
      return this.tasks.filter(task => matchTask(task, this.tasksFilter))
    },
    platformOptions () {
      return platformOptions(this.tasks)
    }
  },
  methods: {
    /**
     * Run the one-off query for historical task data and pass its results
     * through the callback
     */
    tasksQuery: debounce(
      async function () {
        this.tasks = []
        this.callback = new AnalysisTaskCallback(this.tasks)
        const ret = await this.$workflowService.query2(
          TASK_QUERY,
          { workflows: this.workflowIDs }
        )
        this.callback.onAdded(ret.data)
      },
      200 // only re-run this once every 0.2 seconds
    ),
    formatDuration
  },

  icons: {
    mdiChartTimeline,
    mdiChartTimelineVariant,
    mdiRefresh,
    mdiTable,
  },

  timingOptions: [
    { value: 'totalTimes', title: 'Total times' },
    { value: 'runTimes', title: 'Run times' },
    { value: 'queueTimes', title: 'Queue times' },
    { value: 'maxRss', title: 'Max RSS' },
    { value: 'cpuTime', title: 'CPU Time' },
  ],
}
</script>
