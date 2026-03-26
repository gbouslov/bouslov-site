// Trip data with airport coordinates for globe arc visualization

export interface Airport {
  code: string
  name: string
  city: string
  lat: number
  lng: number
}

export interface TripLeg {
  from: Airport
  to: Airport
  date: string
  dayOfWeek: string
  airline: string
  flightNumber: string
  confirmation: string
  departTime: string
  arriveTime: string
  duration: string
  stops: number
  stopCity?: string
  cost: number // total for 2 travelers
  travelers: string[]
}

export interface Trip {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  color: string
  legs: TripLeg[]
  countries: string[] // new countries visited
}

// Airport database
export const AIRPORTS: Record<string, Airport> = {
  ORD: { code: 'ORD', name: "O'Hare International", city: 'Chicago', lat: 41.9742, lng: -87.9073 },
  BGI: { code: 'BGI', name: 'Grantley Adams International', city: 'Barbados', lat: 13.0747, lng: -59.4925 },
  SVD: { code: 'SVD', name: 'Argyle International', city: 'St. Vincent', lat: 13.1443, lng: -61.2110 },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', lat: 25.7959, lng: -80.2870 },
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', lat: 33.6407, lng: -84.4277 },
  RIC: { code: 'RIC', name: 'Richmond International', city: 'Richmond', lat: 37.5052, lng: -77.3197 },
  RDU: { code: 'RDU', name: 'Raleigh-Durham', city: 'Raleigh', lat: 35.8801, lng: -78.7880 },
  HNL: { code: 'HNL', name: 'Daniel K. Inouye', city: 'Honolulu', lat: 21.3187, lng: -157.9225 },
  NRT: { code: 'NRT', name: 'Narita International', city: 'Tokyo', lat: 35.7720, lng: 140.3929 },
  SIN: { code: 'SIN', name: 'Changi', city: 'Singapore', lat: 1.3644, lng: 103.9915 },
  DPS: { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', lat: -8.7482, lng: 115.1672 },
  KUL: { code: 'KUL', name: 'KL International', city: 'Kuala Lumpur', lat: 2.7456, lng: 101.7099 },
  LBJ: { code: 'LBJ', name: 'Komodo', city: 'Labuan Bajo', lat: -8.4874, lng: 119.8890 },
  LOP: { code: 'LOP', name: 'Lombok International', city: 'Lombok', lat: -8.7573, lng: 116.2767 },
  NAN: { code: 'NAN', name: 'Nadi International', city: 'Fiji', lat: -17.7554, lng: 177.4436 },
}

// Booked trips
export const TRIPS: Trip[] = [
  {
    id: 'barbados-svg-2026',
    name: 'Barbados + St. Vincent',
    description: 'Southern Caribbean — 2 new countries',
    startDate: '2026-05-15',
    endDate: '2026-05-31',
    color: '#34d399',
    countries: ['Barbados', 'St. Vincent & Grenadines'],
    legs: [
      {
        from: AIRPORTS.ORD,
        to: AIRPORTS.BGI,
        date: '2026-05-15',
        dayOfWeek: 'Fri',
        airline: 'American Airlines',
        flightNumber: 'AA 2984',
        confirmation: 'FSUPZL',
        departTime: '5:00 AM',
        arriveTime: '3:32 PM',
        duration: '9h 32m',
        stops: 1,
        stopCity: 'Miami',
        cost: 537.00,
        travelers: ['Gabriel Bouslov', 'Daria Meshcheriakova'],
      },
      {
        from: AIRPORTS.BGI,
        to: AIRPORTS.SVD,
        date: '2026-05-18',
        dayOfWeek: 'Mon',
        airline: 'Caribbean Airlines',
        flightNumber: 'BW 223',
        confirmation: 'B9O48V',
        departTime: '12:35 PM',
        arriveTime: '1:20 PM',
        duration: '45m',
        stops: 0,
        cost: 303.60,
        travelers: ['Gabriel Bouslov', 'Daria Meshcheriakova'],
      },
      {
        from: AIRPORTS.SVD,
        to: AIRPORTS.RIC,
        date: '2026-05-23',
        dayOfWeek: 'Sat',
        airline: 'Delta Air Lines',
        flightNumber: 'DL 2979',
        confirmation: 'HZP5GV',
        departTime: '3:27 PM',
        arriveTime: '12:43 AM+1',
        duration: '9h 16m',
        stops: 1,
        stopCity: 'Atlanta',
        cost: 793.06,
        travelers: ['Gabriel Bouslov', 'Daria Meshcheriakova'],
      },
      {
        from: AIRPORTS.RDU,
        to: AIRPORTS.ORD,
        date: '2026-05-31',
        dayOfWeek: 'Sun',
        airline: 'United Airlines',
        flightNumber: 'UA 5732',
        confirmation: 'O65F1R',
        departTime: '11:39 AM',
        arriveTime: '1:09 PM',
        duration: '2h 30m',
        stops: 0,
        cost: 316.80,
        travelers: ['Gabriel Bouslov', 'Daria Meshcheriakova'],
      },
    ],
  },
]

// Transform trips into arc data for react-globe.gl
export interface ArcData {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  label: string
  legIndex: number
  tripId: string
  flightNumber: string
  date: string
}

export function getArcsFromTrips(trips: Trip[]): ArcData[] {
  return trips.flatMap(trip =>
    trip.legs.map((leg, i) => ({
      startLat: leg.from.lat,
      startLng: leg.from.lng,
      endLat: leg.to.lat,
      endLng: leg.to.lng,
      color: trip.color,
      label: `${leg.from.code} → ${leg.to.code}`,
      legIndex: i,
      tripId: trip.id,
      flightNumber: leg.flightNumber,
      date: leg.date,
    }))
  )
}
