export type SaleRecord = {
  id: string;
  qty: number;
  unit_price: number;
  sold_at: string;
  machine_id: string;
  machine_name: string;
  product_id: string;
  product_name: string;
};

export type LowStockSlot = {
  id: string;
  slot_label: string;
  machine_id: string;
  machine_name: string;
  product_name: string | null;
  current_qty: number;
  par_level: number;
};

export type LowBulkStockProduct = {
  id: string;
  name: string;
  warehouse_qty: number;
  warehouse_par_level: number;
};

export type RestockActivity = {
  id: string;
  type: "restock";
  machine_name: string;
  notes: string | null;
  at: string;
};

export type SaleActivity = {
  id: string;
  type: "sale";
  machine_name: string;
  product_name: string;
  qty: number;
  at: string;
};

export type Activity = RestockActivity | SaleActivity;
