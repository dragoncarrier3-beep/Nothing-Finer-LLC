import { DEMO_PASSWORD } from './constants';
import type { Activity, Customer, Db, Job, JobNote, Site, User } from './types';

export const SCHEMA = 3;

/**
 * Fictional sample data for the client demo. Timestamps are relative to the moment
 * the demo is seeded, so "2h ago" etc. always look fresh.
 */
export function createSeed(): Db {
  const now = Date.now();
  const t = (days: number, hours = 0, minutes = 0) => new Date(now - ((days * 24 + hours) * 60 + minutes) * 60_000).toISOString();

  const users: User[] = [
    { id: 'u-jordan', name: 'Jordan Lee', email: 'jordan@nothingfiner.example', phone: '(512) 555-0100', role: 'owner', status: 'active', password: DEMO_PASSWORD, createdAt: t(180), activatedAt: t(180) },
    { id: 'u-dana', name: 'Dana Brooks', email: 'dana@nothingfiner.example', phone: '(512) 555-0101', role: 'admin', status: 'active', password: DEMO_PASSWORD, createdAt: t(120), activatedAt: t(120), invitedBy: 'u-jordan' },
    { id: 'u-marcus', name: 'Marcus Webb', email: 'marcus@nothingfiner.example', phone: '(512) 555-0114', role: 'tech', status: 'active', password: DEMO_PASSWORD, createdAt: t(75), activatedAt: t(74), invitedBy: 'u-jordan' },
    { id: 'u-luis', name: 'Luis Ortega', email: 'luis@nothingfiner.example', phone: '(512) 555-0127', role: 'tech', status: 'active', password: DEMO_PASSWORD, createdAt: t(40), activatedAt: t(40), invitedBy: 'u-dana' },
  ];

  const customers: Customer[] = [
    { id: 'c-summit', name: 'Summit Dental Group', contactName: 'Priya Shah', phone: '(512) 555-0188', email: 'office@summitdental.example', notes: 'Office manager prefers text before arrival.', createdAt: t(10, 4), createdBy: 'u-jordan' },
    { id: 'c-hartwell', name: 'Hartwell Residence', contactName: 'Emily Hartwell', phone: '(512) 555-0142', email: 'emily.hartwell@example.com', createdAt: t(5, 3), createdBy: 'u-jordan' },
    { id: 'c-ridgeview', name: 'Ridgeview Logistics', contactName: 'Carl Mendes', phone: '(512) 555-0166', email: 'facilities@ridgeview.example', notes: 'Net-30 commercial account. Facilities manager approves all extra work.', createdAt: t(3, 5), createdBy: 'u-dana' },
    { id: 'c-alvarez', name: 'Alvarez Home', contactName: 'Rosa Alvarez', phone: '(512) 555-0193', email: 'rosa.alvarez@example.com', createdAt: t(1, 6), createdBy: 'u-dana' },
  ];

  const sites: Site[] = [
    { id: 's-summit', customerId: 'c-summit', name: 'Cedar Park office', address: '1501 E Whitestone Blvd, Suite 110', city: 'Cedar Park', state: 'TX', postalCode: '78613', accessInstructions: 'Work before 8 AM or after 5 PM. Electrical room key is at the front desk.', createdAt: t(10, 4) },
    { id: 's-hartwell', customerId: 'c-hartwell', name: 'Main house', address: '418 Live Oak Ln', city: 'Austin', state: 'TX', postalCode: '78704', accessInstructions: 'Panel is in the garage. Side door code 4471. Friendly dog in the backyard.', createdAt: t(5, 3) },
    { id: 's-ridge-wh', customerId: 'c-ridgeview', name: 'Warehouse B', address: '9200 Industrial Blvd', city: 'Round Rock', state: 'TX', postalCode: '78664', accessInstructions: 'Check in at the guard shack. Hard hat and vest required. Keep dock door 3 clear.', createdAt: t(3, 5) },
    { id: 's-ridge-of', customerId: 'c-ridgeview', name: 'Front office', address: '9210 Industrial Blvd', city: 'Round Rock', state: 'TX', postalCode: '78664', accessInstructions: 'Ask reception for Carl.', createdAt: t(3, 5) },
    { id: 's-alvarez', customerId: 'c-alvarez', name: 'Residence', address: '2207 Bluebonnet Dr', city: 'Pflugerville', state: 'TX', postalCode: '78660', accessInstructions: 'Charger goes on the garage wall left of the water heater. HOA requires vans to park on the street.', createdAt: t(1, 6) },
  ];

  const jobs: Job[] = [
    { id: 'j-1037', number: 'NF-1037', title: 'Office circuit inspection', customerId: 'c-summit', siteId: 's-summit', assignedTo: 'u-luis', priority: 'normal', status: 'completed',
      description: 'Inspect office branch circuits ahead of the new dental equipment. Test GFCI/AFCI protection and update the panel directory.', createdAt: t(9, 6), createdBy: 'u-jordan', updatedAt: t(6, 1) },
    { id: 'j-1039', number: 'NF-1039', title: 'Residential panel replacement', customerId: 'c-hartwell', siteId: 's-hartwell', assignedTo: 'u-marcus', priority: 'normal', status: 'in_progress',
      description: 'Replace the original 100A panel with a new 200A panel. Coordinate the utility disconnect and city inspection.', createdAt: t(5, 2), createdBy: 'u-jordan', updatedAt: t(1, 6) },
    { id: 'j-1038', number: 'NF-1038', title: 'Warehouse lighting troubleshooting', customerId: 'c-ridgeview', siteId: 's-ridge-wh', assignedTo: 'u-marcus', priority: 'urgent', status: 'in_progress',
      description: 'High-bay fixtures in aisles 4–7 flicker and drop out during second shift. Check drivers, circuit loading and the lighting contactor.', createdAt: t(3, 4), createdBy: 'u-dana', updatedAt: t(2, 1) },
    { id: 'j-1040', number: 'NF-1040', title: 'EV charger installation', customerId: 'c-alvarez', siteId: 's-alvarez', assignedTo: 'u-luis', priority: 'normal', status: 'new',
      description: 'Install a 48A Level 2 charger in the garage on a new 60A circuit. Customer is supplying the charger.', createdAt: t(1, 5), createdBy: 'u-dana', updatedAt: t(1, 5) },
    { id: 'j-1041', number: 'NF-1041', title: 'Break room dedicated circuits', customerId: 'c-ridgeview', siteId: 's-ridge-of', priority: 'normal', status: 'new',
      description: 'Add two dedicated 20A circuits for the new microwave and refrigerator.', createdAt: t(0, 3), createdBy: 'u-dana', updatedAt: t(0, 3) },
  ];

  const notes: JobNote[] = [
    { id: 'n-1', jobId: 'j-1037', authorId: 'u-luis', body: 'All branch circuits tested. Replaced two failed GFCI receptacles in operatory 3. Panel directory updated and photo sent to Priya.', createdAt: t(6, 2) },
    { id: 'n-2', jobId: 'j-1038', authorId: 'u-marcus', body: 'Found 3 failed LED drivers in aisle 5 and a loose neutral on lighting circuit 14. Neutral re-terminated. Replacement drivers ordered — ETA Thursday.', createdAt: t(2, 5) },
    { id: 'n-3', jobId: 'j-1038', authorId: 'u-dana', body: 'Called Carl at Ridgeview — replacement drivers approved. Keep dock door 3 clear while working.', createdAt: t(2, 1) },
    { id: 'n-4', jobId: 'j-1039', authorId: 'u-marcus', body: 'Utility disconnect booked for Friday 8 AM. Permit posted on the panel door.', createdAt: t(1, 6) },
  ];

  const name = (id: string) => users.find((u) => u.id === id)!.name;
  let seq = 0;
  const a = (at: string, actorId: string, rest: Omit<Activity, 'id' | 'at' | 'actorId' | 'actorName'>): Activity =>
    ({ id: `a-${++seq}`, at, actorId, actorName: name(actorId), ...rest });
  const jl = (id: string) => { const j = jobs.find((x) => x.id === id)!; return `${j.number} — ${j.title}`; };

  const activity: Activity[] = [
    a(t(40, 1), 'u-dana', { action: 'user.invited', verb: 'invited technician', targetType: 'user', targetId: 'u-luis', targetLabel: 'Luis Ortega' }),
    a(t(40), 'u-luis', { action: 'user.activated', verb: 'accepted the invitation and activated their account' }),
    a(t(10, 4), 'u-jordan', { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: 'c-summit', targetLabel: 'Summit Dental Group' }),
    a(t(10, 3, 58), 'u-jordan', { action: 'site.created', verb: 'added site', targetType: 'site', targetId: 's-summit', targetLabel: 'Cedar Park office', detail: 'for Summit Dental Group', customerId: 'c-summit' }),
    a(t(9, 6), 'u-jordan', { action: 'job.created', verb: 'created job', targetType: 'job', targetId: 'j-1037', targetLabel: jl('j-1037') }),
    a(t(9, 5, 59), 'u-jordan', { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: 'j-1037', targetLabel: jl('j-1037'), detail: 'to Luis Ortega' }),
    a(t(6, 2), 'u-luis', { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: 'j-1037', targetLabel: jl('j-1037') }),
    a(t(6, 1), 'u-jordan', { action: 'job.status_changed', verb: 'marked', targetType: 'job', targetId: 'j-1037', targetLabel: jl('j-1037'), detail: 'as Completed' }),
    a(t(5, 3), 'u-jordan', { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: 'c-hartwell', targetLabel: 'Hartwell Residence' }),
    a(t(5, 2, 58), 'u-jordan', { action: 'site.created', verb: 'added site', targetType: 'site', targetId: 's-hartwell', targetLabel: 'Main house', detail: 'for Hartwell Residence', customerId: 'c-hartwell' }),
    a(t(5, 2), 'u-jordan', { action: 'job.created', verb: 'created job', targetType: 'job', targetId: 'j-1039', targetLabel: jl('j-1039') }),
    a(t(5, 1, 59), 'u-jordan', { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: 'j-1039', targetLabel: jl('j-1039'), detail: 'to Marcus Webb' }),
    a(t(3, 5), 'u-dana', { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: 'c-ridgeview', targetLabel: 'Ridgeview Logistics' }),
    a(t(3, 4, 58), 'u-dana', { action: 'site.created', verb: 'added site', targetType: 'site', targetId: 's-ridge-wh', targetLabel: 'Warehouse B', detail: 'for Ridgeview Logistics', customerId: 'c-ridgeview' }),
    a(t(3, 4, 57), 'u-dana', { action: 'site.created', verb: 'added site', targetType: 'site', targetId: 's-ridge-of', targetLabel: 'Front office', detail: 'for Ridgeview Logistics', customerId: 'c-ridgeview' }),
    a(t(3, 4), 'u-dana', { action: 'job.created', verb: 'created job', targetType: 'job', targetId: 'j-1038', targetLabel: jl('j-1038') }),
    a(t(3, 3, 59), 'u-dana', { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: 'j-1038', targetLabel: jl('j-1038'), detail: 'to Marcus Webb' }),
    a(t(2, 6), 'u-dana', { action: 'job.status_changed', verb: 'marked', targetType: 'job', targetId: 'j-1038', targetLabel: jl('j-1038'), detail: 'as In Progress' }),
    a(t(2, 5), 'u-marcus', { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: 'j-1038', targetLabel: jl('j-1038') }),
    a(t(2, 1), 'u-dana', { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: 'j-1038', targetLabel: jl('j-1038') }),
    a(t(1, 7), 'u-dana', { action: 'job.status_changed', verb: 'marked', targetType: 'job', targetId: 'j-1039', targetLabel: jl('j-1039'), detail: 'as In Progress' }),
    a(t(1, 6), 'u-marcus', { action: 'note.added', verb: 'added a note to', targetType: 'job', targetId: 'j-1039', targetLabel: jl('j-1039') }),
    a(t(1, 6), 'u-dana', { action: 'customer.created', verb: 'created customer', targetType: 'customer', targetId: 'c-alvarez', targetLabel: 'Alvarez Home' }),
    a(t(1, 5, 58), 'u-dana', { action: 'site.created', verb: 'added site', targetType: 'site', targetId: 's-alvarez', targetLabel: 'Residence', detail: 'for Alvarez Home', customerId: 'c-alvarez' }),
    a(t(1, 5), 'u-dana', { action: 'job.created', verb: 'created job', targetType: 'job', targetId: 'j-1040', targetLabel: jl('j-1040') }),
    a(t(1, 4, 59), 'u-dana', { action: 'job.assigned', verb: 'assigned', targetType: 'job', targetId: 'j-1040', targetLabel: jl('j-1040'), detail: 'to Luis Ortega' }),
    a(t(0, 3), 'u-dana', { action: 'job.created', verb: 'created job', targetType: 'job', targetId: 'j-1041', targetLabel: jl('j-1041') }),
  ].sort((x, y) => y.at.localeCompare(x.at));

  return {
    schema: SCHEMA,
    users,
    customers,
    sites,
    jobs,
    notes,
    activity,
    inbox: [],
    nextJobNumber: 1042,
    sessionUserId: null,
  };
}
