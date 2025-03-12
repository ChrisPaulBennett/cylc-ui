/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import TaskState from '@/model/TaskState.model'
import { TASK_OUTPUT_NAMES } from '@/model/TaskOutput.model'
import {
  upperFirst
} from 'lodash'
/**
 * States used when the parent is stopped.
 * @type {Array<TaskState>}
 */
const isStoppedOrderedStates = [
  TaskState.SUBMIT_FAILED,
  TaskState.FAILED,
  TaskState.RUNNING,
  TaskState.SUBMITTED,
  TaskState.EXPIRED,
  TaskState.PREPARING,
  TaskState.SUCCEEDED,
  TaskState.WAITING
]

/**
 * Gives a single state, based on a list of states of children nodes.
 * @param childStates {Array<TaskState>} children nodes
 * @param isStopped {boolean} whether the parent node is stopped or not
 * @returns {string} a valid Task State name, or null if not found
 * @link @see https://github.com/cylc/cylc-flow/blob/d66ae5c3ce8c749c8178d1cd53cb8c81d1560346/lib/cylc/task_state_prop.py
 */
function extractGroupState (childStates, isStopped = false) {
  const states = isStopped ? isStoppedOrderedStates : TaskState.enumValues
  for (const state of states) {
    if (childStates.includes(state.name)) {
      return state.name
    }
  }
  return ''
}

function latestJob (taskProxy) {
  if (taskProxy && taskProxy.children && taskProxy.children.length > 0) {
    return taskProxy.children[0].node
  }
  return null
}

/** Returns an array of task messages and custom outputs for a job node.
 *
 * Requires the following fields:
 * job {
 *   messages
 *   TaskProxy {
 *     outputs {
 *       label
 *       message
 *     }
 *   }
 * }
 */
function jobMessageOutputs (jobNode) {
  const ret = []
  let messageOutput

  for (const message of jobNode.node.messages || []) {
    if (TASK_OUTPUT_NAMES.includes(message)) {
      continue
    }
    messageOutput = null
    for (const output of jobNode.node.taskProxy?.outputs || []) {
      if (message === output.label) {
        messageOutput = output
        break
      }
    }
    if (messageOutput) {
      // add an output to the list
      ret.push(messageOutput)
    } else {
      // add a message to the list and make it look like an output
      ret.push({
        label: message,
        message: `Task Message: ${message}`,
        isMessage: true
      })
    }
  }
  return ret
}

/**
 * Convert duration to an easily read format
 * Durations of 0 seconds return undefined unless allowZeros is true
 *
 * @param {number=} dur Duration in seconds
 * @param {boolean} [allowZeros=false] Whether durations of 0 are formatted as
 * 00:00:00, rather than undefined
 * @return {string=} Formatted duration
 */
export function formatDuration (value, allowZeros = false, timingOption = true) {
  // Times are formatted as HH:MM:SS
  if (timingOption === 'queue' || timingOption === 'total' || timingOption === 'run' || timingOption === 'cpuTime' || timingOption === true) {
    if (value || (value === 0 && allowZeros === true)) {
      // Convert CPU time to seconds
      if (timingOption === 'cpuTime') {
        value = value / 1000
      }
      const seconds = value % 60
      const minutes = ((value - seconds) / 60) % 60
      const hours = ((value - minutes * 60 - seconds) / 3600) % 24
      const days = (value - hours * 3600 - minutes * 60 - seconds) / 86400

      let dayss = ''
      if (days > 0) {
        dayss = days.toString() + 'd '
      }

      return dayss +
        hours.toString().padStart(2, '0') +
        ':' + minutes.toString().padStart(2, '0') +
        ':' + Math.round(seconds).toString().padStart(2, '0')
    }
  // If memory value passed
  } else if (timingOption === 'maxRss') {
    if (value < 5000) {
      const kilobytes = value
      return kilobytes.toPrecision(3) + ' KB'
    } else if (value / 1024 < 1000) {
      const megabytes = value / 1024
      return megabytes.toPrecision(3) + ' MB'
    } else {
      const gigabytes = value / 1048576
      return gigabytes.toPrecision(3) + ' GB'
    }
  }
  // the meanElapsedTime can be 0/undefined (i.e. task has not run before)
  // return "undefined" rather than a number for these cases
  return undefined
}

export function formatChartLabels (timingOption) {
  // Create correct labels for the charts
  if (timingOption === 'maxRss' || timingOption === 'MaxRss') {
    return 'Max RSS'
  } else if (timingOption === 'cpuTime' || timingOption === 'CpuTime') {
    return 'CPU Time'
  } else {
    return upperFirst(timingOption) + ' Time'
  }
}

export function getTimingOption (timingOption) {
  // Create correct timing option for the charts
  if (timingOption === 'maxRss' || timingOption === 'cpuTime') {
    return timingOption
  } else {
    return timingOption + 'Time'
  }
}

export function formatHeader (statistic, timingOption) {
  if (timingOption === 'MaxRss' || timingOption === 'CpuTime' || timingOption === 'totalCpuTime') {
    if (statistic === 'quartiles') {
      return timingOption.charAt(0).toLowerCase() + timingOption.slice(1)
    } else {
      return statistic + timingOption
    }
  } else {
    if (statistic === 'quartiles') {
      return timingOption.toLowerCase()
    } else {
      return statistic + timingOption + 'Time'
    }
  }
}

export function dtMean (taskNode) {
  // Convert to an easily read duration format:
  const dur = taskNode.node?.task?.meanElapsedTime
  return formatDuration(dur)
}

/**
 * @param {string} flowNums - Flow numbers in DB format
 * @returns {string} - Flow numbers in pretty format
 */
export function formatFlowNums (flowNums) {
  return JSON.parse(flowNums).join(', ') || 'None'
}

/**
 * Return whether a task is in the None flow.
 *
 * @param {string=} flowNums
 * @returns {boolean}
 */
export function isFlowNone (flowNums) {
  return Boolean(flowNums && !JSON.parse(flowNums).length)
}
