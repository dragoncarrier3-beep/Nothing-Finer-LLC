import { DEMO_PASSWORD, JOB_STATUS_LABEL } from './constants';
import type { Activity, Customer, Db, InboxMessage, Job, JobNote, JobPriority, JobStatus, Site, User } from './types';

/** Bump when the shape or the sample data changes, so browsers holding older demo data get a fresh seed. */
export const SCHEMA = 4;

/**
 * Fictional sample data for the client review. Timestamps are relative to the moment the demo
 * is seeded, so "2h ago" always looks fresh. Activity entries are derived from the records below
 * so the log always matches the data.
 */
export function createSeed(): Db {
  const now = Date.now();
  const t = (days: number, hours = 0, minutes = 0) => new Date(now - ((days * 24 + hours) * 60 + minutes) * 60_000).toISOString();
  const plus = (iso: string, minutes: number) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

  // ------------------------------------------------------------------ team
  const users: User[] = [
    { id: 'u-jordan', name: 'Jordan Lee', email: 'jordan@nothingfiner.example', phone: '(512) 555-0100', role: 'owner', status: 'active', password: DEMO_PASSWORD, createdAt: t(180), activatedAt: t(180) },
    { id: 'u-dana', name: 'Dana Brooks', email: 'dana@nothingfiner.example', phone: '(512) 555-0101', role: 'admin', status: 'active', password: DEMO_PASSWORD, createdAt: t(120), activatedAt: t(120), invitedBy: 'u-jordan' },
    { id: 'u-marcus', name: 'Marcus Webb', email: 'marcus@nothingfiner.example', phone: '(512) 555-0114', role: 'tech', status: 'active', password: DEMO_PASSWORD, createdAt: t(75), activatedAt: t(74), invitedBy: 'u-jordan' },
    { id: 'u-luis', name: 'Luis Ortega', email: 'luis@nothingfiner.example', phone: '(512) 555-0127', role: 'tech', status: 'active', password: DEMO_PASSWORD, createdAt: t(40), activatedAt: t(40), invitedBy: 'u-dana' },
    { id: 'u-tyler', name: 'Tyler Nguyen', email: 'tyler@nothingfiner.example', role: 'tech', status: 'pending', password: '', createdAt: t(1, 2), invitedBy: 'u-dana' },
  ];

  // ------------------------------------------------------------------ customers & sites
  const customers: Customer[] = [
    { id: 'c-summit', name: 'Summit Dental Group', contactName: 'Priya Shah', phone: '(512) 555-0188', email: 'office@summitdental.example', notes: 'Office manager prefers a text 30 minutes before arrival.', createdAt: t(30, 4), createdBy: 'u-jordan' },
    { id: 'c-ridgeview', name: 'Ridgeview Logistics', contactName: 'Carl Mendes', phone: '(512) 555-0166', email: 'facilities@ridgeview.example', notes: 'Commercial account. Facilities manager approves any extra work before it starts.', createdAt: t(21, 5), createdBy: 'u-dana' },
    { id: 'c-hartwell', name: 'Hartwell Residence', contactName: 'Emily Hartwell', phone: '(512) 555-0142', email: 'emily.hartwell@example.com', createdAt: t(12, 3), createdBy: 'u-jordan' },
    { id: 'c-oakmont', name: 'Oakmont Apartments', contactName: 'Grace Kim', phone: '(512) 555-0175', email: 'manager@oakmontapts.example', notes: 'Property manager. Give tenants 24 hours notice before entering a unit.', createdAt: t(9, 2), createdBy: 'u-dana' },
    { id: 'c-lonestar', name: 'Lone Star Brewing Co.', contactName: 'Ben Harlan', phone: '(512) 555-0131', email: 'ben@lonestarbrewing.example', createdAt: t(7, 1), createdBy: 'u-jordan' },
    { id: 'c-alvarez', name: 'Alvarez Home', contactName: 'Rosa Alvarez', phone: '(512) 555-0193', email: 'rosa.alvarez@example.com', createdAt: t(1, 7), createdBy: 'u-dana' },
    { id: 'c-patel', name: 'Patel Residence', contactName: 'Anil Patel', phone: '(512) 555-0159', email: 'anil.patel@example.com', notes: 'Referred by the Hartwells.', createdAt: t(0, 7), createdBy: 'u-dana' },
  ];

  const site = (id: string, customerId: string, name: string, address: string, city: string, postalCode: string, accessInstructions: string | undefined, offsetMin = 2): Site => {
    const c = customers.find((x) => x.id === customerId)!;
    return { id, customerId, name, address, city, state: 'TX', postalCode, accessInstructions, createdAt: plus(c.createdAt, offsetMin) };
  };
  const sites: Site[] = [
    site('s-summit', 'c-summit', 'Cedar Park office', '1501 E Whitestone Blvd, Suite 110', 'Cedar Park', '78613', 'Work before 8 AM or after 5 PM. Electrical room key is at the front desk.'),
    site('s-ridge-wh', 'c-ridgeview', 'Warehouse B', '9200 Industrial Blvd', 'Round Rock', '78664', 'Check in at the guard shack. Hard hat and vest required. Keep dock door 3 clear.'),
    site('s-ridge-of', 'c-ridgeview', 'Front office', '9210 Industrial Blvd', 'Round Rock', '78664', 'Ask reception for Carl.', 3),
    site('s-hartwell', 'c-hartwell', 'Main house', '418 Live Oak Ln', 'Austin', '78704', 'Panel is in the garage. Side door code 4471. Friendly dog in the backyard.'),
    site('s-oak-a', 'c-oakmont', 'Building A', '3300 Oakmont Blvd, Bldg A', 'Austin', '78731', 'Unit keys in the leasing office lockbox. Meter room behind the stairwell.'),
    site('s-oak-lot', 'c-oakmont', 'Parking lot & exterior', '3300 Oakmont Blvd', 'Austin', '78731', 'Lighting controller is in the pool equipment room. Code 2208.', 3),
    site('s-lonestar', 'c-lonestar', 'Brewhouse', '615 E 6th St', 'Austin', '78701', 'Use the loading door on the alley side. Wear non-slip boots on the brew floor.'),
    site('s-alvarez', 'c-alvarez', 'Residence', '2207 Bluebonnet Dr', 'Pflugerville', '78660', 'Charger goes on the garage wall left of the water heater. HOA requires vans to park on the street.'),
    site('s-patel', 'c-patel', 'Residence', '1904 Ridgecrest Dr', 'Round Rock', '78681', 'Gas meter and main panel on the north side of the house.'),
  ];

  // ------------------------------------------------------------------ jobs (status history drives the activity log)
  type Spec = { n: number; title: string; customerId: string; siteId: string; assignedTo?: string; priority?: JobPriority; status: JobStatus; created: string; createdBy: string; description: string;
    history?: { status: JobStatus; at: string; by: string }[] };
  const specs: Spec[] = [
    { n: 1032, title: 'Office circuit inspection', customerId: 'c-summit', siteId: 's-summit', assignedTo: 'u-luis', status: 'completed', created: t(28, 6), createdBy: 'u-jordan',
      description: 'Inspect office branch circuits ahead of the new dental equipment. Test GFCI/AFCI protection and update the panel directory.',
      history: [{ status: 'in_progress', at: t(27, 2), by: 'u-dana' }, { status: 'completed', at: t(26, 1), by: 'u-dana' }] },
    { n: 1033, title: 'Dock door operator circuit repair', customerId: 'c-ridgeview', siteId: 's-ridge-wh', assignedTo: 'u-marcus', priority: 'urgent', status: 'completed', created: t(20, 4), createdBy: 'u-dana',
      description: 'Dock door 2 operator is dead. Trace the circuit from the panel and repair or replace the disconnect.',
      history: [{ status: 'in_progress', at: t(20, 1), by: 'u-dana' }, { status: 'completed', at: t(19, 2), by: 'u-dana' }] },
    { n: 1034, title: 'Smoke and CO detector replacement', customerId: 'c-hartwell', siteId: 's-hartwell', assignedTo: 'u-luis', status: 'completed', created: t(11, 5), createdBy: 'u-jordan',
      description: 'Replace all 10-year-old smoke detectors with interconnected smoke/CO combo units.',
      history: [{ status: 'completed', at: t(10, 1), by: 'u-jordan' }] },
    { n: 1035, title: 'Unit 4B outlet rewire', customerId: 'c-oakmont', siteId: 's-oak-a', assignedTo: 'u-luis', status: 'completed', created: t(8, 3), createdBy: 'u-dana',
      description: 'Tenant reports warm outlets in the kitchen and living room. Inspect and rewire as needed.',
      history: [{ status: 'in_progress', at: t(7, 5), by: 'u-dana' }, { status: 'completed', at: t(6, 2), by: 'u-dana' }] },
    { n: 1036, title: 'Brewhouse equipment circuits', customerId: 'c-lonestar', siteId: 's-lonestar', assignedTo: 'u-marcus', status: 'in_progress', created: t(6, 5), createdBy: 'u-jordan',
      description: 'Add dedicated circuits for two new fermenters and a glycol chiller. Confirm nameplate ratings before sizing.',
      history: [{ status: 'in_progress', at: t(5, 3), by: 'u-dana' }] },
    { n: 1037, title: 'Residential panel replacement', customerId: 'c-hartwell', siteId: 's-hartwell', assignedTo: 'u-marcus', status: 'in_progress', created: t(5, 2), createdBy: 'u-jordan',
      description: 'Replace the original 100A panel with a new 200A panel. Coordinate the utility disconnect and city inspection.',
      history: [{ status: 'in_progress', at: t(1, 7), by: 'u-dana' }] },
    { n: 1038, title: 'Warehouse lighting troubleshooting', customerId: 'c-ridgeview', siteId: 's-ridge-wh', assignedTo: 'u-marcus', priority: 'urgent', status: 'in_progress', created: t(3, 4), createdBy: 'u-dana',
      description: 'High-bay fixtures in aisles 4–7 flicker and drop out during second shift. Check drivers, circuit loading and the lighting contactor.',
      history: [{ status: 'in_progress', at: t(2, 6), by: 'u-dana' }] },
    { n: 1039, title: 'Parking lot pole light repair', customerId: 'c-oakmont', siteId: 's-oak-lot', assignedTo: 'u-luis', priority: 'urgent', status: 'new', created: t(2, 8), createdBy: 'u-dana',
      description: 'Two pole lights near the main entrance are out. Check the photocell, contactor and fixture heads. Bring the bucket truck.' },
    { n: 1040, title: 'EV charger installation', customerId: 'c-alvarez', siteId: 's-alvarez', assignedTo: 'u-luis', status: 'new', created: t(1, 5), createdBy: 'u-dana',
      description: 'Install a 48A Level 2 charger in the garage on a new 60A circuit. Customer is supplying the charger.' },
    { n: 1041, title: 'Whole-home generator transfer switch', customerId: 'c-patel', siteId: 's-patel', status: 'new', created: t(0, 6), createdBy: 'u-dana',
      description: 'Install a 200A automatic transfer switch for a new 22kW standby generator. Gas line by others.' },
    { n: 1042, title: 'Break room dedicated circuits', customerId: 'c-ridgeview', siteId: 's-ridge-of', status: 'new', created: t(0, 3), createdBy: 'u-dana',
      description: 'Add two dedicated 20A circuits for the new microwave and refrigerator.' },
  ];

  const jobs: Job[] = specs.map((s) => ({
    id: `j-${s.n}`, number: `NF-${s.n}`, title: s.title, customerId: s.customerId, siteId: s.siteId, assignedTo: s.assignedTo, description: s.description,
    priority: s.priority ?? 'normal', status: s.status, createdAt: s.created, createdBy: s.createdBy,
    updatedAt: s.history?.length ? s.history[s.history.length - 1].at : s.created,
  }));

  const notes: JobNote[] = [
    { jobId: 'j-1032', authorId: 'u-luis', at: t(26, 2), body: 'All branch circuits tested. Replaced two failed GFCI receptacles in operatory 3. Panel directory updated and a photo sent to Priya.' },
    { jobId: 'j-1033', authorId: 'u-marcus', at: t(19, 3), body: 'Burned contactor in the operator disconnect. Replaced it and torqued the lugs. Door cycled 20 times with no faults.' },
    { jobId: 'j-1034', authorId: 'u-luis', at: t(10, 2), body: 'Installed 8 combo smoke/CO units, all interconnected and tested. Old detectors bagged and taken for recycling.' },
    { jobId: 'j-1035', authorId: 'u-luis', at: t(7, 4), body: 'Found loose backstabbed connections on the kitchen circuit. Re-terminated all receptacles on screw terminals and replaced 3 scorched devices.' },
    { jobId: 'j-1035', authorId: 'u-dana', at: t(6, 1), body: 'Grace confirmed the tenant is back in the unit and happy. Closing this out.' },
    { jobId: 'j-1036', authorId: 'u-marcus', at: t(5, 1), body: 'Two 50A circuits run for the fermenters. Waiting on the glycol chiller nameplate before sizing the third circuit.' },
    { jobId: 'j-1036', authorId: 'u-dana', at: t(4, 3), body: 'Ben sent the chiller spec sheet: 208V 3-phase, 30A. Attached to the customer file.' },
    { jobId: 'j-1037', authorId: 'u-marcus', at: t(1, 6), body: 'Utility disconnect booked for Friday 8 AM. Permit posted on the panel door.' },
    { jobId: 'j-1038', authorId: 'u-marcus', at: t(2, 5), body: 'Found 3 failed LED drivers in aisle 5 and a loose neutral on lighting circuit 14. Neutral re-terminated. Replacement drivers ordered — ETA Thursday.' },
    { jobId: 'j-1038', authorId: 'u-dana', at: t(2, 1), body: 'Called Carl at Ridgeview — replacement drivers approved. Keep dock door 3 clear while working.' },
    { jobId: 'j-1039', authorId: 'u-dana', at: t(2, 7), body: 'Several tenants reported the dark entrance. Grace asked us to prioritize this before the weekend.' },
  ].map((n, i) => ({ id: `n-${i + 1}`, jobId: n.jobId, authorId: n.authorId, body: n.body, createdAt: n.at }));

  // ------------------------------------------------------------------ activity (derived)
  const name = (id: string) => users.find((u) => u.id === id)!.name;
  const label = (j: Job) => `${j.number} — ${j.title}`;
  let seq = 0;
  const activity: Activity[] = [];
  const a = (at: string, actorId: string, rest: Omit<Activity, 'id' | 'at' | 'actorId' | 'actorName'>) =>
    activity.push({ id: `a-${++seq}`, at, actorId, actorName: name(actorId), ...rest });

  a(t(40, 1), 'u-dana', { action: 'user.invited', verb: 'invited technician', targetType: 'user', targetId: 'u-luis', targetLabel: 'Luis Ortega' });
  a(t(40), 'u-luis', { action: 'user.activated', verb: 'accepted the invitation and activated their account' });
  a(t(1, 2), 'u-dana', { action: 'user.invited', verb: 'invited technician', targetType: 'user', targetId: 'u-tyler', targetLabel: 'Tyler Nguyen' });
  for (const c of customers) a(c.createdAt, c.createdBy, { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: c.id, targetLabel: c.name });
  for (const s of sites) {
    const c = customers.find((x) => x.id === s.customerId)!;
    a(s.createdAt, c.createdBy, { action: 'site.created', verb: 'added site', targetType: 'site', targetId: s.id, targetLabel: s.name, detail: `for ${c.name}`, customerId: c.id });
  }
  for (const s of specs) {
    const j = jobs.find((x) => x.id === `j-${s.n}`)!;
    a(s.created, s.createdBy, { action: 'job.created', verb: 'created job', targetType: 'job', targetId: j.id, targetLabel: label(j) });
    if (s.assignedTo) a(plus(s.created, 1), s.createdBy, { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: j.id, targetLabel: label(j), detail: `to ${name(s.assignedTo)}` });
    for (const h of s.history ?? []) a(h.at, h.by, { action: 'job.status_changed', verb: 'marked', targetType: 'job', targetId: j.id, targetLabel: label(j), detail: `as ${JOB_STATUS_LABEL[h.status]}` });
  }
  for (const n of notes) {
    const j = jobs.find((x) => x.id === n.jobId)!;
    a(n.createdAt, n.authorId, { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: j.id, targetLabel: label(j) });
  }
  activity.sort((x, y) => y.at.localeCompare(x.at));

  const inbox: InboxMessage[] = [
    { id: 'm-tyler', kind: 'invite', userId: 'u-tyler', to: 'tyler@nothingfiner.example', subject: 'Dana Brooks invited you to join Nothing Finer Field Operations', createdAt: t(1, 2), read: false },
  ];

  const startedAt = new Date(now).toISOString();
  return {
    schema: SCHEMA,
    users,
    customers,
    sites,
    jobs,
    notes,
    activity,
    inbox,
    nextJobNumber: 1043,
    // Reviewers land inside the app as the owner; the login screen is one click away.
    sessionUserId: 'u-jordan',
    runStartedAt: startedAt,
    lastOwnerSignInAt: startedAt,
  };
}
