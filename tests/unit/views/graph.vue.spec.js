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
import Graph from '@/views/Graph.vue'

const { refresh, updateTimer } = Graph.methods

/**
 * Create a stub component context for calling Graph methods on.
 *
 * (Mounting the Graph view requires GraphViz WASM & svg-pan-zoom, so the
 * methods are tested in isolation.)
 */
function makeContext (overrides = {}) {
  const nodes = [{ id: '~u/w//1/a' }, { id: '~u/w//1/b' }]
  return {
    updating: false,
    graphID: null,
    initialLoad: false,
    autoRefresh: true,
    refreshTimer: null,
    graphNodes: [],
    graphEdges: [],
    nodeTransformations: {},
    $refs: {},
    getGraphNodes: () => nodes,
    getGraphEdges: () => [],
    getCycles: () => [],
    hashGraph: () => 'hash',
    getNodeDimensions: () => ({}),
    layout: vi.fn(async () => {}),
    reset: vi.fn(),
    // by default, everything has rendered immediately
    waitFor: async (callback) => callback(),
    ...overrides,
  }
}

describe('Graph view', () => {
  describe('refresh()', () => {
    it('lays out the graph', async () => {
      const ctx = makeContext()
      await refresh.call(ctx)
      expect(ctx.layout).toHaveBeenCalledOnce()
      expect(ctx.graphID).toEqual('hash')
      expect(ctx.updating).toBe(false)
    })

    it('does not re-layout an unchanged graph', async () => {
      const ctx = makeContext({ graphID: 'hash' })
      await refresh.call(ctx)
      expect(ctx.layout).not.toHaveBeenCalled()
      expect(ctx.updating).toBe(false)
    })

    it('does not get stuck if the nodes have not rendered in time', async () => {
      let attempt = 0
      const ctx = makeContext({
        // first call (nodes) succeeds, second (node dimensions) times out
        waitFor: async (callback) => (attempt++ === 0 ? callback() : undefined),
      })
      await refresh.call(ctx)
      expect(ctx.layout).not.toHaveBeenCalled()
      // must be reset, otherwise every future refresh would be skipped
      expect(ctx.updating).toBe(false)

      // the next refresh should go ahead
      ctx.waitFor = async (callback) => callback()
      await refresh.call(ctx)
      expect(ctx.layout).toHaveBeenCalledOnce()
    })

    it('removes transformations for nodes no longer in the graph', async () => {
      const ctx = makeContext({
        nodeTransformations: {
          '~u/w//1/a': 'translate(1,1)',
          '~u/w//1/gone': 'translate(2,2)',
        },
      })
      await refresh.call(ctx)
      expect(Object.keys(ctx.nodeTransformations)).toEqual(['~u/w//1/a'])
    })
  })

  describe('updateTimer()', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('only ever runs one refresh timer', () => {
      const ctx = makeContext({ autoRefresh: true, initialLoad: true })
      ctx.refresh = vi.fn()
      // e.g. called on mount, then again when autoRefresh is toggled
      updateTimer.call(ctx)
      updateTimer.call(ctx)
      vi.advanceTimersByTime(2000)
      expect(ctx.refresh).toHaveBeenCalledOnce()

      // turning auto refresh off should stop all refreshes
      ctx.autoRefresh = false
      ctx.initialLoad = false
      updateTimer.call(ctx)
      expect(ctx.refreshTimer).toBe(null)
      ctx.refresh.mockClear()
      vi.advanceTimersByTime(10000)
      expect(ctx.refresh).not.toHaveBeenCalled()
    })
  })
})
