export interface Rule {
  id: number;
  title: string;
  description: string;
  variant?: 'danger' | 'info' | 'attention'
}