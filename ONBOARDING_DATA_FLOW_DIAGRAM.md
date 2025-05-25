# Onboarding System - Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ONBOARDING DATA FLOW                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                                 ┌─────────────┐
                                 │    USER     │
                                 │   VISITS    │
                                 │   /login    │
                                 └─────┬───────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │ CREATE        │
                               │ thread_id     │ ← UUID.v4()
                               │ (localStorage)│
                               └───────┬───────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │          DATABASE WRITES            │
                    │                                     │
                    │  ┌─────────────┐  ┌─────────────┐   │
                    │  │   threads   │  │  profiles   │   │
                    │  │             │  │             │   │
                    │  │ id: UUID    │  │thread_id:UUID  │
                    │  │ status:     │  │name: "User" │   │
                    │  │ "active"    │  │onboarding_  │   │
                    │  │             │  │completed:   │   │
                    │  │             │  │FALSE        │   │
                    │  └─────────────┘  └─────────────┘   │
                    └─────────────────────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │ REDIRECT TO    │
                              │ /onboarding/   │
                              │ welcome        │
                              └────────┬───────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │        ONBOARDING JOURNEY           │
                    │                                     │
                    │ welcome → privacy → choose-mode →   │
                    │                                     │
                    │ ┌─────────────┐                     │
                    │ │SessionContext│ (thread_id mgmt)   │
                    │ │             │                     │
                    │ │ thread_id   │ ← Consistent across │
                    │ │ localStorage│   all pages         │
                    │ └─────────────┘                     │
                    │                                     │
                    │ ⚠️  NO DATABASE WRITES DURING       │
                    │    ONBOARDING NAVIGATION            │
                    └─────────────────────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │ FINAL STEP:    │
                              │ /talk page     │
                              │                │
                              │ [Thanks] btn   │
                              └────────┬───────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │         COMPLETION LOGIC            │
                    │                                     │
                    │ UPDATE profiles                     │
                    │ SET onboarding_completed = TRUE     │
                    │ WHERE thread_id = ?                 │
                    │                                     │
                    │ ✅ PRIMARY: Database update         │
                    │ ✅ BACKUP: localStorage flag        │
                    └─────────────────────────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │ REDIRECT TO    │
                              │ MAIN CHAT      │
                              │ /?threadId=... │
                              └────────┬───────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │           FUTURE VISITS             │
                    │                                     │
                    │ CHECK: profiles.onboarding_completed│
                    │                                     │
                    │ IF TRUE  → Access main app          │
                    │ IF FALSE → Redirect to onboarding   │
                    └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

        ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
        │     threads     │       │    profiles     │       │     memory      │
        │                 │       │                 │       │                 │
        │ id (PK)         │◄─────►│ thread_id (FK)  │       │ thread_id (FK)  │
        │ created_at      │ 1:1   │ id (PK)         │       │ id (PK)         │
        │ updated_at      │       │ name            │       │ key             │
        │ model_name      │       │ emotional_tone  │       │ value           │
        │ system_prompt   │       │ concerns        │       │ created_at      │
        │ status          │       │ onboarding_     │       │ metadata        │
        │ metadata        │       │ completed ✅    │       │                 │
        │                 │       │ created_at      │       │                 │
        │                 │       │ updated_at      │       │                 │
        └─────────────────┘       └─────────────────┘       └─────────────────┘
                │                           │                           │
                │                           │                           │
                └─────────────┬─────────────┴─────────────┬─────────────┘
                              │                           │
                              ▼                           ▼
                        ┌──────────────┐           ┌─────────────┐
                        │   INDEXES    │           │  TRIGGERS   │
                        │              │           │             │
                        │ thread_id    │           │ auto-create │
                        │ memory_key   │           │ check_user  │
                        │ combined     │           │ updated_at  │
                        └──────────────┘           └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             ERROR SCENARIOS                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

❌ BEFORE FIX:                           ✅ AFTER FIX:
┌─────────────────────┐                 ┌─────────────────────┐
│ UPDATE onboarding_  │                 │ UPDATE profiles     │
│ progress SET        │                 │ SET onboarding_     │
│ completed = TRUE    │ → 400 ERROR     │ completed = TRUE    │ → SUCCESS
│                     │                 │ WHERE thread_id = ? │
│ ⚠️ Column missing   │                 │                     │
└─────────────────────┘                 │ ✅ Field exists     │
                                        └─────────────────────┘

❌ BEFORE FIX:                           ✅ AFTER FIX:
┌─────────────────────┐                 ┌─────────────────────┐
│ Mixed auth systems: │                 │ Consistent:         │
│ • supabase.auth     │                 │ • thread_id only    │
│ • user_id          │ → CONFLICTS     │ • localStorage      │ → CLEAN
│ • thread_id        │                 │ • SessionContext    │
│                     │                 │                     │
│ ⚠️ Inconsistent     │                 │ ✅ Single paradigm  │
└─────────────────────┘                 └─────────────────────┘
```
