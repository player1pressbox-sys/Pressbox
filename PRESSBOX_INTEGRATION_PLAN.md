# Player1 Press Box — Supabase Integration Plan

## Architecture: Separate App, Shared Backend

Press Box runs as its own app but connects to the **same Supabase project** as Player1. This gives it access to real team, coach, and tournament data without duplicating anything.

```
┌─────────────────────────────────────────────────────┐
│                    SUPABASE PROJECT                   │
│                                                       │
│  Player1 Tables (existing)     Press Box Tables (new) │
│  ┌─────────────────────┐       ┌──────────────────┐   │
│  │ teams               │       │ pressbox_*       │   │
│  │ coaches             │◄──────│ campaigns        │   │
│  │ tournaments         │  refs  │ journeys         │   │
│  │ registrations       │       │ social_posts     │   │
│  │ organizations       │       │ audience_segments│   │
│  │ directors           │       │ sponsors         │   │
│  │ events              │       │ delivery_events  │   │
│  └─────────────────────┘       └──────────────────┘   │
│                                                       │
│  Shared: Auth, RLS, Storage, Edge Functions           │
└─────────────────────────────────────────────────────┘
        ▲                          ▲
        │                          │
   ┌────┴────┐              ┌─────┴─────┐
   │ Player1 │              │ Press Box │
   │   App   │              │   App     │
   └─────────┘              └───────────┘
```

## What We Need From You

To wire up the live connection, I need:
1. **Supabase project URL** (e.g., `https://xxxxx.supabase.co`)
2. **Supabase anon key** (public, safe to share — it's already in your Player1 frontend)
3. **GitHub repo URL** for Player1 (so I can see the existing schema and structure)
4. **List of existing Supabase tables** (or a schema export — you can get this from Supabase Dashboard → SQL → `\dt`)

## Integration Phases

### Phase 1: Connect & Read (Week 1-2)
- Create `pressbox_` tables in the same Supabase project
- Wire up Supabase Auth (shared with Player1)
- Replace mock data with real Supabase reads
- Dashboard, Event Detail, and Audience Builder pull live data
- RLS policies ensure directors only see their own data

### Phase 2: Market to Teams (Week 2-3)
- Campaign Studio generates email/SMS/social copy
- Export audience segments as CSV
- Email sending via SendGrid or Postmark (Supabase Edge Function)
- SMS sending via Twilio (with explicit opt-in verification)
- Track opens, clicks, and registrations back to campaigns

### Phase 3: Social Media Management (Week 3-4)
- Social content calendar
- Multi-platform post composer (Facebook, Instagram, X)
- Schedule posts in advance
- Tournament-specific post templates
- Auto-posting via platform APIs (requires OAuth app setup)

### Phase 4: Automation (Week 4-6)
- Journey builder with real triggers
- Abandoned registration recovery (triggered by Player1 webhook)
- Past attendee reactivation (triggered by event publish)
- Waitlist fill automation
- Post-event retention sequences

### Phase 5: Merge into Player1 (Future)
- Once data model is stable and tested
- Move Press Box code into Player1 repo as `/features/press-box`
- Or keep as companion app with shared auth
