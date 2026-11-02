export type Weather = { context?: number; fiveHour?: number; sevenDay?: number; usd?: number }

declare module 'claude-code' {
  interface PluginState {
    'token-weather': { weather: Weather | null }
  }
}
