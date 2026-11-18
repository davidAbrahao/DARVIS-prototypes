# Product Vision

## Purpose

D.A.R.V.I.S. is a personal intelligence system that helps its owner maintain continuity across life, work, projects, knowledge, and decisions.

The system should move from conversation to useful outcomes: capture information, connect it to context, surface priorities, prepare decisions, and carry out authorized actions.

## Product pillars

### 1. Cognitive Cockpit
A premium, dark, responsive interface inspired by the Stitch Cognitive Cockpit. It provides situational awareness without pretending to be a real-time command center when data is unavailable.

### 2. Personal context and memory
A controlled knowledge layer combining structured records in PostgreSQL with long-form Markdown knowledge in an Obsidian-compatible vault. The user must be able to inspect, correct, export, and delete personal context.

### 3. AI assistant
A conversational interface with explicit context selection, provider abstraction, transparent source attribution where possible, and clear separation between model suggestions and system facts.

### 4. Projects and execution
Tasks, projects, goals, reminders, and workflows are first-class domain objects. Actions proposed by AI are validated and authorized by the API before execution.

### 5. Integrations and agents
External services are connected through scoped adapters. Each integration has a visible connection state, permissions, last successful operation, and failure information.

## Experience principles

- Useful before impressive.
- Calm, legible, and responsive.
- No fake telemetry, fake sync, fake AI, or fake success states.
- Every important action has a visible outcome.
- The user remains in control of permissions and execution.
- Progressive disclosure: advanced controls do not overwhelm everyday workflows.
- Mobile use is a first-class scenario, not a compressed desktop layout.

## Initial information architecture

1. Command Center
2. AI Assistant
3. Memory Center
4. Projects & Tasks
5. Knowledge
6. Integrations & Automations
7. Settings & Security

## MVP boundaries

The first MVP proves the application foundation and one complete user journey. It does not attempt to ship every proposed agent or integration.

Included in the first vertical slice: web application shell and navigation; API health and authenticated identity; PostgreSQL persistence; secure session lifecycle; real system status and empty states; automated quality checks.

Deferred until the foundation is validated: Gemini conversations with personal context; Obsidian synchronization and indexing; Telegram and Google Workspace integrations; voice interaction; autonomous or scheduled agents.
