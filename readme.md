# 🛡️ AEGIS — Agentic Immune System

## Project Overview

Aegis is an **Agentic Immune System** — a security middleware layer that sits between an AI agent and the outside world. It is a swarm of three specialized micro-agents that work together to prevent the most dangerous class of AI attacks: **Indirect Prompt Injection**.

As AI agents are deployed to read emails, browse websites, and query databases, they are vulnerable to blindly trusting malicious instructions embedded in documents. Aegis acts as an intelligent firewall, neutralizing threats before they reach the main agent, and verifying actions before they are executed.

## Core Architecture: The Three Agents

1. **The Sanitizer (Pre-Execution Guard)**
   Intercepts all inbound data *before* the main agent reads it. It uses a fast model (like Microsoft Phi-3 Mini) to detect and neutralize prompt injections, Unicode tricks, role-play overrides, and hidden commands.
   
2. **The Governor (Post-Reasoning Guard)**
   Intercepts EVERY tool call proposed by the main agent *before* execution. It evaluates Role-Based Access Control (RBAC) policies, calculates the "Blast Radius" of the action, and blocks or flags high-risk behaviors using deterministic rules and AI anomaly detection.
   
3. **The Auditor (Always-Running Background Agent)**
   Silently maintains an immutable SQLite log of every event, prompt, decision, and block. It provides a real-time WebSocket feed to the dashboard and generates exportable compliance reports.

## Tech Stack

* **Backend:** Python 3.11, FastAPI, Ollama (Phi-3 Mini, Llama 3.1 8B, Mistral 7B), LangGraph, SQLite, WebSockets
* **Frontend:** React 18 + Vite, TailwindCSS v3, Recharts, Zustand
* **Mobile App:** React Native + Expo, NativeWind

## Features

* **Attack Simulator:** A split-screen demo showcasing an unprotected agent executing a malicious command vs. Aegis intercepting and blocking the same attack.
* **Live Security Dashboard:** Real-time threat feed, threat gauge, agent status, and key metrics.
* **Forensic Audit Log:** A complete, tamper-proof trail of all agent activities and security events.
