CREATE TYPE public.app_role AS ENUM ('admin','dealer');
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  material text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  size_range text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'unisex',
  moq integer NOT NULL DEFAULT 12,
  price_12 numeric(10,2) NOT NULL,
  price_60 numeric(10,2) NOT NULL,
  price_240 numeric(10,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dealer read own orders" ON public.orders FOR SELECT TO authenticated USING (dealer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "dealer create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (dealer_id = auth.uid());
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.dealer_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "insert own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.dealer_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, contact_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name',''),
    COALESCE(NEW.raw_user_meta_data->>'contact_name', NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    COALESCE(NEW.raw_user_meta_data->>'city','')
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dealer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.products (name, sku, category, description, material, color, size_range, gender, moq, price_12, price_60, price_240, stock) VALUES
('Ironworks Steel-Toe Boot','IW-1001','Safety Boots','Full-grain leather safety boot with steel toe cap and oil-resistant outsole. Built for warehouse and site crews.','Full-grain leather','Chestnut','6-13','men',12,42.50,38.00,33.75,1840),
('Foreman Trek Hiker','FT-1042','Safety Boots','Padded ankle hiker with puncture-resistant midsole and quick-lace hardware.','Nubuck leather','Graphite','6-13','men',12,39.90,35.50,31.20,960),
('Metro Runner Knit','MR-2210','Athletic','Breathable engineered-knit runner on a compression-molded EVA midsole. Fast-moving retail volume.','Engineered knit','White / Slate','5-12','unisex',24,18.75,16.40,14.25,4320),
('Court Classic Low','CC-2255','Athletic','Retro cupsole court sneaker with stitched panels and vulcanized rubber outsole.','Canvas / suede','Off-white','5-12','unisex',24,16.50,14.75,12.90,3600),
('Bramford Oxford','BO-3301','Formal','Goodyear-welted cap-toe oxford with leather lining. A staple for menswear accounts.','Box calf leather','Black','6-12','men',12,54.00,48.60,43.00,720),
('Ellery Heel Pump','EH-3388','Formal','65mm block-heel pump with cushioned insole and grosgrain lining.','Microfiber suede','Ink Navy','35-41','women',12,22.40,19.80,17.50,1440),
('Harbor Deck Loafer','HD-4120','Casual','Hand-stitched moc-toe loafer on a lightweight siped rubber sole.','Pull-up leather','Cognac','6-13','men',12,27.30,24.10,21.40,1080),
('Sandbar Slide','SS-4180','Casual','Injection-moulded EVA slide with textured footbed. High-turnover summer line.','EVA','Sand','5-12','unisex',48,6.20,5.35,4.60,7200),
('Puddle Jumper Rainboot','PJ-5010','Kids','Waterproof pull-on rainboot with reflective heel pull and cushioned liner.','Natural rubber','Sunflower','8C-3Y','kids',24,11.80,10.20,8.95,2160),
('Playground Velcro Sneaker','PV-5044','Kids','Twin hook-and-loop straps, washable upper, wide toe box for growing feet.','Textile mesh','Cobalt','8C-3Y','kids',24,9.60,8.30,7.15,3840),
('Trailhead All-Terrain','TA-6002','Outdoor','Waterproof membrane bootie with aggressive lugged outsole for hiking accounts.','Suede / ripstop','Moss','6-13','unisex',12,46.00,41.00,36.50,880),
('Warehouse Slip-On Pro','WS-1088','Safety Boots','Slip-resistant, non-metallic composite toe slip-on for food-service and logistics.','Coated leather','Black','5-13','unisex',24,31.40,27.90,24.60,2400);