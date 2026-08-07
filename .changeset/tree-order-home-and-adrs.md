---
"@eventuras/lectio-docs": patch
---

`buildTree` puts the home page first and sinks decision-record sections (`adr`,
`adrs`, `decisions`) to the bottom of the level they sit on. ADRs are reference
material read after the narrative docs, and manifest order — which is glob
order — otherwise scattered them mid-nav.
