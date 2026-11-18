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

import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, withDirectives } from 'vue'
import { createLazyTooltip } from '@/utils/lazyTooltip'

// NOTE: Vuetify tooltips cannot actually open in happy-dom, so we mock the
// Vuetify directive and test that it is called at the right times.
vi.mock('vuetify/directives', () => ({
  Tooltip: {
    mounted: vi.fn(),
    updated: vi.fn(),
    unmounted: vi.fn(),
  },
}))

const sleep = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

describe('v-lazy-tooltip directive', () => {
  let wrapper
  /** Events received by the (mock) Vuetify tooltip after it was mounted */
  let tooltipEvents
  /** Stub for the Vuetify tooltip directive */
  let Tooltip
  let LazyTooltip

  function mountFunction (text = 'Hello') {
    wrapper = mount(
      {
        data: () => ({ text }),
        render () {
          return withDirectives(
            h('span', { class: 'target' }, this.text),
            [[LazyTooltip, this.text]]
          )
        },
      },
      { attachTo: document.body }
    )
    return wrapper.get('.target')
  }

  beforeEach(() => {
    tooltipEvents = []
    // Simulate Vuetify binding its activator listeners asynchronously
    Tooltip = {
      mounted: vi.fn((el) => {
        Promise.resolve().then(() => {
          for (const type of ['mouseenter', 'focus']) {
            el.addEventListener(type, (e) => tooltipEvents.push(e.type))
          }
        })
      }),
      updated: vi.fn(),
      unmounted: vi.fn(),
    }
    LazyTooltip = createLazyTooltip(Tooltip)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('does not create the tooltip until hovered/focused', async () => {
    mountFunction()
    await sleep()
    expect(Tooltip.mounted).not.toHaveBeenCalled()
  })

  it.each(['mouseenter', 'focus'])('creates the tooltip on %s and replays the event', async (type) => {
    const target = mountFunction()
    await target.trigger(type)
    expect(Tooltip.mounted).toHaveBeenCalledOnce()
    expect(Tooltip.mounted.mock.calls[0][0]).toBe(target.element)
    expect(Tooltip.mounted.mock.calls[0][1].value).toBe('Hello')
    await sleep()
    expect(tooltipEvents).toEqual([type])
    // Subsequent events go straight to the tooltip
    await target.trigger(type)
    expect(Tooltip.mounted).toHaveBeenCalledOnce()
    expect(tooltipEvents).toEqual([type, type])
  })

  it.each([
    ['mouseenter', 'mouseleave'],
    ['focus', 'blur'],
  ])('does not replay %s if %s happened in the meantime', async (enter, leave) => {
    const target = mountFunction()
    await target.trigger(enter)
    await target.trigger(leave)
    await sleep()
    expect(Tooltip.mounted).toHaveBeenCalledOnce()
    expect(tooltipEvents).toEqual([])
  })

  it('only forwards updates once the tooltip exists', async () => {
    const target = mountFunction()
    await wrapper.setData({ text: 'World' })
    expect(Tooltip.updated).not.toHaveBeenCalled()
    await target.trigger('mouseenter')
    // Mounts with the latest binding
    expect(Tooltip.mounted.mock.calls[0][1].value).toBe('World')
    await wrapper.setData({ text: 'Foo' })
    expect(Tooltip.updated).toHaveBeenCalled()
    expect(Tooltip.updated.mock.lastCall[1].value).toBe('Foo')
  })

  it('only unmounts the tooltip if it was created', async () => {
    mountFunction()
    wrapper.unmount()
    wrapper = null
    expect(Tooltip.unmounted).not.toHaveBeenCalled()

    const target = mountFunction()
    await target.trigger('mouseenter')
    wrapper.unmount()
    wrapper = null
    expect(Tooltip.unmounted).toHaveBeenCalledOnce()
    // Does not replay the event after unmount
    await sleep()
    expect(tooltipEvents).toEqual([])
  })
})
