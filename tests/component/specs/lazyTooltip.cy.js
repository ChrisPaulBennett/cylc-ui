/**
 * Copyright (C) Earth Sciences New Zealand & British Crown (Met Office) & Contributors.
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

import { defineComponent, h, withDirectives } from 'vue'
import { LazyTooltip } from '@/utils/lazyTooltip'

const Component = defineComponent({
  render () {
    return withDirectives(
      h('span', { class: 'target', style: 'margin: 50px; display: inline-block' }, 'Hover me'),
      [[LazyTooltip, 'Tooltip text']]
    )
  },
})

describe('v-lazy-tooltip directive', () => {
  it('creates the tooltip on first hover and behaves like v-tooltip', () => {
    cy.vmount(Component)
    cy.addVuetifyStyles(cy)

    // Not created up front:
    cy.get('.v-tooltip').should('not.exist')
    cy.get('.target').should('not.have.attr', 'aria-describedby')

    // Opens on first hover:
    cy.get('.target').trigger('mouseenter')
    cy.get('.v-tooltip .v-overlay__content')
      .should('be.visible')
      .should('contain', 'Tooltip text')

    // Closes on leave:
    cy.get('.target').trigger('mouseleave')
    cy.get('.v-tooltip .v-overlay__content').should('not.be.visible')

    // Re-opens on subsequent hover:
    cy.get('.target').trigger('mouseenter')
    cy.get('.target')
      .invoke('attr', 'aria-describedby').then((tooltipID) => {
        cy.get(`#${tooltipID} .v-overlay__content`)
          .should('be.visible')
          .should('contain', 'Tooltip text')
      })
  })
})
