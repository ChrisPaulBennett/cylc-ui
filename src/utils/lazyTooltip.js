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

import { Tooltip } from 'vuetify/directives'

/**
 * @typedef {Object} LazyTooltipState
 * @property {import('vue').ObjectDirective} tooltip - the wrapped directive
 * @property {import('vue').DirectiveBinding} binding - latest binding
 * @property {import('vue').VNode} vnode - latest vnode
 * @property {boolean} mounted - whether the wrapped tooltip has been mounted
 * @property {boolean} hovered - whether the pointer is over the element
 * @property {boolean} focused - whether the element has focus
 * @property {Object<string, EventListener>} listeners
 */

/** @type {WeakMap<Element, LazyTooltipState>} */
const states = new WeakMap()

function addListeners (el, state) {
  for (const [event, listener] of Object.entries(state.listeners)) {
    el.addEventListener(event, listener)
  }
}

function removeListeners (el, state) {
  for (const [event, listener] of Object.entries(state.listeners)) {
    el.removeEventListener(event, listener)
  }
}

/**
 * Mount the wrapped tooltip, then replay the triggering event so that it
 * opens for the current interaction.
 *
 * @param {Element} el
 * @param {LazyTooltipState} state
 * @param {string} eventType - the event to replay ('mouseenter' or 'focus')
 */
function activate (el, state, eventType) {
  if (state.mounted) return
  state.mounted = true
  state.tooltip.mounted(el, state.binding, state.vnode)
  // The tooltip binds its listeners to the activator asynchronously, so wait
  // before replaying the event:
  setTimeout(() => {
    removeListeners(el, state)
    if (states.get(el) !== state) return // element has been unmounted
    if (eventType === 'mouseenter' && state.hovered) {
      el.dispatchEvent(new MouseEvent('mouseenter'))
    } else if (eventType === 'focus' && state.focused) {
      el.dispatchEvent(new FocusEvent('focus'))
    }
  })
}

/**
 * Create a directive that is a drop-in replacement for Vuetify's `v-tooltip`
 * directive, but defers creating the tooltip until the element is first
 * hovered or focused.
 *
 * Vuetify's directive mounts a whole VTooltip/VOverlay for every element
 * up-front, which uses a lot of memory when there are many of them (e.g. one
 * per row in the tree view).
 *
 * @param {import('vue').ObjectDirective} tooltip - the tooltip directive to
 * wrap (configurable for testing).
 * @returns {import('vue').ObjectDirective}
 */
export function createLazyTooltip (tooltip = Tooltip) {
  return {
    mounted (el, binding, vnode) {
      /** @type {LazyTooltipState} */
      const state = {
        tooltip,
        binding,
        vnode,
        mounted: false,
        hovered: false,
        focused: false,
      }
      state.listeners = {
        mouseenter: () => {
          state.hovered = true
          activate(el, state, 'mouseenter')
        },
        mouseleave: () => { state.hovered = false },
        focus: () => {
          state.focused = true
          activate(el, state, 'focus')
        },
        blur: () => { state.focused = false },
      }
      addListeners(el, state)
      states.set(el, state)
    },

    updated (el, binding, vnode) {
      const state = states.get(el)
      if (!state) return
      state.binding = binding
      state.vnode = vnode
      if (state.mounted) {
        tooltip.updated(el, binding, vnode)
      }
    },

    unmounted (el, binding, vnode) {
      const state = states.get(el)
      if (!state) return
      removeListeners(el, state)
      states.delete(el)
      if (state.mounted) {
        tooltip.unmounted(el, binding, vnode)
      }
    },
  }
}

/**
 * Lazy version of Vuetify's `v-tooltip` directive (see createLazyTooltip).
 *
 * Usage is identical to `v-tooltip`, e.g:
 *   v-lazy-tooltip="'text'"
 *   v-lazy-tooltip="{ text: 'text', openDelay: 200 }"
 */
export const LazyTooltip = createLazyTooltip()

export default LazyTooltip
