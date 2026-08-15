CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, anon;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

DROP POLICY "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins update orders" ON public.orders;
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "dealer read own orders" ON public.orders;
CREATE POLICY "dealer read own orders" ON public.orders FOR SELECT TO authenticated
USING ((dealer_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins delete products" ON public.products;
CREATE POLICY "admins delete products" ON public.products FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins update products" ON public.products;
CREATE POLICY "admins update products" ON public.products FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "admins insert products" ON public.products;
CREATE POLICY "admins insert products" ON public.products FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "public read active products" ON public.products;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon, authenticated
USING (active OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "read own order items" ON public.order_items;
CREATE POLICY "read own order items" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.dealer_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

DROP FUNCTION public.has_role(uuid, public.app_role);