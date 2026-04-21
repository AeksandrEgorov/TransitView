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
    image: "/src/data/garden.jpg"
  },
  {
    id: 2,
    name: "Aleksandr Egorov",
    role: "Andmebaasi toimetaja",
    email: "aegoro@taltech.ee",
    description: "Kontrollib andmete õigsust (numbrimärgid, mudelid) ning teeb vajadusel parandusi andmebaasis.",
    variant: 'moderator',
    image: "/src/data/garden.jpg"
  }
];