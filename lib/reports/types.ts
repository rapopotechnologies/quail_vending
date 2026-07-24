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

export type LowBulkStockProduct = {
  id: string;
  name: string;
  warehouse_qty: number;
  warehouse_par_level: number | null;
};

export type ExpiringLot = {
  id: string;
  product_id: string;
  product_name: string;
  qty: number;
  expiry_date: string;
};

export type Activity = {
  id: string;
  type: "sale";
  machine_name: string;
  product_name: string;
  qty: number;
  at: string;
};
