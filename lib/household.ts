import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type HouseholdRow = Database['public']['Tables']['households']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type HouseholdContext = {
  household: HouseholdRow;
  profile: ProfileRow;
  created: boolean;
};

type AuthUser = Pick<User, 'id' | 'email' | 'user_metadata'>;

function titleizeEmailPrefix(value: string) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function deriveDefaultNames(user: AuthUser) {
  const emailPrefix = user.email?.split('@')[0]?.trim() || 'Household';
  const metadataName = typeof user.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim()
    : '';

  return {
    householdName: metadataName ? `${metadataName} Household` : `${titleizeEmailPrefix(emailPrefix)} Household`,
    displayName: metadataName || titleizeEmailPrefix(emailPrefix)
  };
}

async function readHouseholdByOwner(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('households')
    .select('id, name, default_people_per_meal, default_leftover_enabled, created_by, created_at, updated_at')
    .eq('created_by', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function readProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, household_id, display_name, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function createHousehold(
  supabase: SupabaseClient<Database>,
  user: AuthUser
) {
  const defaults = deriveDefaultNames(user);
  const { data, error } = await supabase
    .from('households')
    .insert({
      name: defaults.householdName,
      created_by: user.id
    })
    .select('id, name, default_people_per_meal, default_leftover_enabled, created_by, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await readHouseholdByOwner(supabase, user.id);
      if (existing) {
        return existing;
      }
    }

    throw error;
  }

  return data;
}

async function createProfile(
  supabase: SupabaseClient<Database>,
  user: AuthUser,
  householdId: string
) {
  const defaults = deriveDefaultNames(user);
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      household_id: householdId,
      display_name: defaults.displayName
    })
    .select('id, household_id, display_name, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await readProfile(supabase, user.id);
      if (existing) {
        return existing;
      }
    }

    throw error;
  }

  return data;
}

async function updateProfileHousehold(
  supabase: SupabaseClient<Database>,
  userId: string,
  householdId: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ household_id: householdId })
    .eq('id', userId)
    .select('id, household_id, display_name, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureHouseholdContext(
  supabase: SupabaseClient<Database>,
  user: AuthUser
): Promise<HouseholdContext> {
  const [profile, household] = await Promise.all([
    readProfile(supabase, user.id),
    readHouseholdByOwner(supabase, user.id)
  ]);

  if (profile && household && profile.household_id === household.id) {
    return { profile, household, created: false };
  }

  let resolvedHousehold = household;
  let resolvedProfile = profile;
  let created = false;

  if (!resolvedHousehold) {
    resolvedHousehold = await createHousehold(supabase, user);
    created = true;
  }

  if (!resolvedProfile) {
    resolvedProfile = await createProfile(supabase, user, resolvedHousehold.id);
    created = true;
  } else if (resolvedProfile.household_id !== resolvedHousehold.id) {
    resolvedProfile = await updateProfileHousehold(supabase, user.id, resolvedHousehold.id);
  }

  return {
    household: resolvedHousehold,
    profile: resolvedProfile,
    created
  };
}

