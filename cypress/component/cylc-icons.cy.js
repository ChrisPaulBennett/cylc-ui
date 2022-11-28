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

import { TaskStateUserOrder, JobStates } from '@/model/TaskState.model'
import Task from '@/components/cylc/Task'
import Job from '@/components/cylc/Job'
import {
  MEAN_ELAPSED_TIME,
  getStartTime
} from './utils/task'

// wrap the Job component to allow us to bump up the font-size for a
// higher resolution screenshot
const JobComponent = {
  // NOTE: we set the font-size to boost the screenshot resolution
  template: `
    <span style="font-size: 200px" id="app" class="job_theme--default">
      <job :status="status" />
    </span>
  `,
  props: ['status'],
  components: { Job }
}

// wrap the Task component to allow us to bump up the font-size for a
// higher resolution screenshot
const TaskComponent = {
  // NOTE: we set the font-size to boost the screenshot resolution
  template: `
    <div style="font-size: 200px; margin: 100px;">
      <Task :task="task" :startTime="startTime" :modifierSize="modifierSize" />
    </div>
  `,
  props: ['task', 'startTime', 'modifierSize'],
  components: { Task }
}

function makeTask (
  state = 'waiting',
  isHeld = false,
  isQueued = false,
  isRunahead = false
) {
  return {
    state,
    isHeld,
    isQueued,
    isRunahead,
    task: {
      meanElapsedTime: MEAN_ELAPSED_TIME // NOTE time in seconds
    }
  }
}

describe('Task component', () => {
  it('Renders for each task state', () => {
    for (const state of TaskStateUserOrder) {
      const task = makeTask(state.name)
      cy.mount(TaskComponent, { propsData: { task } })
      cy.get('.c8-task').last().parent().screenshot(
        `task-${state.name}`,
        { overwrite: true, disableTimersAndAnimations: false }
      )
    }
  })
  it('Animates the running icon', () => {
    const task = makeTask('running')
    for (const percent of [0, 25, 50, 75, 100]) {
      cy.mount(
        TaskComponent,
        {
          propsData: {
            task,
            startTime: getStartTime(percent)
          }
        }
      )
      cy.get('.c8-task').last().parent().screenshot(
        `task-running-${percent}`,
        { overwrite: true, disableTimersAndAnimations: false }
      )
        // check the progress animation
        .get('.c8-task:last .status > .progress')
        // the animation duration should be equal to the expected job duration
        .should('have.css', 'animation-duration', `${MEAN_ELAPSED_TIME}s`)
        // the offset should be set to the "percent" of the expected job duration
        .should('have.css', 'animation-delay')
        .and('match', /([\d\.]+)s/) // NOTE the delay should be negative
        .then((number) => {
          // convert the duration string into a number that we can test
          cy.wrap(Number(number.match(/([\d\.]+)s/)[1]))
            // ensure this number is ±5 from the expected value
            // (give it a little bit of margin to allow for timing error)
            .should('closeTo', MEAN_ELAPSED_TIME * (percent / 100), 5)
        })
    }
  })
  it('Renders for each task modifier', () => {
    let task
    for (const modifier of ['isHeld', 'isQueued', 'isRunahead']) {
      task = makeTask()
      task[modifier] = true
      cy.mount(TaskComponent, { propsData: { task } })
      cy.get('.c8-task').last().screenshot(
        `task-${modifier}`,
        {
          overwrite: true,
          disableTimersAndAnimations: false,
          padding: [10, 5, 5, 10]
        }
      )
    }
  })
  it('Renders different modifier sizes', () => {
    const task = makeTask()
    task.isHeld = true
    for (const modifierSize of [0.2, 0.4, 0.6, 0.8]) {
      cy.mount(TaskComponent, { propsData: { task, modifierSize } })
      cy.get('.c8-task').last().screenshot(
        `task-modifier-size-${modifierSize}`,
        {
          overwrite: true,
          disableTimersAndAnimations: false,
          padding: [10, 5, 5, 10]
        }
      )
    }
  })
})

describe('Job component', () => {
  it('renders for each job state', () => {
    for (const state of JobStates) {
      cy.mount(JobComponent, { propsData: { status: state.name } })
      cy.get('.c-job svg').last().screenshot(
        `job-${state.name}`,
        { overwrite: true }
      )
    }
  })
})