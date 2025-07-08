-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create additional_infos table
CREATE TABLE public.additional_infos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create column_settings table
CREATE TABLE public.column_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  column_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create excel_settings table
CREATE TABLE public.excel_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auftragsnummer_column INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create excel_data table
CREATE TABLE public.excel_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan_orders table
CREATE TABLE public.scan_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auftragsnummer TEXT NOT NULL,
  prioritaet INTEGER NOT NULL CHECK (prioritaet IN (1, 2)),
  zeitstempel TIMESTAMP WITH TIME ZONE NOT NULL,
  abteilung TEXT,
  zusatzinfo TEXT,
  zusatz_daten JSONB DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_infos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_orders ENABLE ROW LEVEL SECURITY;

-- Create public access policies (since this is an internal app)
CREATE POLICY "Public access to departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to additional_infos" ON public.additional_infos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to column_settings" ON public.column_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to excel_settings" ON public.excel_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to excel_data" ON public.excel_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to scan_orders" ON public.scan_orders FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_additional_infos_updated_at
  BEFORE UPDATE ON public.additional_infos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scan_orders_updated_at
  BEFORE UPDATE ON public.scan_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_additional_infos_department_id ON public.additional_infos(department_id);
CREATE INDEX idx_scan_orders_auftragsnummer ON public.scan_orders(auftragsnummer);
CREATE INDEX idx_scan_orders_completed ON public.scan_orders(completed);
CREATE INDEX idx_scan_orders_prioritaet ON public.scan_orders(prioritaet);