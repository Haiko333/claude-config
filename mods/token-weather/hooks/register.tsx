import { atom, read, update } from 'claude-code'
import type { Engine, Register, SessionUsage } from 'claude-code'

import type { Weather } from '../types'

const WARN_AT = 50
const ALERT_AT = 80

const weather = atom({ plugin: 'token-weather', key: 'weather' } as const, null)

export const toWeather = (u: SessionUsage): Weather => ({
  context: u.context.percent,
  fiveHour: u.rateLimits.find(r => r.kind === 'five_hour')?.percentUsed,
  sevenDay: u.rateLimits.find(r => r.kind === 'seven_day')?.percentUsed,
  usd: u.cost?.usd,
})

export const colorFor = (percent: number): 'success' | 'warning' | 'error' =>
  percent >= ALERT_AT ? 'error' : percent >= WARN_AT ? 'warning' : 'success'

async function refresh($: Engine): Promise<void> {
  const w = toWeather(await $.session.usage())
  await update($, weather, () => w)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await refresh($)
    return r
  })

  on('session.measure', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const w = await read($, weather)
    if (e.props.hasSurvey || w === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const gauges = [
      ['ctx', w.context],
      ['5h', w.fiveHour],
      ['7d', w.sevenDay],
    ] as const
    const shown = gauges.filter((g): g is readonly [string, number] => g[1] !== undefined)

    return (
      <Box>
        {shown.map(([label, pct], i) => (
          <Box key={label}>
            <Text dimColor>{i > 0 ? ' · ' : ''}{label} </Text>
            <Text color={colorFor(pct)}>{Math.round(pct)}%</Text>
          </Box>
        ))}
        {w.usd !== undefined ? <Text dimColor>{shown.length ? ' · ' : ''}${w.usd.toFixed(2)}</Text> : null}
      </Box>
    )
  })
}
