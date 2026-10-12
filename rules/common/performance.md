# Performance

## Token economy

- Short answers, no recap of what was just done.
- Read only the part of a file that is needed.
- Smallest change that works; no speculative abstractions.
- Agents only when [agents.md](./agents.md) says so.

## Model tiers

- Smallest model for worker agents and simple transformations.
- Largest model only for hard architectural reasoning.

## Context window

Above 80%: stop large explorations, delegate remaining reads to `Explore`, compact before continuing.
