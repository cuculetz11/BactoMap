-- ============================================================================
-- BactoMap — Supabase SQL Schema
-- Rulează acest script în Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. Tabelul NODES (Dreptunghiurile cu bacterii și subsecțiunile din Pop-up)
CREATE TABLE IF NOT EXISTS public.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Bacterie nouă',
    color_key TEXT NOT NULL DEFAULT 'violet',
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    subsections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabelul EDGES (Ramurile / Liniile dintre dreptunghiuri)
CREATE TABLE IF NOT EXISTS public.edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indecși pentru încărcare ultra-rapidă pe fiecare cont
CREATE INDEX IF NOT EXISTS idx_nodes_user_id ON public.nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_edges_user_id ON public.edges(user_id);

-- 4. Activare Row Level Security (Fiecare student își vede doar propria schemă)
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own nodes" ON public.nodes;
CREATE POLICY "Users manage own nodes"
    ON public.nodes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own edges" ON public.edges;
CREATE POLICY "Users manage own edges"
    ON public.edges
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
