import { Target, Plane, MapPin, Home } from 'lucide-react'
import { PinType } from './supabase'

export const PIN_TYPES: Record<PinType, {
  label: string
  color: string
  bgColor: string
  icon: typeof Target
}> = {
  bucket_list: {
    label: 'Bucket List',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.2)',
    icon: Target,
  },
  trip_planned: {
    label: 'Trip Planned',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.2)',
    icon: Plane,
  },
  been_there: {
    label: 'Been There',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.2)',
    icon: MapPin,
  },
  home_base: {
    label: 'Home Base',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    icon: Home,
  },
}

export const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#3b82f6',
  'dbouslov@gmail.com': '#8b5cf6',
  'jbouslov@gmail.com': '#06b6d4',
  'bouslovd@gmail.com': '#10b981',
  'bouslovb@gmail.com': '#f59e0b',
  'lbouslov@gmail.com': '#ec4899',
}

export const USER_NAMES: Record<string, string> = {
  'gbouslov@gmail.com': 'Gabe',
  'dbouslov@gmail.com': 'David',
  'jbouslov@gmail.com': 'Jonathan',
  'bouslovd@gmail.com': 'Daniel',
  'bouslovb@gmail.com': 'Dad',
  'lbouslov@gmail.com': 'Mom',
}
