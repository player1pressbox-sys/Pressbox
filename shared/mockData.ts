// Mock data for Player1 Press Box prototype
// This data mirrors what would come from the Player1 API in production

export type Sport = 'baseball' | 'fastpitch';
export type DivisionStatus = 'on_track' | 'at_risk' | 'critical' | 'full' | 'waitlist';

export interface Division {
  id: string;
  name: string;
  sport: Sport;
  ageGroup: string;
  registered: number;
  capacity: number;
  status: DivisionStatus;
  demandScore: number; // 0-100
  lastYearPace: number; // registrations at this point last year
  teamsWithinRadius: number;
  states: string[];
}

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  date: string;
  endDate: string;
  city: string;
  state: string;
  venue: string;
  director: string;
  status: 'registration_open' | 'early_bird' | 'filling' | 'nearly_full' | 'sold_out';
  divisions: Division[];
  totalRegistered: number;
  totalCapacity: number;
  revenue: number;
  revenueGoal: number;
  daysUntilEvent: number;
  registrationPace: number[]; // weekly registrations
  lastYearPace: number[];
  campaignsActive: number;
  abandonedRegistrations: number;
  lapsedTeams: number;
  nextAction: string;
  nextActionDetail: string;
}

export interface Team {
  id: string;
  name: string;
  club: string;
  sport: Sport;
  ageGroup: string;
  classification: string;
  city: string;
  state: string;
  zip: string;
  distanceFromVenue: number; // miles
  lastEvent: string;
  lastEventDate: string;
  totalEvents: number;
  status: 'active' | 'lapsed' | 'new' | 'abandoned' | 'waitlisted';
  registrationStatus: 'registered' | 'not_registered' | 'abandoned' | 'waitlisted';
  coachName: string;
  coachEmail: string;
  coachPhone: string;
  consent: 'email' | 'sms' | 'both' | 'none';
}

export interface Campaign {
  id: string;
  name: string;
  tournamentId: string;
  tournamentName: string;
  type: 'email' | 'sms' | 'social' | 'multi';
  template: string;
  status: 'draft' | 'scheduled' | 'sent' | 'active';
  sentDate: string;
  audience: number;
  opened: number;
  clicked: number;
  registrations: number;
  revenue: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface Journey {
  id: string;
  name: string;
  type: 'abandoned_registration' | 'past_attendee_return' | 'waitlist_fill' | 'post_event_retention' | 'sponsor_activation';
  status: 'active' | 'paused' | 'draft';
  enrolled: number;
  completed: number;
  converted: number;
  conversionRate: number;
  steps: JourneyStep[];
  description: string;
}

export interface JourneyStep {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'social' | 'wait';
  delay: string;
  trigger: string;
  sent: number;
  opened: number;
  clicked: number;
}

export interface Sponsor {
  id: string;
  name: string;
  category: string;
  logo: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  investment: number;
  events: number;
  qrScans: number;
  offerRedemptions: number;
  leads: number;
  status: 'active' | 'pending_renewal' | 'lapsed';
  renewalDate: string;
  roi: number;
}

// ============ TOURNAMENTS ============

export const tournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Northeast Summer Classic',
    sport: 'baseball',
    date: '2026-07-18',
    endDate: '2026-07-20',
    city: 'Harrisburg',
    state: 'PA',
    venue: 'Harrisburg Baseball Complex',
    director: 'Mike Reynolds',
    status: 'filling',
    divisions: [
      { id: 'd1', name: '9U Open', sport: 'baseball', ageGroup: '9U', registered: 8, capacity: 12, status: 'on_track', demandScore: 78, lastYearPace: 7, teamsWithinRadius: 34, states: ['PA', 'NY', 'NJ', 'MD'] },
      { id: 'd2', name: '11U Open', sport: 'baseball', ageGroup: '11U', registered: 10, capacity: 12, status: 'on_track', demandScore: 85, lastYearPace: 8, teamsWithinRadius: 42, states: ['PA', 'NY', 'NJ', 'DE'] },
      { id: 'd3', name: '13U Open', sport: 'baseball', ageGroup: '13U', registered: 6, capacity: 12, status: 'at_risk', demandScore: 52, lastYearPace: 9, teamsWithinRadius: 38, states: ['PA', 'NY', 'NJ', 'MD', 'VA'] },
      { id: 'd4', name: '14U Open', sport: 'baseball', ageGroup: '14U', registered: 4, capacity: 12, status: 'critical', demandScore: 38, lastYearPace: 8, teamsWithinRadius: 51, states: ['PA', 'NY', 'NJ', 'MD', 'VA', 'CT'] },
      { id: 'd5', name: '16U Showcase', sport: 'baseball', ageGroup: '16U', registered: 10, capacity: 10, status: 'full', demandScore: 92, lastYearPace: 9, teamsWithinRadius: 67, states: ['PA', 'NY', 'NJ', 'MD', 'VA', 'CT', 'MA'] },
    ],
    totalRegistered: 38,
    totalCapacity: 58,
    revenue: 28500,
    revenueGoal: 43500,
    daysUntilEvent: 18,
    registrationPace: [3, 5, 7, 9, 12, 15, 20, 25, 30, 34, 36, 38],
    lastYearPace: [2, 4, 6, 8, 11, 14, 18, 22, 27, 31, 35, 38],
    campaignsActive: 3,
    abandonedRegistrations: 7,
    lapsedTeams: 12,
    nextAction: 'Launch 14U recovery campaign',
    nextActionDetail: '14U Open is 33% filled with 18 days left. 51 eligible teams within 150 miles have not been contacted. Recommend urgent email + SMS campaign to past attendees within driving radius.',
  },
  {
    id: 't2',
    name: 'Garden State Fastpitch Showcase',
    sport: 'fastpitch',
    date: '2026-07-25',
    endDate: '2026-07-27',
    city: 'Somerville',
    state: 'NJ',
    venue: 'Somerville Softball Fields',
    director: 'Sarah Chen',
    status: 'early_bird',
    divisions: [
      { id: 'd6', name: '10U Open', sport: 'fastpitch', ageGroup: '10U', registered: 5, capacity: 10, status: 'on_track', demandScore: 72, lastYearPace: 4, teamsWithinRadius: 28, states: ['NJ', 'PA', 'NY'] },
      { id: 'd7', name: '12U Open', sport: 'fastpitch', ageGroup: '12U', registered: 7, capacity: 12, status: 'on_track', demandScore: 80, lastYearPace: 6, teamsWithinRadius: 35, states: ['NJ', 'PA', 'NY', 'CT'] },
      { id: 'd8', name: '14U Showcase', sport: 'fastpitch', ageGroup: '14U', registered: 8, capacity: 12, status: 'on_track', demandScore: 88, lastYearPace: 7, teamsWithinRadius: 44, states: ['NJ', 'PA', 'NY', 'CT', 'MD'] },
      { id: 'd9', name: '16U Showcase', sport: 'fastpitch', ageGroup: '16U', registered: 6, capacity: 10, status: 'at_risk', demandScore: 55, lastYearPace: 7, teamsWithinRadius: 39, states: ['NJ', 'PA', 'NY', 'CT', 'MD', 'DE'] },
      { id: 'd10', name: '18U Showcase', sport: 'fastpitch', ageGroup: '18U', registered: 9, capacity: 10, status: 'nearly_full', demandScore: 90, lastYearPace: 8, teamsWithinRadius: 31, states: ['NJ', 'PA', 'NY', 'CT', 'MA'] },
    ],
    totalRegistered: 35,
    totalCapacity: 54,
    revenue: 26250,
    revenueGoal: 40500,
    daysUntilEvent: 25,
    registrationPace: [2, 4, 6, 8, 11, 14, 18, 22, 28, 31, 33, 35],
    lastYearPace: [1, 3, 5, 7, 9, 12, 15, 19, 23, 27, 30, 33],
    campaignsActive: 2,
    abandonedRegistrations: 4,
    lapsedTeams: 8,
    nextAction: 'Activate 16U past-attendee reactivation',
    nextActionDetail: '16U Showcase is 60% filled. 39 eligible teams within 150 miles. 14 teams played this division last year but have not registered. Recommend personalized reactivation sequence.',
  },
  {
    id: 't3',
    name: 'Liberty Bell Baseball Blast',
    sport: 'baseball',
    date: '2026-08-02',
    endDate: '2026-08-04',
    city: 'Philadelphia',
    state: 'PA',
    venue: 'FDR Park Baseball Fields',
    director: 'Mike Reynolds',
    status: 'registration_open',
    divisions: [
      { id: 'd11', name: '8U Coach Pitch', sport: 'baseball', ageGroup: '8U', registered: 3, capacity: 10, status: 'at_risk', demandScore: 48, lastYearPace: 5, teamsWithinRadius: 22, states: ['PA', 'NJ', 'DE'] },
      { id: 'd12', name: '10U Open', sport: 'baseball', ageGroup: '10U', registered: 6, capacity: 12, status: 'on_track', demandScore: 75, lastYearPace: 5, teamsWithinRadius: 38, states: ['PA', 'NJ', 'DE', 'MD'] },
      { id: 'd13', name: '12U Open', sport: 'baseball', ageGroup: '12U', registered: 8, capacity: 12, status: 'on_track', demandScore: 82, lastYearPace: 7, teamsWithinRadius: 45, states: ['PA', 'NJ', 'DE', 'MD', 'NY'] },
      { id: 'd14', name: '15U Showcase', sport: 'baseball', ageGroup: '15U', registered: 5, capacity: 10, status: 'at_risk', demandScore: 50, lastYearPace: 6, teamsWithinRadius: 33, states: ['PA', 'NJ', 'DE', 'MD', 'NY', 'CT'] },
    ],
    totalRegistered: 22,
    totalCapacity: 44,
    revenue: 16500,
    revenueGoal: 33000,
    daysUntilEvent: 33,
    registrationPace: [1, 3, 5, 7, 9, 12, 15, 17, 19, 20, 21, 22],
    lastYearPace: [1, 2, 4, 6, 8, 10, 13, 16, 19, 22, 25, 28],
    campaignsActive: 1,
    abandonedRegistrations: 5,
    lapsedTeams: 15,
    nextAction: 'Launch 8U and 15U targeted campaigns',
    nextActionDetail: '8U Coach Pitch (30% filled) and 15U Showcase (50% filled) need attention. 55 combined eligible teams within 150 miles. Recommend division-specific email campaigns with early-bird incentive.',
  },
  {
    id: 't4',
    name: 'Empire State Fastpitch Championship',
    sport: 'fastpitch',
    date: '2026-08-09',
    endDate: '2026-08-11',
    city: 'Rochester',
    state: 'NY',
    venue: 'Rochester Softball Complex',
    director: 'Jennifer Torres',
    status: 'registration_open',
    divisions: [
      { id: 'd15', name: '12U Open', sport: 'fastpitch', ageGroup: '12U', registered: 4, capacity: 12, status: 'at_risk', demandScore: 45, lastYearPace: 6, teamsWithinRadius: 29, states: ['NY', 'PA', 'VT', 'MA'] },
      { id: 'd16', name: '14U Open', sport: 'fastpitch', ageGroup: '14U', registered: 6, capacity: 12, status: 'on_track', demandScore: 70, lastYearPace: 5, teamsWithinRadius: 36, states: ['NY', 'PA', 'VT', 'MA', 'CT'] },
      { id: 'd17', name: '16U Showcase', sport: 'fastpitch', ageGroup: '16U', registered: 8, capacity: 10, status: 'nearly_full', demandScore: 87, lastYearPace: 7, teamsWithinRadius: 41, states: ['NY', 'PA', 'VT', 'MA', 'CT', 'NJ'] },
      { id: 'd18', name: '18U Showcase', sport: 'fastpitch', ageGroup: '18U', registered: 7, capacity: 10, status: 'on_track', demandScore: 83, lastYearPace: 6, teamsWithinRadius: 28, states: ['NY', 'PA', 'MA', 'CT', 'NJ'] },
    ],
    totalRegistered: 25,
    totalCapacity: 44,
    revenue: 18750,
    revenueGoal: 33000,
    daysUntilEvent: 40,
    registrationPace: [1, 2, 4, 6, 8, 10, 13, 16, 19, 21, 23, 25],
    lastYearPace: [1, 2, 3, 5, 7, 9, 12, 15, 18, 21, 24, 27],
    campaignsActive: 2,
    abandonedRegistrations: 3,
    lapsedTeams: 10,
    nextAction: 'Boost 12U division with geo-targeted outreach',
    nextActionDetail: '12U Open is 33% filled, pacing 33% behind last year. 29 eligible teams within 150 miles, 18 have not been contacted. Recommend SMS + email campaign targeting NY, PA, VT, MA coaches.',
  },
];

// ============ TEAMS ============

export const teams: Team[] = [
  { id: 'tm1', name: 'Philly Phantoms', club: 'Phantom Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AA', city: 'Philadelphia', state: 'PA', zip: '19101', distanceFromVenue: 85, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 4, status: 'active', registrationStatus: 'not_registered', coachName: 'Tom Bradley', coachEmail: 'tbradley@email.com', coachPhone: '(215) 555-0142', consent: 'both' },
  { id: 'tm2', name: 'NJ Thunder', club: 'Thunder Sports', sport: 'baseball', ageGroup: '14U', classification: 'AAA', city: 'Trenton', state: 'NJ', zip: '08601', distanceFromVenue: 120, lastEvent: 'Liberty Bell Blast', lastEventDate: '2025-08-03', totalEvents: 3, status: 'lapsed', registrationStatus: 'not_registered', coachName: 'Dave Martinez', coachEmail: 'dmartinez@email.com', coachPhone: '(609) 555-0178', consent: 'both' },
  { id: 'tm3', name: 'Empire Eagles', club: 'Empire Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AA', city: 'Rochester', state: 'NY', zip: '14601', distanceFromVenue: 145, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 2, status: 'active', registrationStatus: 'not_registered', coachName: 'Steve Walsh', coachEmail: 'swalsh@email.com', coachPhone: '(585) 555-0193', consent: 'email' },
  { id: 'tm4', name: 'Maryland Crush', club: 'Crush Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AAA', city: 'Baltimore', state: 'MD', zip: '21201', distanceFromVenue: 95, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 5, status: 'lapsed', registrationStatus: 'not_registered', coachName: 'Marcus Johnson', coachEmail: 'mjohnson@email.com', coachPhone: '(410) 555-0167', consent: 'both' },
  { id: 'tm5', name: 'CT Storm', club: 'Storm Sports', sport: 'baseball', ageGroup: '14U', classification: 'AA', city: 'Hartford', state: 'CT', zip: '06101', distanceFromVenue: 240, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 1, status: 'active', registrationStatus: 'not_registered', coachName: 'Brian Lee', coachEmail: 'blee@email.com', coachPhone: '(860) 555-0112', consent: 'sms' },
  { id: 'tm6', name: 'VA Nationals', club: 'Nats Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AAA', city: 'Richmond', state: 'VA', zip: '23201', distanceFromVenue: 180, lastEvent: 'Liberty Bell Blast', lastEventDate: '2025-08-03', totalEvents: 3, status: 'lapsed', registrationStatus: 'not_registered', coachName: 'James Carter', coachEmail: 'jcarter@email.com', coachPhone: '(804) 555-0189', consent: 'both' },
  { id: 'tm7', name: 'Harrisburg Hornets', club: 'Hornets Baseball', sport: 'baseball', ageGroup: '14U', classification: 'A', city: 'Harrisburg', state: 'PA', zip: '17101', distanceFromVenue: 5, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 6, status: 'active', registrationStatus: 'registered', coachName: 'Frank Russo', coachEmail: 'frusso@email.com', coachPhone: '(717) 555-0145', consent: 'both' },
  { id: 'tm8', name: 'Lehigh Valley Sluggers', club: 'LV Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AA', city: 'Allentown', state: 'PA', zip: '18101', distanceFromVenue: 75, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 4, status: 'abandoned', registrationStatus: 'abandoned', coachName: 'Mike Stevens', coachEmail: 'mstevens@email.com', coachPhone: '(610) 555-0134', consent: 'both' },
  { id: 'tm9', name: 'Jersey Devils', club: 'JD Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AAA', city: 'Newark', state: 'NJ', zip: '07101', distanceFromVenue: 140, lastEvent: 'Liberty Bell Blast', lastEventDate: '2025-08-03', totalEvents: 2, status: 'new', registrationStatus: 'not_registered', coachName: 'Tony Esposito', coachEmail: 'tesposito@email.com', coachPhone: '(973) 555-0178', consent: 'email' },
  { id: 'tm10', name: 'NY Metro Mets', club: 'Metro Baseball', sport: 'baseball', ageGroup: '14U', classification: 'AAA', city: 'Bronx', state: 'NY', zip: '10451', distanceFromVenue: 165, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 3, status: 'active', registrationStatus: 'not_registered', coachName: 'Carlos Rivera', coachEmail: 'crivera@email.com', coachPhone: '(718) 555-0123', consent: 'both' },
  { id: 'tm11', name: 'Delaware Diamonds', club: 'Diamonds Sports', sport: 'baseball', ageGroup: '13U', classification: 'AA', city: 'Wilmington', state: 'DE', zip: '19801', distanceFromVenue: 110, lastEvent: 'Northeast Summer Classic', lastEventDate: '2025-07-19', totalEvents: 2, status: 'active', registrationStatus: 'not_registered', coachName: 'Pat O\'Brien', coachEmail: 'pobrien@email.com', coachPhone: '(302) 555-0156', consent: 'both' },
  { id: 'tm12', name: 'Bucks County Bombers', club: 'Bucks Baseball', sport: 'baseball', ageGroup: '13U', classification: 'AA', city: 'Doylestown', state: 'PA', zip: '18901', distanceFromVenue: 95, lastEvent: 'Liberty Bell Blast', lastEventDate: '2025-08-03', totalEvents: 4, status: 'lapsed', registrationStatus: 'not_registered', coachName: 'Greg Phillips', coachEmail: 'gphillips@email.com', coachPhone: '(215) 555-0189', consent: 'email' },
  { id: 'tm13', name: 'Fastpitch Fire', club: 'Fire Sports', sport: 'fastpitch', ageGroup: '16U', classification: 'A', city: 'Somerville', state: 'NJ', zip: '08876', distanceFromVenue: 2, lastEvent: 'Garden State Showcase', lastEventDate: '2025-07-26', totalEvents: 3, status: 'active', registrationStatus: 'registered', coachName: 'Lisa Anderson', coachEmail: 'landerson@email.com', coachPhone: '(908) 555-0145', consent: 'both' },
  { id: 'tm14', name: 'PA Power', club: 'Power Softball', sport: 'fastpitch', ageGroup: '16U', classification: 'AA', city: 'Pittsburgh', state: 'PA', zip: '15201', distanceFromVenue: 280, lastEvent: 'Garden State Showcase', lastEventDate: '2025-07-26', totalEvents: 2, status: 'lapsed', registrationStatus: 'not_registered', coachName: 'Karen Hughes', coachEmail: 'khughes@email.com', coachPhone: '(412) 555-0178', consent: 'both' },
  { id: 'tm15', name: 'CT Comets', club: 'Comets Sports', sport: 'fastpitch', ageGroup: '16U', classification: 'AA', city: 'New Haven', state: 'CT', zip: '06501', distanceFromVenue: 130, lastEvent: 'Garden State Showcase', lastEventDate: '2025-07-26', totalEvents: 4, status: 'active', registrationStatus: 'not_registered', coachName: 'Sandra Mills', coachEmail: 'smills@email.com', coachPhone: '(203) 555-0167', consent: 'both' },
  { id: 'tm16', name: 'MD Thunder Cats', club: 'Thunder Sports', sport: 'fastpitch', ageGroup: '16U', classification: 'A', city: 'Baltimore', state: 'MD', zip: '21201', distanceFromVenue: 150, lastEvent: 'Garden State Showcase', lastEventDate: '2025-07-26', totalEvents: 1, status: 'new', registrationStatus: 'not_registered', coachName: 'Rachel King', coachEmail: 'rking@email.com', coachPhone: '(410) 555-0134', consent: 'email' },
];

// ============ CAMPAIGNS ============

export const campaigns: Campaign[] = [
  { id: 'c1', name: '14U Recovery — Northeast Summer', tournamentId: 't1', tournamentName: 'Northeast Summer Classic', type: 'multi', template: 'Division Fill — Urgent', status: 'sent', sentDate: '2026-06-28', audience: 51, opened: 38, clicked: 22, registrations: 4, revenue: 3000, openRate: 74.5, clickRate: 43.1, conversionRate: 7.8 },
  { id: 'c2', name: '13U Early Bird Push', tournamentId: 't1', tournamentName: 'Northeast Summer Classic', type: 'email', template: 'Early Bird Deadline', status: 'sent', sentDate: '2026-06-25', audience: 38, opened: 27, clicked: 15, registrations: 3, revenue: 2250, openRate: 71.1, clickRate: 39.5, conversionRate: 7.9 },
  { id: 'c3', name: '16U Showcase — Past Attendees', tournamentId: 't2', tournamentName: 'Garden State Fastpitch Showcase', type: 'email', template: 'Past Attendee Reactivation', status: 'sent', sentDate: '2026-06-22', audience: 39, opened: 31, clicked: 19, registrations: 5, revenue: 3750, openRate: 79.5, clickRate: 48.7, conversionRate: 12.8 },
  { id: 'c4', name: '12U SMS Blast — Rochester', tournamentId: 't4', tournamentName: 'Empire State Fastpitch Championship', type: 'sms', template: 'Last Call Registration', status: 'active', sentDate: '2026-06-30', audience: 29, opened: 26, clicked: 14, registrations: 2, revenue: 1500, openRate: 89.7, clickRate: 48.3, conversionRate: 6.9 },
  { id: 'c5', name: '8U Coach Pitch Launch', tournamentId: 't3', tournamentName: 'Liberty Bell Baseball Blast', type: 'email', template: 'Tournament Launch', status: 'draft', sentDate: '', audience: 0, opened: 0, clicked: 0, registrations: 0, revenue: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
  { id: 'c6', name: 'Social — Summer Classic Promo', tournamentId: 't1', tournamentName: 'Northeast Summer Classic', type: 'social', template: 'Social Announcement', status: 'sent', sentDate: '2026-06-20', audience: 1200, opened: 840, clicked: 180, registrations: 6, revenue: 4500, openRate: 70.0, clickRate: 15.0, conversionRate: 0.5 },
  { id: 'c7', name: 'Abandoned Registration Recovery', tournamentId: 't1', tournamentName: 'Northeast Summer Classic', type: 'email', template: 'Abandoned Registration', status: 'sent', sentDate: '2026-06-27', audience: 7, opened: 6, clicked: 4, registrations: 2, revenue: 1500, openRate: 85.7, clickRate: 57.1, conversionRate: 28.6 },
];

// ============ JOURNEYS ============

export const journeys: Journey[] = [
  {
    id: 'j1',
    name: 'Abandoned Registration Recovery',
    type: 'abandoned_registration',
    status: 'active',
    enrolled: 23,
    completed: 19,
    converted: 11,
    conversionRate: 47.8,
    description: 'When a coach starts but does not complete registration, automatically send a reminder sequence to recover lost revenue.',
    steps: [
      { id: 's1', name: 'Registration reminder', channel: 'email', delay: '2 hours after abandonment', trigger: 'Registration started, not completed', sent: 23, opened: 20, clicked: 14 },
      { id: 's2', name: 'Division urgency', channel: 'email', delay: '1 day after step 1', trigger: 'Did not complete registration', sent: 18, opened: 15, clicked: 10 },
      { id: 's3', name: 'Final push — capacity alert', channel: 'sms', delay: '2 days after step 2', trigger: 'Still not registered, division has < 4 spots', sent: 12, opened: 11, clicked: 8 },
      { id: 's4', name: 'Stop — registered', channel: 'wait', delay: 'Immediate', trigger: 'Registration completed', sent: 0, opened: 0, clicked: 0 },
    ],
  },
  {
    id: 'j2',
    name: 'Past Attendee Reactivation',
    type: 'past_attendee_return',
    status: 'active',
    enrolled: 156,
    completed: 89,
    converted: 34,
    conversionRate: 21.8,
    description: 'When a new tournament launches, automatically invite teams who played the same event or division in prior years.',
    steps: [
      { id: 's5', name: 'Early access invitation', channel: 'email', delay: 'Event published', trigger: 'Team played same event last year', sent: 156, opened: 121, clicked: 67 },
      { id: 's6', name: 'Early bird deadline', channel: 'email', delay: '7 days after step 1', trigger: 'Has not registered', sent: 112, opened: 89, clicked: 45 },
      { id: 's7', name: 'Personalized SMS', channel: 'sms', delay: '3 days after step 2', trigger: 'Still not registered, within 150 miles', sent: 78, opened: 71, clicked: 34 },
      { id: 's8', name: 'Cross-sell similar events', channel: 'email', delay: '5 days after step 3', trigger: 'Did not register for this event', sent: 44, opened: 31, clicked: 12 },
    ],
  },
  {
    id: 'j3',
    name: 'Waitlist Fill',
    type: 'waitlist_fill',
    status: 'active',
    enrolled: 18,
    completed: 14,
    converted: 9,
    conversionRate: 64.3,
    description: 'When a spot opens in a sold-out division, automatically notify the next waitlisted team with a time-limited claim window.',
    steps: [
      { id: 's9', name: 'Spot opening notification', channel: 'sms', delay: 'Spot becomes available', trigger: 'Team on waitlist, spot opens in their division', sent: 18, opened: 17, clicked: 15 },
      { id: 's10', name: 'Claim reminder', channel: 'email', delay: '12 hours after step 1', trigger: 'Has not claimed spot', sent: 8, opened: 7, clicked: 5 },
      { id: 's11', name: 'Offer to next team', channel: 'sms', delay: '24 hours after step 1', trigger: 'Spot still unclaimed', sent: 4, opened: 4, clicked: 3 },
    ],
  },
  {
    id: 'j4',
    name: 'Post-Event Retention',
    type: 'post_event_retention',
    status: 'active',
    enrolled: 120,
    completed: 85,
    converted: 28,
    conversionRate: 23.3,
    description: 'After a tournament ends, automatically thank teams, collect feedback, and promote upcoming events.',
    steps: [
      { id: 's12', name: 'Thank you + results', channel: 'email', delay: '2 hours after event ends', trigger: 'Team participated in event', sent: 120, opened: 108, clicked: 72 },
      { id: 's13', name: 'Feedback survey', channel: 'email', delay: '1 day after step 1', trigger: 'Event ended', sent: 110, opened: 82, clicked: 58 },
      { id: 's14', name: 'Save the date — next year', channel: 'email', delay: '3 days after step 2', trigger: 'Survey submitted or skipped', sent: 85, opened: 71, clicked: 38 },
      { id: 's15', name: 'Cross-event recommendation', channel: 'email', delay: '7 days after step 3', trigger: 'Team has not registered for upcoming events', sent: 67, opened: 52, clicked: 28 },
    ],
  },
  {
    id: 'j5',
    name: 'Sponsor Activation Report',
    type: 'sponsor_activation',
    status: 'paused',
    enrolled: 6,
    completed: 4,
    converted: 3,
    conversionRate: 50.0,
    description: 'Automatically package sponsor campaign results, QR scan data, and offer redemption metrics into a post-event ROI report.',
    steps: [
      { id: 's16', name: 'Pre-event sponsor plan', channel: 'email', delay: '14 days before event', trigger: 'Sponsor has active inventory', sent: 6, opened: 6, clicked: 5 },
      { id: 's17', name: 'Event-day QR activation', channel: 'wait', delay: 'Event start', trigger: 'Sponsor QR codes deployed', sent: 6, opened: 0, clicked: 0 },
      { id: 's18', name: 'Post-event ROI report', channel: 'email', delay: '2 days after event ends', trigger: 'Event ended, sponsor was active', sent: 6, opened: 5, clicked: 4 },
      { id: 's19', name: 'Renewal outreach', channel: 'email', delay: '60 days before next season', trigger: 'Sponsor renewal date approaching', sent: 4, opened: 3, clicked: 2 },
    ],
  },
];

// ============ SPONSORS ============

export const sponsors: Sponsor[] = [
  { id: 'sp1', name: 'Under Armour', category: 'Apparel', logo: 'UA', tier: 'platinum', investment: 15000, events: 8, qrScans: 1240, offerRedemptions: 386, leads: 215, status: 'active', renewalDate: '2027-01-15', roi: 312 },
  { id: 'sp2', name: 'Dick\'s Sporting Goods', category: 'Retail', logo: 'DSG', tier: 'platinum', investment: 12000, events: 6, qrScans: 980, offerRedemptions: 312, leads: 178, status: 'active', renewalDate: '2026-12-01', roi: 267 },
  { id: 'sp3', name: 'Gatorade', category: 'Beverage', logo: 'GAT', tier: 'gold', investment: 7500, events: 5, qrScans: 645, offerRedemptions: 289, leads: 98, status: 'active', renewalDate: '2027-03-01', roi: 245 },
  { id: 'sp4', name: 'Rawlings', category: 'Equipment', logo: 'RAW', tier: 'gold', investment: 6000, events: 4, qrScans: 412, offerRedemptions: 156, leads: 67, status: 'pending_renewal', renewalDate: '2026-10-15', roi: 198 },
  { id: 'sp5', name: 'Marriott Hotels', category: 'Hospitality', logo: 'MAR', tier: 'silver', investment: 4000, events: 3, qrScans: 298, offerRedemptions: 124, leads: 52, status: 'active', renewalDate: '2027-06-01', roi: 156 },
  { id: 'sp6', name: 'Local Pizza Co', category: 'Food', logo: 'LPC', tier: 'bronze', investment: 1500, events: 2, qrScans: 187, offerRedemptions: 89, leads: 23, status: 'lapsed', renewalDate: '2026-06-01', roi: 89 },
];

// ============ DASHBOARD KPIs ============

export const dashboardKPIs = {
  totalEvents: 4,
  totalRegistrations: 120,
  totalCapacity: 200,
  totalRevenue: 90000,
  revenueGoal: 150000,
  fillRate: 60,
  abandonedRecoveries: 11,
  lapsedReactivations: 34,
  activeCampaigns: 8,
  campaignROI: 4.2,
  totalAudience: 2847,
  avgOpenRate: 76.3,
  avgConversionRate: 8.4,
};

// ============ STATES for geo targeting ============

export const states = ['PA', 'NY', 'NJ', 'MD', 'VA', 'CT', 'MA', 'DE', 'VT'];

export const stateData: { state: string; teams: number; registrations: number; potential: number }[] = [
  { state: 'PA', teams: 842, registrations: 48, potential: 124 },
  { state: 'NY', teams: 678, registrations: 32, potential: 89 },
  { state: 'NJ', teams: 534, registrations: 28, potential: 67 },
  { state: 'MD', teams: 312, registrations: 12, potential: 34 },
  { state: 'VA', teams: 289, registrations: 8, potential: 28 },
  { state: 'CT', teams: 198, registrations: 6, potential: 19 },
  { state: 'MA', teams: 156, registrations: 4, potential: 12 },
  { state: 'DE', teams: 89, registrations: 2, potential: 8 },
  { state: 'VT', teams: 49, registrations: 0, potential: 4 },
];

// ============ CAMPAIGN TEMPLATES ============

export const campaignTemplates = [
  { id: 'tpl1', name: 'Tournament Launch Announcement', category: 'Launch', channels: ['email', 'social'], description: 'Announce a new tournament with dates, venue, divisions, and registration link.' },
  { id: 'tpl2', name: 'Division Fill — Urgent', category: 'Fill', channels: ['email', 'sms'], description: 'Target specific divisions that need teams with urgency messaging.' },
  { id: 'tpl3', name: 'Early Bird Deadline', category: 'Promotion', channels: ['email'], description: 'Remind coaches of early-bird pricing deadline.' },
  { id: 'tpl4', name: 'Last Call Registration', category: 'Fill', channels: ['email', 'sms'], description: 'Final push before registration closes.' },
  { id: 'tpl5', name: 'Past Attendee Reactivation', category: 'Retention', channels: ['email'], description: 'Invite teams who played last year to register again.' },
  { id: 'tpl6', name: 'Abandoned Registration Recovery', category: 'Recovery', channels: ['email', 'sms'], description: 'Recover coaches who started but did not complete registration.' },
  { id: 'tpl7', name: 'Waitlist Opening', category: 'Fill', channels: ['sms'], description: 'Notify waitlisted teams when a spot opens.' },
  { id: 'tpl8', name: 'Post-Event Thank You', category: 'Retention', channels: ['email'], description: 'Thank teams for participating and promote upcoming events.' },
  { id: 'tpl9', name: 'Sponsor Offer Announcement', category: 'Sponsor', channels: ['email', 'social'], description: 'Promote sponsor offers and activations.' },
  { id: 'tpl10', name: 'Social Announcement', category: 'Launch', channels: ['social'], description: 'Social media graphics and copy for tournament promotion.' },
];
