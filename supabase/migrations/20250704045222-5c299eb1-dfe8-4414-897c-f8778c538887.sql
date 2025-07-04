-- Create storage bucket for order media files
INSERT INTO storage.buckets (id, name, public) VALUES ('order-media', 'order-media', true);

-- Create policies for order media uploads
CREATE POLICY "Order media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-media');

CREATE POLICY "Anyone can upload order media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-media');

CREATE POLICY "Anyone can update order media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'order-media');

-- Create table for order media files
CREATE TABLE public.order_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auftragsnummer TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'video', 'audio', 'text'
  content TEXT, -- For text notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_media ENABLE ROW LEVEL SECURITY;

-- Create policies for order media access
CREATE POLICY "Order media is publicly accessible" 
ON public.order_media 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create order media" 
ON public.order_media 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_order_media_auftragsnummer ON public.order_media(auftragsnummer);