export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  recipeName?: string | null;
  isChecked: boolean;
}
