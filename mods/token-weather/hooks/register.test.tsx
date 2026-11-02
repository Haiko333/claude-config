import { expect, test } from 'claude-code/testing'
import { colorFor, toWeather } from './register'

test('colors by threshold', async () => {
  expect(colorFor(10)).toBe('success')
  expect(colorFor(50)).toBe('warning')
  expect(colorFor(80)).toBe('error')
})

test('picks the 5h and 7d windows and the cost', async () => {
  const w = toWeather({
    startedAt: 0,
    context: { window: 200000, percent: 42 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 18 }, { kind: 'seven_day', percentUsed: 61 }],
    cost: { usd: 1.234 },
  } as never)
  expect(w).toEqual({ context: 42, fiveHour: 18, sevenDay: 61, usd: 1.234 })
})

test('the band shows the gauges', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: { startedAt: 0, context: { window: 1, percent: 85 }, rateLimits: [{ kind: 'five_hour', percentUsed: 55 }], cost: { usd: 2 } },
  }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'token-weather', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false } } as never)
  expect((await ui.find({ type: 'Text', text: /85%/ }))?.props.color).toBe('error')
  expect((await ui.find({ type: 'Text', text: /55%/ }))?.props.color).toBe('warning')
  await ui.unmount()
})
