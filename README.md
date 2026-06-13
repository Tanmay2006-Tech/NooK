# NooK

### Smart Library Seat Intelligence Platform

Transforming library occupancy from guesswork into real-time visibility.

---

## The Problem

Libraries are one of the most heavily used spaces on a campus, yet seat availability remains invisible.

Students spend valuable time searching for open desks, seats remain occupied long after students leave, and librarians have no practical way to monitor utilization across multiple floors.

The result is wasted study time, inefficient space usage, and poor occupancy visibility.

---

## The Solution

NooK is a real-time seat intelligence platform designed for modern academic libraries.

It combines live occupancy tracking, QR-based check-in, automated seat recovery, analytics, and administrative controls into a single system.

Students can instantly locate available study spaces while librarians gain a live operational view of the entire library.

---

## Live Project

**Live Application**

https://noo-k-nook.vercel.app

**Source Code**

https://github.com/Tanmay2006-Tech/NooK

---

## Core Capabilities

### Real-Time Occupancy Tracking

Monitor seat availability across multiple floors without manual intervention.

### Interactive Floor Maps

Visualize occupancy through color-coded floor layouts with zone-based organization.

### QR-Based Check-In

Students scan a desk QR code to instantly start a study session.

### Smart Away Mode

Temporary desk holds prevent accidental seat loss while ensuring fair resource usage.

### Automated Seat Recovery

Abandoned desks are automatically reclaimed through server-side session management.

### Librarian Command Center

Administrative dashboard for occupancy monitoring, alerts, and seat management.

### Occupancy Analytics

Actionable insights into utilization patterns, peak hours, and zone popularity.

---

## Product Highlights

| Metric               | Value               |
| -------------------- | ------------------- |
| Floors Managed       | 3                   |
| Study Zones          | 10                  |
| Seats Tracked        | 90+                 |
| Occupancy Visibility | Real-Time           |
| Dashboard Types      | Student + Librarian |
| Deployment Status    | Production Ready    |

---

## System Architecture

```text
Student Interface (React + TypeScript)
                 │
                 ▼
          Express API Server
                 │
                 ▼
        PostgreSQL Database
                 │
                 ▼
      Analytics + Session Engine
```

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* TanStack Query
* Tailwind CSS

### Backend

* Node.js
* Express

### Database

* PostgreSQL
* Drizzle ORM
* Neon

### Deployment

* Vercel
* Railway

### API Design

* OpenAPI First Architecture
* Generated React Query Hooks
* Zod Validation

---

## Key Engineering Decisions

### OpenAPI-First Development

All API contracts originate from a single OpenAPI specification.

This ensures consistency between frontend clients, backend endpoints, and validation layers.

---

### Server-Authoritative Session Management

Session timers, inactivity handling, away mode, and automatic seat release are enforced entirely by the backend.

The client never determines occupancy state.

---

### Automated Recovery System

A scheduled sweep service continuously monitors session validity and reclaims abandoned desks without librarian intervention.

---

### Type-Safe Full Stack

Shared types across the application reduce integration bugs and maintain API consistency.

---

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
```

### Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

### Run Backend

```bash
pnpm --filter @workspace/api-server run dev
```

### Run Frontend

```bash
pnpm --filter @workspace/nook run dev
```

---

## Demo Access

### Student

No account required.

Reserve any available seat using a name.

### Librarian

PIN: 1234

---

## Future Roadmap

* Mobile Applications
* Smart Notifications
* AI Occupancy Forecasting
* Reservation Scheduling
* Campus-Wide Resource Management
* University ERP Integration

---

## Built By

Tanmay Tripathi
Anandi Mahajan

---

*"Helping students spend less time searching and more time studying."*
