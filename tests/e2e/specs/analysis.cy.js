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

describe('Analysis view', () => {
  it('Should display the mocked workflow', () => {
    cy.visit('/#/analysis/one')
    cy
      .get('.c-analysis table  > tbody > tr')
      .should('have.length', 3)
      .should('be.visible')
  })
  describe('Filters', () => {
    it('Should display total times and not filter by default', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('#c-analysis-filter-task-name')
        .should('be.empty')
      cy
        .get('#c-analysis-filter-task-platforms')
        .parent()
        .parent()
        .find('input[type="hidden"]')
        .should('have.value', '')
      cy
        .get('#c-analysis-filter-task-timings')
        .parent()
        .parent()
        .find('input[type="hidden"]')
        .should('have.value', 'totalTimes')
    })
    it('Should filter by task name', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('eventually')
        .should('be.visible')
      cy
        .get('#c-analysis-filter-task-name')
        .click()
          .get('.v-list-item')
          .contains('waiting')
          .click({ force: true })
      cy
        .get('td')
        .contains('waiting')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
    })
    it('Should filter by task platform', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('platform_1')
        .should('be.visible')
      cy
        .get('#c-analysis-filter-task-platforms')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('platform_2')
        .click({ force: true })
      cy
        .get('td')
        .contains('eventually')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
    })
    it('Should display the correct timings', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('00:00:30')
        .should('be.visible')
      // Show run times
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Run')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:21')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      // Show queue times
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Queue')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:12')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
    })
    it('Should filter by task name, platform and timings', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('30')
        .should('be.visible')
      // Show only task on platform_1
      cy
        .get('#c-analysis-filter-task-platforms')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('platform_1')
        .click({ force: true })
      cy
        .get('td')
        .contains('waiting')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 2)
        .should('be.visible')
      // Show run times
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Run')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:21')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 2)
        .should('be.visible')
      // Show task names containing 'wait'
      cy
        .get('#c-analysis-filter-task-name')
        .click()
          .get('.v-list-item')
          .contains('waiting')
          .click({ force: true })
      cy
        .get('td')
        .contains('waiting')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
      // Show queue times
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Queue')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:12')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
    })
    it('Should filter by task name', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('eventually')
        .should('be.visible')
      cy
        .get('#c-analysis-filter-task-name')
        .type('wait')
      cy
        .get('td')
        .contains('waiting')
        .should('be.visible')
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .its('length')
        .should('eq', 3, { timeout: 10000 })
    })

    it('Should switch view', () => {
      // Check for axis labels - should be no data plotted and only
      // y-axis labels visible
      cy
        .get('.vue-apexcharts')
        .should('be.visible')
    })
    it('Should filter by task platform', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('platform_1')
        .should('be.visible')
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .contains('waiting')
        .click()
      cy
        .get('.apexcharts-xaxis-label')
        .should('have.length', 4)
        // Add eventually_succeeded task and check three cycles visible
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .contains('platform_2')
        .click({ force: true })
      cy
        .get('td')
        .contains('eventually')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
    })
    it('Should display the correct timings', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .contains('Run')
        .click({ force: true })
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .contains('succeeded')
        .get('.v-card-actions')
        .contains('Select all')
        .should('exist')
        .get('.v-card-actions')
        .contains('Deselect all')
        .should('exist')
      // Select all tasks that contain succeeded
      cy
        .get('[data-cy=time-series-task-select]')
        .type('succeeded')
        .get('.v-card-actions')
        .contains('Select all')
        .click()
      // Check the correct tasks have been added
      cy
        .get('[data-cy=time-series-task-select]')
        .find('.v-chip')
        .its('length')
        .should('eq', 2)
        .get('[data-cy=time-series-task-select]')
        .find('.v-chip')
        .contains(/^succeeded$/)
        .get('[data-cy=time-series-task-select]')
        .find('.v-chip')
        .contains('eventually_succeeded')
      // Remove all tasks that contain eventually
      cy
        .get('[data-cy=time-series-task-select]')
        .find('input')
        .clear()
        .type('eventually')
        .get('.v-card-actions')
        .contains('Deselect all')
        .click()
      // Check only succeeded task is selected
      cy
        .get('[data-cy=time-series-task-select]')
        .find('.v-chip')
        .contains(/^succeeded$/)
        .get('[data-cy=time-series-task-select]')
        .find('.v-chip')
        .contains('eventually_succeeded')
        .should('not.exist')
    })

    it('Should show origin, when selected', () => {
      // Add waiting task and check y-axis doesn't start at origin
      cy
        .get('[data-cy=time-series-task-select]')
        .click()
        .get('.v-list-item')
        .contains('Queue')
        .click({ force: true })
      cy
        .get('.v-selection-control > .v-label')
        .click()
      cy
        .get('.apexcharts-yaxis-label')
        .contains('00:00:00')
    })
  })
})

describe('Filters and Options save state', () => {
  const numTasks = sortedTasks.length
  describe('Options save state', () => {
    beforeEach(() => {
      localStorage.defaultView = 'Analysis'
      cy.visit('/#/workspace/one')
    })

    it('remembers table and box & whiskers toggle option when switching between workflows', () => {
      cy.get('.c-analysis [data-cy=box-plot-toggle]')
        .click()
        .get('.vue-apexcharts')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
    })
    it('Should filter by task name, platform and timings', () => {
      cy.visit('/#/analysis/one')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 3)
        .should('be.visible')
      cy
        .get('td')
        .contains('30')
        .should('be.visible')
      // Show only task on platform_1
      cy
        .get('#c-analysis-filter-task-platforms')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('platform_1')
        .click({ force: true })
      cy
        .get('#c-analysis-filter-task-name')
        .click()
        .get('.v-list-item')
        .contains('waiting')
        .click({ force: true })

      // Set task times filter options
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Run')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:21')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 2)
        .should('be.visible')
      // Show task names containing 'wait'
      cy
        .get('#c-analysis-filter-task-name')
        .type('wait')
      cy
        .get('td')
        .contains('waiting')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
      // Show queue times
      cy
        .get('#c-analysis-filter-task-timings')
        .click({ force: true })
      cy
        .get('.v-list-item')
        .contains('Queue')
        .click({ force: true })
      cy
        .get('td')
        .contains('00:00:12')
        .should('be.visible')
      cy
        .get('.c-analysis table > tbody > tr')
        .should('have.length', 1)
        .should('be.visible')
    })

    it('shows sorting controls in correct tab', () => {
      // add second analysis view
      cy.get('[data-cy=add-view-btn]').click()
      cy.get('#toolbar-add-Analysis-view').click()
        // wait for menu to close
        .should('not.be.exist')

      cy.get('.c-analysis [data-cy=box-plot-toggle]:last')
        .click()
        .get('[data-cy="box-plot-sort-select"]')
        .should('be.visible')
    })
  })
})
