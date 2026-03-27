import {
  Trophy,
  Code,
  Dumbbell,
  BookOpen,
  Music,
  Briefcase,
  Heart,
  Compass,
  Gamepad2,
  GraduationCap,
  Camera,
  ChefHat,
  type LucideIcon,
} from 'lucide-react'

export interface FamilyMember {
  name: string
  email: string
  bio: string
  traits: { label: string; icon: LucideIcon }[]
  photo: string | null
  color: string
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  {
    name: 'Gabe',
    email: 'gbouslov@gmail.com',
    bio: 'The eldest. Chess strategist, fitness enthusiast, and the one who started the family competitions.',
    traits: [
      { label: 'Chess', icon: Trophy },
      { label: 'Fitness', icon: Dumbbell },
      { label: 'Strategy', icon: Compass },
    ],
    photo: '/family/gabe.png',
    color: 'blue',
  },
  {
    name: 'David',
    email: 'dbouslov@gmail.com',
    bio: 'Med student by day, builder by night. Turns ideas into code and research into publications.',
    traits: [
      { label: 'Medicine', icon: GraduationCap },
      { label: 'Code', icon: Code },
      { label: 'Research', icon: BookOpen },
    ],
    photo: '/family/david.png',
    color: 'emerald',
  },
  {
    name: 'Jonathan',
    email: 'jbouslov@gmail.com',
    bio: 'Creative mind with an ear for music and an eye for detail. Always up for a challenge.',
    traits: [
      { label: 'Music', icon: Music },
      { label: 'Gaming', icon: Gamepad2 },
      { label: 'Creative', icon: Camera },
    ],
    photo: '/family/jonathan.png',
    color: 'violet',
  },
  {
    name: 'Daniel',
    email: 'bouslovd@gmail.com',
    bio: 'The youngest brother. Quick learner, competitive spirit, and always keeps things interesting.',
    traits: [
      { label: 'Gaming', icon: Gamepad2 },
      { label: 'Sports', icon: Dumbbell },
      { label: 'Learning', icon: BookOpen },
    ],
    photo: '/family/daniel.png',
    color: 'amber',
  },
  {
    name: 'Dad',
    email: 'bouslovb@gmail.com',
    bio: 'The patriarch. Built a family that competes together and travels the world.',
    traits: [
      { label: 'Business', icon: Briefcase },
      { label: 'Travel', icon: Compass },
      { label: 'Cooking', icon: ChefHat },
    ],
    photo: '/family/dad.png',
    color: 'rose',
  },
  {
    name: 'Mom',
    email: 'lbouslov@gmail.com',
    bio: 'The heart of the family. Keeps everyone connected, grounded, and well-fed.',
    traits: [
      { label: 'Family', icon: Heart },
      { label: 'Cooking', icon: ChefHat },
      { label: 'Travel', icon: Compass },
    ],
    photo: '/family/mom.png',
    color: 'pink',
  },
]

// Map color names to Tailwind classes for trait badges and card accents.
// These must remain as full static strings for Tailwind JIT to include them.
export const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'hover:shadow-blue-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'hover:shadow-emerald-500/10',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'hover:shadow-violet-500/10',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'hover:shadow-amber-500/10',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    glow: 'hover:shadow-rose-500/10',
  },
  pink: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/20',
    glow: 'hover:shadow-pink-500/10',
  },
}

// Get a member's color classes
export function getMemberColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.blue
}
