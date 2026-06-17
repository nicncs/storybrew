import { AnimalType } from './types';

interface AnimalInfo {
  emoji: string;
  displayName: string;
  suggestedName: string;
}

export const ANIMALS: Record<AnimalType, AnimalInfo> = {
  lion: { emoji: '🦁', displayName: 'Lion', suggestedName: 'Leo' },
  rabbit: { emoji: '🐰', displayName: 'Rabbit', suggestedName: 'Bonnie' },
  bear: { emoji: '🐻', displayName: 'Bear', suggestedName: 'Bruno' },
  owl: { emoji: '🦉', displayName: 'Owl', suggestedName: 'Ollie' },
  fox: { emoji: '🦊', displayName: 'Fox', suggestedName: 'Foxy' },
  elephant: { emoji: '🐘', displayName: 'Elephant', suggestedName: 'Ella' },
  mouse: { emoji: '🐭', displayName: 'Mouse', suggestedName: 'Milo' },
  puppy: { emoji: '🐶', displayName: 'Puppy', suggestedName: 'Pip' },
  kitten: { emoji: '🐱', displayName: 'Kitten', suggestedName: 'Kiki' },
  frog: { emoji: '🐸', displayName: 'Frog', suggestedName: 'Freddie' },
  penguin: { emoji: '🐧', displayName: 'Penguin', suggestedName: 'Percy' },
  turtle: { emoji: '🐢', displayName: 'Turtle', suggestedName: 'Tilly' },
};

export const ALL_ANIMALS = Object.keys(ANIMALS) as AnimalType[];
