export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  description: string;
  variant: 'admin' | 'moderator';
  image: string;
}

export const TEAM_DATA: TeamMember[] = [
  {
    id: 1,
    name: "Ilja Sizonenko",
    role: "Administraator",
    email: "ilsizo@taltech.ee",
    description: "Vastutab veebisaidi tehnilise korrashoiu, andmebaasi struktuuri ja üldiste reeglite täitmise eest.",
    variant: 'admin',
    image: "https://res.cloudinary.com/dwdgqbs1r/image/upload/v1776763264/IMG_20260421_121256_ko9pfo.jpg"
  },
  {
    id: 2,
    name: "Aleksandr Egorov",
    role: "Andmebaasi toimetaja",
    email: "aegoro@taltech.ee",
    description: "Kontrollib andmete õigsust (numbrimärgid, mudelid) ning teeb vajadusel parandusi andmebaasis.",
    variant: 'moderator',
    image: "https://res.cloudinary.com/dwdgqbs1r/image/upload/v1776763289/IMG_20260421_121345_thkpy9.jpg"
  }
];