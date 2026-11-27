import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  BacteriaEdgeRecord,
  BacteriaNodeRecord,
  UserSession,
} from "@/types/bacteria";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl.startsWith("http");

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Transformă un username simplu (ex: "alana") într-un email intern valid pentru Supabase Auth
 * dacă utilizatorul nu a introdus deja o adresă de email cu '@'.
 */
export function normalizeIdentifierToEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  if (clean.includes("@")) return clean;
  const sanitized = clean.replace(/[^a-z0-9._-]/g, "");
  return `${sanitized || "student"}@bactomap.app`;
}

export function extractUsername(emailOrUsername: string): string {
  if (!emailOrUsername) return "student";
  return emailOrUsername.split("@")[0];
}

// ============================================================================
// DATE INIȚIALE DEMO (Pentru un cont proaspăt creat, ca să vadă direct cum arată)
// ============================================================================
export function createStarterTemplate(userId: string): {
  nodes: BacteriaNodeRecord[];
  edges: BacteriaEdgeRecord[];
} {
  const rootGramPosId = crypto.randomUUID();
  const staphId = crypto.randomUUID();
  const strepId = crypto.randomUUID();
  const rootGramNegId = crypto.randomUUID();
  const ecoliId = crypto.randomUUID();

  const nodes: BacteriaNodeRecord[] = [
    {
      id: rootGramPosId,
      user_id: userId,
      title: "Coci Gram-Pozitivi",
      color_key: "violet",
      position_x: 120,
      position_y: 80,
      subsections: [
        {
          id: crypto.randomUUID(),
          title: "Caractere generale",
          content:
            "Se colorează în violet la colorația Gram (perete gros de peptidoglican). Se împart în funcție de testul catalazei în Stafilococi (catalazo+) și Streptococi (catalazo-).",
        },
      ],
    },
    {
      id: staphId,
      user_id: userId,
      title: "Staphylococcus aureus",
      color_key: "violet",
      position_x: -20,
      position_y: 260,
      subsections: [
        {
          id: crypto.randomUUID(),
          title: "Morfologie & Cultură",
          content:
            "Coci Gram+ dispuși în grămezi (ciorchine de strugure). Catalază (+), Coagulază (+). Colonii aurii, beta-hemolitice pe geloză-sânge.",
        },
        {
          id: crypto.randomUUID(),
          title: "Factori de virulență",
          content:
            "Proteina A (leagă Fc al IgG), Coagulaza, Toxina șocului toxic (TSST-1), Exfoliatine, Enterotoxine termostabile.",
        },
        {
          id: crypto.randomUUID(),
          title: "Boli & Clinică",
          content:
            "Infecții cutanate (foliculită, furuncul, impetigo), endocardită, osteomielită, pneumonie, toxiinfecții alimentare.",
        },
      ],
    },
    {
      id: strepId,
      user_id: userId,
      title: "Streptococcus pyogenes",
      color_key: "violet",
      position_x: 270,
      position_y: 260,
      subsections: [
        {
          id: crypto.randomUUID(),
          title: "Clasificare",
          content:
            "Streptococ beta-hemolitic de grup A (Lancefield). Coci Gram+ în lanțuri, Catalază (-), sensibil la Bacitracină.",
        },
        {
          id: crypto.randomUUID(),
          title: "Patologie",
          content:
            "Angină streptococică, scarlatină, erizipel. Complicații post-streptococice: RAA și glomerulonefrită acută.",
        },
      ],
    },
    {
      id: rootGramNegId,
      user_id: userId,
      title: "Enterobacteriaceae (Gram -)",
      color_key: "rose",
      position_x: 680,
      position_y: 80,
      subsections: [
        {
          id: crypto.randomUUID(),
          title: "Caractere generale",
          content:
            "Bacili Gram-negativi, facultativ anaerobi, fermentează glucoza, oxidazo-negativi, reduc nitrații la nitriți.",
        },
      ],
    },
    {
      id: ecoliId,
      user_id: userId,
      title: "Escherichia coli",
      color_key: "rose",
      position_x: 680,
      position_y: 260,
      subsections: [
        {
          id: crypto.randomUUID(),
          title: "Identificare",
          content:
            "Bacil Gram (-), Lactozo (+) pe mediul MacConkey (colonii roz), Indol (+), luciu metalic pe mediul EMB.",
        },
        {
          id: crypto.randomUUID(),
          title: "Rol patogen",
          content:
            "Cea mai frecventă cauză de infecții de tract urinar (ITU), diaree (ETEC, EPEC, EHEC O157:H7), meningită neonatală (antigen K1).",
        },
      ],
    },
  ];

  const edges: BacteriaEdgeRecord[] = [
    {
      id: crypto.randomUUID(),
      user_id: userId,
      source_id: rootGramPosId,
      target_id: staphId,
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      source_id: rootGramPosId,
      target_id: strepId,
    },
    {
      id: crypto.randomUUID(),
      user_id: userId,
      source_id: rootGramNegId,
      target_id: ecoliId,
    },
  ];

  return { nodes, edges };
}

// ============================================================================
// STORAGE LOCAL FALLBACK (Când se rulează local fără chei Supabase)
// ============================================================================
const LOCAL_USERS_KEY = "bactomap_local_users_v1";
const LOCAL_SESSION_KEY = "bactomap_local_session_v1";
const getLocalGraphKey = (userId: string) => `bactomap_graph_${userId}`;
const getLocalEdgeColorsKey = (userId: string) =>
  `bactomap_edge_colors_${userId}`;

interface LocalUserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
}

export async function getActiveSession(): Promise<UserSession | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      username:
        (user.user_metadata?.username as string) ||
        extractUsername(user.email || "student"),
    };
  }

  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function signInWithIdentifier(
  identifier: string,
  password: string
): Promise<{ session?: UserSession; error?: string }> {
  const email = normalizeIdentifierToEmail(identifier);
  const username = extractUsername(identifier);

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return {
        error:
          "Date de autentificare incorecte sau contul nu există. Verifică username-ul și parola.",
      };
    }
    return {
      session: {
        id: data.user.id,
        email: data.user.email || email,
        username:
          (data.user.user_metadata?.username as string) ||
          extractUsername(data.user.email || username),
      },
    };
  }

  // Fallback Local
  const rawUsers = localStorage.getItem(LOCAL_USERS_KEY);
  const users: LocalUserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
  const found = users.find(
    (u) =>
      (u.email === email || u.username.toLowerCase() === username.toLowerCase()) &&
      u.password === password
  );

  if (!found) {
    return {
      error: "Contul nu a fost găsit sau parola este greșită. Creează un cont nou!",
    };
  }

  const session: UserSession = {
    id: found.id,
    username: found.username,
    email: found.email,
    isLocalDemo: true,
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return { session };
}

export async function signUpWithIdentifier(
  identifier: string,
  password: string
): Promise<{ session?: UserSession; error?: string }> {
  const email = normalizeIdentifierToEmail(identifier);
  const username = extractUsername(identifier);

  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error || !data.user) {
      return { error: error?.message || "Eroare la crearea contului." };
    }
    return {
      session: {
        id: data.user.id,
        email: data.user.email || email,
        username,
      },
    };
  }

  // Fallback Local
  const rawUsers = localStorage.getItem(LOCAL_USERS_KEY);
  const users: LocalUserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];
  if (
    users.some(
      (u) =>
        u.email === email || u.username.toLowerCase() === username.toLowerCase()
    )
  ) {
    return { error: "Acest username sau email există deja. Alege altul sau intră în cont." };
  }

  const newUser: LocalUserAccount = {
    id: crypto.randomUUID(),
    username,
    email,
    password,
  };
  users.push(newUser);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

  const session: UserSession = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    isLocalDemo: true,
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return { session };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
}

// ============================================================================
// ÎNCĂRCARE & SALVARE ARBORI (NODES + EDGES)
// ============================================================================
export async function loadUserGraph(userId: string): Promise<{
  nodes: BacteriaNodeRecord[];
  edges: BacteriaEdgeRecord[];
}> {
  if (supabase) {
    const [nodesRes, edgesRes] = await Promise.all([
      supabase
        .from("nodes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("edges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (!nodesRes.error && nodesRes.data && nodesRes.data.length > 0) {
      let colorMap: Record<string, string> = {};
      if (typeof window !== "undefined") {
        try {
          colorMap = JSON.parse(
            localStorage.getItem(getLocalEdgeColorsKey(userId)) || "{}"
          );
        } catch {
          colorMap = {};
        }
      }
      const hydratedEdges = ((edgesRes.data || []) as BacteriaEdgeRecord[]).map(
        (e) => ({
          ...e,
          color: e.color || colorMap[e.id],
        })
      );
      return {
        nodes: nodesRes.data as BacteriaNodeRecord[],
        edges: hydratedEdges,
      };
    }

    // Dacă utilizatorul este nou și nu are niciun nod în baza de date, îi creăm șablonul de start
    const starter = createStarterTemplate(userId);
    await supabase.from("nodes").insert(starter.nodes);
    await supabase.from("edges").insert(starter.edges);
    return starter;
  }

  // Fallback LocalStorage
  if (typeof window === "undefined") return { nodes: [], edges: [] };
  const raw = localStorage.getItem(getLocalGraphKey(userId));
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore parse err
    }
  }

  const starter = createStarterTemplate(userId);
  localStorage.setItem(getLocalGraphKey(userId), JSON.stringify(starter));
  return starter;
}

export async function saveUserGraph(
  userId: string,
  nodes: BacteriaNodeRecord[],
  edges: BacteriaEdgeRecord[]
): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      getLocalGraphKey(userId),
      JSON.stringify({ nodes, edges })
    );
    const edgeColors: Record<string, string> = {};
    for (const e of edges) {
      if (e.color) edgeColors[e.id] = e.color;
    }
    localStorage.setItem(
      getLocalEdgeColorsKey(userId),
      JSON.stringify(edgeColors)
    );
  }

  if (!supabase) return;

  // Sincronizare cu Supabase: upsert la toate nodurile curente + ștergerea celor eliminate
  if (nodes.length > 0) {
    await supabase.from("nodes").upsert(
      nodes.map((n) => ({
        id: n.id,
        user_id: userId,
        title: n.title,
        color_key: n.color_key,
        position_x: n.position_x,
        position_y: n.position_y,
        subsections: n.subsections,
        updated_at: new Date().toISOString(),
      }))
    );
  }

  const currentIds = nodes.map((n) => n.id);
  const { data: existingNodes } = await supabase
    .from("nodes")
    .select("id")
    .eq("user_id", userId);

  if (existingNodes) {
    const toDelete = existingNodes
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !currentIds.includes(id));
    if (toDelete.length > 0) {
      await supabase.from("nodes").delete().in("id", toDelete);
    }
  }

  // Sincronizare ramuri (edges)
  const { data: existingEdges } = await supabase
    .from("edges")
    .select("id")
    .eq("user_id", userId);

  const currentEdgeIds = edges.map((e) => e.id);
  if (existingEdges) {
    const edgesToDelete = existingEdges
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !currentEdgeIds.includes(id));
    if (edgesToDelete.length > 0) {
      await supabase.from("edges").delete().in("id", edgesToDelete);
    }
  }

  if (edges.length > 0) {
    await supabase.from("edges").upsert(
      edges.map((e) => ({
        id: e.id,
        user_id: userId,
        source_id: e.source_id,
        target_id: e.target_id,
      }))
    );
  }
}

